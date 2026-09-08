import { Types } from "mongoose";
import { Lead } from "../../models/Lead";
import { Task } from "../../models/Task";
import { Order } from "../../models/Order";
import { FollowUp } from "../../models/FollowUp";
import { Quotation } from "../../models/Quotation";
import { User } from "../../models/User";
import { Department } from "../../models/Department";
import type { AuthUser } from "../../middleware/auth";
import { buildAssigneeVisibilityFilter } from "../../utils/visibility";
import { assertObjectId } from "../../utils/objectId";
import { AppError } from "../../utils/AppError";

function isOverdue(status: string, dueDate: Date): boolean {
  if (status === "Completed" || status === "Cancelled" || status === "Skipped") return false;
  return dueDate.getTime() < Date.now();
}

function parseDateRange(from?: string, to?: string) {
  const range: { $gte?: Date; $lte?: Date } = {};
  if (from) {
    const start = new Date(from);
    if (Number.isNaN(start.getTime())) throw new AppError("Invalid from date.", 400);
    start.setHours(0, 0, 0, 0);
    range.$gte = start;
  }
  if (to) {
    const end = new Date(to);
    if (Number.isNaN(end.getTime())) throw new AppError("Invalid to date.", 400);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
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

function toCountMap(rows: Array<{ _id: string; count: number }>) {
  const map: Record<string, number> = {};
  for (const row of rows) map[row._id || "Unknown"] = row.count;
  return map;
}

export async function getAdvancedReports(
  actor: AuthUser,
  filters: {
    from?: string;
    to?: string;
    memberId?: string;
    departmentId?: string;
  },
) {
  const createdAtRange = parseDateRange(filters.from, filters.to);
  const dateClause = createdAtRange ? { createdAt: createdAtRange } : {};

  let memberObjectId: Types.ObjectId | null = null;
  if (filters.memberId && filters.memberId !== "all") {
    assertObjectId(filters.memberId, "memberId");
    memberObjectId = new Types.ObjectId(filters.memberId);
  }

  let departmentUserIds: Types.ObjectId[] | null = null;
  if (filters.departmentId && filters.departmentId !== "all") {
    assertObjectId(filters.departmentId, "departmentId");
    const users = await User.find({ departmentId: filters.departmentId, status: "active" })
      .select("_id")
      .lean();
    departmentUserIds = users.map((user) => user._id as Types.ObjectId);
  }

  const memberClause = (field: string) => {
    const clauses: Record<string, unknown>[] = [];
    if (memberObjectId) clauses.push({ [field]: memberObjectId });
    if (departmentUserIds) clauses.push({ [field]: { $in: departmentUserIds } });
    return clauses.length ? { $and: clauses } : {};
  };

  const leadBase = {
    archived: { $ne: true },
    ...dateClause,
    ...memberClause("assignedToId"),
  };
  const followUpBase = {
    ...dateClause,
    ...memberClause("assignedToId"),
  };
  const quotationBase = {
    ...dateClause,
    ...memberClause("assignedToId"),
  };
  const orderBase = {
    ...dateClause,
    ...memberClause("assignedToId"),
  };

  const [leadFilter, followUpFilter, quotationFilter, orderFilter] = await Promise.all([
    mergeVisibility(leadBase, actor, "assignedToId", "createdById"),
    mergeVisibility(followUpBase, actor, "assignedToId", "createdById"),
    mergeVisibility(quotationBase, actor, "assignedToId", "createdById"),
    mergeVisibility(orderBase, actor, "assignedToId", "createdById"),
  ]);

  const closedWon = ["Won", "Converted"];
  const closedLost = ["Lost", "Not Interested"];

  const [
    totalLeads,
    wonLeads,
    lostLeads,
    pipelineRows,
    followUpTotal,
    followUpCompleted,
    followUpOverdue,
    followUpByTypeRows,
    quotationTotal,
    quotationAccepted,
    quotationRejected,
    quotationValueRows,
    quotationByStatusRows,
    orderTotal,
    orderDelivered,
    orderValueRows,
    orderByStatusRows,
    memberRows,
    departmentRows,
    users,
    departments,
  ] = await Promise.all([
    Lead.countDocuments(leadFilter),
    Lead.countDocuments({ ...leadFilter, status: { $in: closedWon } }),
    Lead.countDocuments({ ...leadFilter, status: { $in: closedLost } }),
    Lead.aggregate<{ _id: string; count: number }>([
      { $match: { ...leadFilter, status: { $nin: [...closedWon, ...closedLost] } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    FollowUp.countDocuments(followUpFilter),
    FollowUp.countDocuments({ ...followUpFilter, status: "Completed" }),
    FollowUp.countDocuments({ ...followUpFilter, status: "Pending", dueAt: { $lt: new Date() } }),
    FollowUp.aggregate<{ _id: string; count: number }>([
      { $match: followUpFilter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
    Quotation.countDocuments(quotationFilter),
    Quotation.countDocuments({ ...quotationFilter, status: "Accepted" }),
    Quotation.countDocuments({ ...quotationFilter, status: { $in: ["Rejected", "Expired", "Cancelled"] } }),
    Quotation.aggregate<{ _id: string; total: number; count: number }>([
      { $match: quotationFilter },
      { $group: { _id: "$currency", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]),
    Quotation.aggregate<{ _id: string; count: number }>([
      { $match: quotationFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Order.countDocuments(orderFilter),
    Order.countDocuments({ ...orderFilter, status: "Delivered" }),
    Order.aggregate<{ _id: string; total: number; count: number }>([
      { $match: orderFilter },
      { $group: { _id: "$currency", total: { $sum: "$orderValue" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: string; count: number }>([
      { $match: orderFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.aggregate<{ _id: string; total: number; won: number; lost: number; orders: number }>([
      { $match: leadFilter },
      {
        $group: {
          _id: "$assignedToId",
          total: { $sum: 1 },
          won: { $sum: { $cond: [{ $in: ["$status", closedWon] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $in: ["$status", closedLost] }, 1, 0] } },
          orders: { $sum: 0 },
        },
      },
    ]),
    User.aggregate<{ _id: string; total: number; completed: number; overdue: number }>([
      { $match: { status: "active", ...(departmentUserIds ? { _id: { $in: departmentUserIds } } : {}) } },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "assignedToId",
          as: "tasks",
        },
      },
      { $unwind: { path: "$tasks", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          total: { $sum: { $cond: [{ $ifNull: ["$tasks._id", false] }, 1, 0] } },
          completed: {
            $sum: { $cond: [{ $eq: ["$tasks.status", "Completed"] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ifNull: ["$tasks._id", false] },
                    { $not: { $in: ["$tasks.status", ["Completed", "Cancelled"]] } },
                    { $lt: ["$tasks.dueDate", new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    User.find({ status: "active" }).select("name departmentId").lean(),
    Department.find().select("name").lean(),
  ]);

  const userName = (id: unknown) => {
    if (!id) return "Unassigned";
    const user = users.find((entry) => String(entry._id) === String(id));
    return user?.name || "Unknown";
  };

  const departmentName = (id: unknown) => {
    if (!id) return "Unassigned";
    const dept = departments.find((entry) => String(entry._id) === String(id));
    return dept?.name || "Unknown";
  };

  const conversionRate = totalLeads > 0 ? `${((wonLeads / totalLeads) * 100).toFixed(1)}%` : "0%";
  const winLossRatio = lostLeads > 0 ? (wonLeads / lostLeads).toFixed(2) : String(wonLeads);
  const followUpCompletionRate =
    followUpTotal > 0 ? `${((followUpCompleted / followUpTotal) * 100).toFixed(1)}%` : "0%";
  const quotationAcceptRate =
    quotationTotal > 0 ? `${((quotationAccepted / quotationTotal) * 100).toFixed(1)}%` : "0%";
  const orderFulfillmentRate =
    orderTotal > 0 ? `${((orderDelivered / orderTotal) * 100).toFixed(1)}%` : "0%";

  const memberPerformance = memberRows
    .map((row) => ({
      memberId: row._id ? String(row._id) : "",
      memberName: userName(row._id),
      leads: row.total,
      won: row.won,
      lost: row.lost,
      winRate: row.total > 0 ? `${((row.won / row.total) * 100).toFixed(1)}%` : "0%",
    }))
    .sort((a, b) => b.leads - a.leads);

  const departmentPerformance = departments.map((dept) => {
    const deptUsers = users.filter((user) => String(user.departmentId) === String(dept._id));
    const deptMemberPerf = memberPerformance.filter((member) =>
      deptUsers.some((user) => String(user._id) === member.memberId),
    );
    const leads = deptMemberPerf.reduce((sum, row) => sum + row.leads, 0);
    const won = deptMemberPerf.reduce((sum, row) => sum + row.won, 0);
    return {
      departmentId: String(dept._id),
      departmentName: dept.name,
      leads,
      won,
      winRate: leads > 0 ? `${((won / leads) * 100).toFixed(1)}%` : "0%",
      members: deptMemberPerf.length,
    };
  });

  return {
    filters: {
      from: filters.from || null,
      to: filters.to || null,
      memberId: filters.memberId || null,
      departmentId: filters.departmentId || null,
    },
    pipeline: {
      openByStage: toCountMap(pipelineRows),
      totalOpen: pipelineRows.reduce((sum, row) => sum + row.count, 0),
    },
    leads: {
      total: totalLeads,
      won: wonLeads,
      lost: lostLeads,
      conversionRate,
      winLossRatio,
    },
    followUps: {
      total: followUpTotal,
      completed: followUpCompleted,
      overdue: followUpOverdue,
      completionRate: followUpCompletionRate,
      byType: toCountMap(followUpByTypeRows),
    },
    quotations: {
      total: quotationTotal,
      accepted: quotationAccepted,
      rejected: quotationRejected,
      acceptRate: quotationAcceptRate,
      byStatus: toCountMap(quotationByStatusRows),
      valueByCurrency: quotationValueRows.map((row) => ({
        currency: row._id || "USD",
        total: row.total,
        count: row.count,
      })),
    },
    orders: {
      total: orderTotal,
      delivered: orderDelivered,
      fulfillmentRate: orderFulfillmentRate,
      byStatus: toCountMap(orderByStatusRows),
      valueByCurrency: orderValueRows.map((row) => ({
        currency: row._id || "USD",
        total: row.total,
        count: row.count,
      })),
    },
    team: {
      byMember: memberPerformance,
      byDepartment: departmentPerformance,
    },
  };
}
