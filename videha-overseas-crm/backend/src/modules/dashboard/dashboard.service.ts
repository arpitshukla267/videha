import { Lead } from "../../models/Lead";
import { Task } from "../../models/Task";
import { Order } from "../../models/Order";
import { FollowUp } from "../../models/FollowUp";
import { Quotation } from "../../models/Quotation";
import { User } from "../../models/User";
import { AuditLog } from "../../models/AuditLog";
import {
  serializeLead,
  serializeTask,
  serializeOrder,
  serializeAudit,
  serializeFollowUp,
  serializeQuotation,
} from "../../utils/serializers";
import type { AuthUser } from "../../middleware/auth";
import { buildAssigneeVisibilityFilter } from "../../utils/visibility";

function dayBounds(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function mergeVisibility(
  base: Record<string, unknown>,
  actor: AuthUser,
  assigneeField: string,
  creatorField?: string,
) {
  const visibility = await buildAssigneeVisibilityFilter(actor, assigneeField, creatorField);
  if (Object.keys(visibility).length === 0) return base;
  return { $and: [base, visibility] };
}

export async function getOverview(actor: AuthUser) {
  const leadBase = { archived: { $ne: true } };
  const { start, end } = dayBounds();
  const now = new Date();

  const leadFilter = await mergeVisibility(leadBase, actor, "assignedToId", "createdById");
  const followUpFilter = await mergeVisibility({ status: "Pending" }, actor, "assignedToId", "createdById");
  const quotationFilter = await mergeVisibility({}, actor, "assignedToId", "createdById");
  const orderFilter = await mergeVisibility({}, actor, "assignedToId", "createdById");

  const activeTaskMatch = { status: { $nin: ["Completed", "Cancelled"] } };
  const overdueTaskMatch = { ...activeTaskMatch, dueDate: { $lt: now } };
  const activeOrderMatch = { status: { $nin: ["Delivered", "Cancelled"] } };

  const closedStatuses = ["Converted", "Lost", "Not Interested"];

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    wonLeads,
    lostLeads,
    followUpsToday,
    followUpsUpcoming,
    followUpsOverdue,
    activeTasksCount,
    overdueTasksCount,
    activeOrdersCount,
    completedOrdersCount,
    quotationDraft,
    quotationSent,
    quotationAccepted,
    quotationRejected,
    quotationTotalValue,
    leadDistributionRows,
    pipelineRows,
    taskOverviewRows,
    memberPerformanceRows,
    overdueTasks,
    todayFollowUps,
    unassignedLeads,
    ordersNeedingAttention,
    recentQuotations,
    recentAudit,
  ] = await Promise.all([
    Lead.countDocuments(leadFilter),
    Lead.countDocuments({ ...leadFilter, status: "New" }),
    Lead.countDocuments({ ...leadFilter, status: { $in: ["Qualified", "Interested", "Negotiation"] } }),
    Lead.countDocuments({ ...leadFilter, status: "Converted" }),
    Lead.countDocuments({ ...leadFilter, status: { $in: ["Lost", "Not Interested"] } }),
    FollowUp.countDocuments({ ...followUpFilter, dueAt: { $gte: start, $lt: end } }),
    FollowUp.countDocuments({ ...followUpFilter, dueAt: { $gte: end } }),
    FollowUp.countDocuments({ ...followUpFilter, dueAt: { $lt: start } }),
    Task.countDocuments(activeTaskMatch),
    Task.countDocuments(overdueTaskMatch),
    Order.countDocuments({ ...orderFilter, ...activeOrderMatch }),
    Order.countDocuments({ ...orderFilter, status: "Delivered" }),
    Quotation.countDocuments({ ...quotationFilter, status: "Draft" }),
    Quotation.countDocuments({ ...quotationFilter, status: { $in: ["Sent", "Negotiation"] } }),
    Quotation.countDocuments({ ...quotationFilter, status: "Accepted" }),
    Quotation.countDocuments({ ...quotationFilter, status: { $in: ["Rejected", "Expired", "Cancelled"] } }),
    Quotation.aggregate<{ total: number }>([
      { $match: { ...quotationFilter, status: { $nin: ["Cancelled", "Rejected"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Lead.aggregate<{ _id: string; count: number }>([
      { $match: leadFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          ...leadFilter,
          status: { $nin: closedStatuses },
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Task.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.aggregate<{ _id: string; assigned: number; won: number; lost: number }>([
      { $match: leadFilter },
      {
        $group: {
          _id: "$assignedToId",
          assigned: { $sum: 1 },
          won: {
            $sum: {
              $cond: [{ $eq: ["$status", "Converted"] }, 1, 0],
            },
          },
          lost: {
            $sum: {
              $cond: [{ $in: ["$status", ["Lost", "Not Interested"]] }, 1, 0],
            },
          },
        },
      },
    ]),
    Task.find(overdueTaskMatch)
      .populate([
        { path: "assignedToId", select: "name" },
        { path: "createdById", select: "name" },
        { path: "relatedLeadId", select: "name company" },
      ])
      .sort({ dueDate: 1 })
      .limit(5)
      .lean(),
    FollowUp.find({ ...followUpFilter, dueAt: { $gte: start, $lt: end } })
      .populate([
        { path: "leadId", select: "leadCode company name" },
        { path: "assignedToId", select: "name" },
      ])
      .sort({ dueAt: 1 })
      .limit(5)
      .lean(),
    Lead.find({ ...leadFilter, assignedToId: null })
      .populate({ path: "assignedToId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Order.find({ ...orderFilter, status: { $in: ["Order Confirmed", "Processing"] } })
      .populate({ path: "assignedToId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Quotation.find(quotationFilter)
      .populate([
        { path: "assignedToId", select: "name" },
        { path: "leadId", select: "leadCode company" },
      ])
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const leadDistribution: Record<string, number> = {};
  for (const row of leadDistributionRows) {
    leadDistribution[row._id] = row.count;
  }

  const pipelineDistribution: Record<string, number> = {};
  for (const row of pipelineRows) {
    pipelineDistribution[row._id] = row.count;
  }

  const taskStatusCounts: Record<string, number> = {};
  for (const row of taskOverviewRows) {
    taskStatusCounts[row._id] = row.count;
  }

  const memberIds = memberPerformanceRows
    .map((r) => r._id)
    .filter((id) => id != null)
    .map(String);
  const members = memberIds.length
    ? await User.find({ _id: { $in: memberIds } }).select("name").lean()
    : [];
  const memberNameMap = new Map(members.map((m) => [String(m._id), m.name as string]));

  const memberPerformance = memberPerformanceRows
    .filter((row) => row._id != null)
    .map((row) => ({
      memberId: String(row._id),
      memberName: memberNameMap.get(String(row._id)) || "Unknown",
      leadsAssigned: row.assigned,
      wins: row.won,
      losses: row.lost,
      winRate:
        row.won + row.lost > 0
          ? `${Math.round((row.won / (row.won + row.lost)) * 100)}%`
          : "—",
    }))
    .sort((a, b) => b.leadsAssigned - a.leadsAssigned)
    .slice(0, 8);

  const legacyFollowUpsDueCount = await Lead.countDocuments({
    ...leadFilter,
    nextFollowUp: { $ne: null, $lt: end },
    status: { $nin: closedStatuses },
  });

  return {
    kpi: {
      totalLeads,
      newLeads,
      interestedLeads: qualifiedLeads,
      followUpsDueCount: followUpsToday + legacyFollowUpsDueCount,
      followUpsToday,
      followUpsUpcoming,
      followUpsOverdue,
      activeTasksCount,
      overdueTasksCount,
      activeOrdersCount,
      completedOrdersCount,
      wonLeads,
      lostLeads,
      quotationsDraft: quotationDraft,
      quotationsSent: quotationSent,
      quotationsAccepted: quotationAccepted,
      quotationsRejected: quotationRejected,
      quotationsTotalValue: quotationTotalValue[0]?.total ?? 0,
    },
    attention: {
      overdueTasks: overdueTasks.map((t) =>
        serializeTask(t as unknown as Record<string, unknown>),
      ),
      followUpsDueToday: todayFollowUps.map((f) =>
        serializeFollowUp(f as unknown as Record<string, unknown>),
      ),
      unassignedLeads: unassignedLeads.map((l) =>
        serializeLead(l as unknown as Record<string, unknown>),
      ),
      ordersNeedingAttention: ordersNeedingAttention.map((o) =>
        serializeOrder(o as unknown as Record<string, unknown>),
      ),
      recentQuotations: recentQuotations.map((q) =>
        serializeQuotation(q as unknown as Record<string, unknown>),
      ),
    },
    leadDistribution,
    pipelineDistribution,
    taskOverview: {
      pending: taskStatusCounts["Pending"] || 0,
      inProgress: taskStatusCounts["In Progress"] || 0,
      completed: taskStatusCounts["Completed"] || 0,
      overdue: overdueTasksCount,
    },
    memberPerformance,
    recentActivities: recentAudit.map((a) =>
      serializeAudit(a as unknown as Record<string, unknown>),
    ),
  };
}
