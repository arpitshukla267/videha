import { Lead } from "../models/Lead";
import { Task } from "../models/Task";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { Department } from "../models/Department";
import { FollowUp } from "../models/FollowUp";
import { Company } from "../models/Company";
import { Customer } from "../models/Customer";
import { Quotation } from "../models/Quotation";

const MODELS = [Lead, Task, Order, User, Department, FollowUp, Company, Customer, Quotation] as const;

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
