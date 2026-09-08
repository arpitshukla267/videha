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
import type { RoleName } from "../models/Role";

const DEFAULT_DEPARTMENT_BY_ROLE: Partial<Record<RoleName, string>> = {
  MANAGER: "Sales",
  SALES_MEMBER: "Sales",
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
  const leadResult = await Lead.updateMany(
    {
      $or: [{ lostReason: { $exists: false } }, { convertedAt: { $exists: false } }],
    },
    { $set: { lostReason: "", convertedAt: null } },
  );
  if (leadResult.modifiedCount > 0) {
    console.log(
      `[CRM] Backfilled pipeline fields on ${leadResult.modifiedCount} Lead document(s)`,
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

/** Merge code-defined permission floors into stored role documents. */
export async function syncRolePermissionDefaults(): Promise<void> {
  for (const [name, defaults] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await Role.findOne({ name });
    if (!role) continue;

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
