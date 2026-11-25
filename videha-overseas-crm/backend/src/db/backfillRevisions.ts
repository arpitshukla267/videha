import { Lead } from "../models/Lead";
import { Task } from "../models/Task";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { Department } from "../models/Department";
import { FollowUp } from "../models/FollowUp";
import { Company } from "../models/Company";
import { Customer } from "../models/Customer";
import { Quotation } from "../models/Quotation";
import { Role } from "../models/Role";
import { ROLE_PERMISSIONS, resolveRolePermissions } from "../constants/permissions";
import type { RoleName, VisibilityScope } from "../models/Role";

const DEFAULT_DEPARTMENT_BY_ROLE: Partial<Record<RoleName, string>> = {
  MANAGER: "Sales",
  SALES: "Sales",
  SALES_MEMBER: "Sales",
  SALES_CRM: "Sales",
  SALES_MARKETING_CMS: "Sales",
  OPERATIONS: "Operations",
};

const MODELS = [Lead, Task, Order, User, Department, FollowUp, Company, Customer, Quotation] as const;
const CLIENT_REQUEST_ID_MODELS = [Lead, Task, Order, Quotation] as const;

export async function backfillMissingRevisions(): Promise<void> {
  for (const model of MODELS) {
    const result = await model.updateMany(
      { revision: { $exists: false } },
      { $set: { revision: 0 } },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `[CRM] Backfilled revision on ${result.modifiedCount} ${model.modelName} document(s)`,
      );
    }
  }
}

/** Explicit null breaks sparse unique indexes — omit the field instead. */
export async function backfillNullClientRequestIds(): Promise<void> {
  for (const model of CLIENT_REQUEST_ID_MODELS) {
    const result = await model.updateMany(
      { clientRequestId: null },
      { $unset: { clientRequestId: "" } },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `[CRM] Unset null clientRequestId on ${result.modifiedCount} ${model.modelName} document(s)`,
      );
    }
  }
}

export async function backfillLeadPipelineFields(): Promise<void> {
  const migrations: Record<string, string> = {
    New: "New Lead",
    Contacted: "Verification",
    "Sample Requested": "Sample",
    "Sample Sent": "Sample",
    Converted: "Confirmed Order",
    Won: "Confirmed Order",
    Lost: "Closed",
    "Not Interested": "Closed",
    Interested: "Qualified",
  };

  for (const [oldStatus, newStatus] of Object.entries(migrations)) {
    const res = await Lead.updateMany(
      { status: oldStatus },
      { $set: { status: newStatus } },
    );
    if (res.modifiedCount > 0) {
      console.log(
        `[CRM] Migrated ${res.modifiedCount} Lead(s) from "${oldStatus}" → "${newStatus}"`,
      );
    }
  }

  const leadResult = await Lead.updateMany(
    {
      $or: [
        { lostReason: { $exists: false } },
        { convertedAt: { $exists: false } },
        { containerType: { $exists: false } },
        { assignmentDetails: { $exists: false } },
      ],
    },
    {
      $set: {
        lostReason: "",
        convertedAt: null,
        containerType: "20ft FCL",
        assignmentDetails: {},
      },
    },
  );
  if (leadResult.modifiedCount > 0) {
    console.log(
      `[CRM] Backfilled pipeline & Phase 1 fields on ${leadResult.modifiedCount} Lead document(s)`,
    );
  }
}

/** Create FollowUp records for legacy leads that only have nextFollowUp set. */
export async function backfillFollowUpsFromLeads(): Promise<void> {
  // Explicit null values break sparse unique index on clientRequestId — remove them first.
  const unsetResult = await FollowUp.updateMany(
    { clientRequestId: null },
    { $unset: { clientRequestId: "" } },
  );
  if (unsetResult.modifiedCount > 0) {
    console.log(
      `[CRM] Unset null clientRequestId on ${unsetResult.modifiedCount} FollowUp document(s)`,
    );
  }

  const leads = await Lead.find({
    archived: { $ne: true },
    nextFollowUp: { $ne: null },
  })
    .select("_id assignedToId nextFollowUp createdById")
    .lean();

  let created = 0;
  for (const lead of leads) {
    const pending = await FollowUp.countDocuments({ leadId: lead._id, status: "Pending" });
    if (pending > 0) continue;

    const assignedToId = lead.assignedToId ?? lead.createdById;
    if (!assignedToId) continue;

    await FollowUp.create({
      leadId: lead._id,
      assignedToId,
      dueAt: lead.nextFollowUp,
      type: "Call",
      status: "Pending",
      outcome: "",
      notes: "Migrated from lead next follow-up.",
      createdById: lead.createdById ?? assignedToId,
    });
    created += 1;
  }

  if (created > 0) {
    console.log(`[CRM] Backfilled ${created} FollowUp record(s) from lead nextFollowUp fields`);
  }
}

const ROLE_META_DEFAULTS: Record<
  string,
  { displayName: string; description: string; scope: VisibilityScope }
> = {
  SUPER_ADMIN: {
    displayName: "Super Admin",
    description: "Full administrative access across the entire Videha Overseas CRM system.",
    scope: "all",
  },
  ADMIN: {
    displayName: "Administrator",
    description: "Manage CRM operations, team members, leads, tasks, orders, and reports.",
    scope: "all",
  },
  MANAGER: {
    displayName: "Manager",
    description: "Oversee assigned sales and operational teams, delegate leads, and monitor tasks.",
    scope: "department",
  },
  SALES_MEMBER: {
    displayName: "Sales Member",
    description: "Manage client leads, qualify product interests, schedule follow-ups, and update tasks.",
    scope: "own",
  },
  SALES_CRM: {
    displayName: "Sales / CRM",
    description: "Manage client leads, customer accounts, quotations, follow-ups, and CRM operations.",
    scope: "own",
  },
  SALES_MARKETING_CMS: {
    displayName: "Sales / Marketing / CMS",
    description: "Sales, marketing inquiries, and CMS support (subject to final role approval).",
    scope: "own",
  },
  OPERATIONS: {
    displayName: "Operations Specialist",
    description: "Handle logistics, cargo shipping, order milestones, and operational dispatch.",
    scope: "team",
  },
};

/** Merge code-defined permission floors into stored role documents. */
export async function syncRolePermissionDefaults(): Promise<void> {
  const systemScope: Partial<Record<RoleName, string>> = {
    SUPER_ADMIN: "all",
    ADMIN: "all",
    MANAGER: "department",
    OPERATIONS: "team",
    SALES_MEMBER: "own",
    SALES_CRM: "own",
    SALES_MARKETING_CMS: "own",
  };

  await Role.updateMany(
    { name: { $in: Object.keys(ROLE_PERMISSIONS) }, isSystem: { $ne: true } },
    { $set: { isSystem: true } },
  );

  for (const [name, defaults] of Object.entries(ROLE_PERMISSIONS)) {
    let role = await Role.findOne({ name });
    const meta = ROLE_META_DEFAULTS[name] || {
      displayName: name,
      description: "",
      scope: (systemScope[name as RoleName] as VisibilityScope) || "own",
    };

    if (!role) {
      role = await Role.create({
        name,
        displayName: meta.displayName,
        description: meta.description,
        permissions: defaults,
        isSystem: true,
        visibilityScope: meta.scope,
      });
      console.log(`[CRM] Created system role ${name}`);
      continue;
    }

    if (!role.isSystem) role.isSystem = true;
    if (!role.visibilityScope && systemScope[name as RoleName]) {
      role.visibilityScope = systemScope[name as RoleName] as VisibilityScope;
    }

    const merged = resolveRolePermissions(name, role.permissions);
    const current = [...role.permissions].sort().join("|");
    const next = [...merged].sort().join("|");
    if (current === next) continue;

    role.permissions = merged;
    await role.save();
    console.log(`[CRM] Synced ${merged.length} permission(s) for role ${name}`);
  }
}

/** Ensure scoped roles always have a department for visibility filters. */
export async function backfillUserDepartments(): Promise<void> {
  for (const [roleName, departmentName] of Object.entries(DEFAULT_DEPARTMENT_BY_ROLE) as Array<
    [RoleName, string]
  >) {
    const escaped = departmentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dept = await Department.findOne({
      name: new RegExp(`^${escaped}$`, "i"),
      status: "active",
    })
      .select("_id")
      .lean();
    if (!dept?._id) continue;

    const result = await User.updateMany(
      {
        roleName,
        $or: [{ departmentId: null }, { departmentId: { $exists: false } }],
      },
      { $set: { departmentId: dept._id } },
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[CRM] Backfilled departmentId (${departmentName}) on ${result.modifiedCount} ${roleName} user(s)`,
      );
    }
  }
}

/** Ensure core CRM employees exist: MD, Shilpa Shelar, and Sejal Bidgar.
 *  Uses the REAL email addresses — never creates corporate aliases. */
export async function ensureCoreCrmRolesAndUsers(): Promise<void> {
  await Department.findOneAndUpdate(
    { name: "Management" },
    { name: "Management", description: "Executive leadership and CRM administration", status: "active" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await Department.findOneAndUpdate(
    { name: "Sales" },
    { name: "Sales", description: "International trade & sales desks", status: "active" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Roles are synced by syncRolePermissionDefaults — nothing else to do here.
  // Users already exist in the database; do NOT upsert duplicates.
  console.log("[CRM] ensureCoreCrmRolesAndUsers: departments verified (users managed via cleanup script).");
}
