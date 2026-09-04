import { Lead } from "../../models/Lead";
import { Task } from "../../models/Task";
import { Order } from "../../models/Order";
import { AuditLog } from "../../models/AuditLog";
import {
  serializeLead,
  serializeTask,
  serializeOrder,
  serializeAudit,
} from "../../utils/serializers";

function isTaskOverdue(status: string, dueDate: Date): boolean {
  if (status === "Completed" || status === "Cancelled") return false;
  return dueDate.getTime() < Date.now();
}

export async function getOverview(_userId: string) {
  const leadFilter = { archived: { $ne: true } };

  const [
    leads,
    tasks,
    orders,
    recentAudit,
  ] = await Promise.all([
    Lead.find(leadFilter).populate({ path: "assignedToId", select: "name" }).lean(),
    Task.find()
      .populate([
        { path: "assignedToId", select: "name" },
        { path: "createdById", select: "name" },
        { path: "relatedLeadId", select: "name company" },
      ])
      .lean(),
    Order.find().populate({ path: "assignedToId", select: "name" }).lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const newLeads = leads.filter((l) => l.status === "New").length;
  const interestedLeads = leads.filter((l) => l.status === "Interested").length;

  const followUpsDue = leads.filter(
    (l) =>
      l.nextFollowUp &&
      l.nextFollowUp.toISOString().slice(0, 10) <= todayStr &&
      l.status !== "Converted" &&
      l.status !== "Lost",
  );

  const activeTasks = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
  const overdueTasks = activeTasks.filter((t) => isTaskOverdue(t.status, t.dueDate));

  const activeOrders = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
  const completedOrders = orders.filter((o) => o.status === "Delivered");
  const unassignedLeads = leads.filter((l) => !l.assignedToId);
  const ordersNeedingAttention = orders.filter(
    (o) => o.status === "Order Confirmed" || o.status === "Processing",
  );

  const leadDistribution: Record<string, number> = {};
  for (const l of leads) {
    leadDistribution[l.status] = (leadDistribution[l.status] || 0) + 1;
  }

  const serializedOverdue = overdueTasks
    .slice(0, 5)
    .map((t) => serializeTask(t as unknown as Record<string, unknown>));

  return {
    kpi: {
      totalLeads: leads.length,
      newLeads,
      interestedLeads,
      followUpsDueCount: followUpsDue.length,
      activeTasksCount: activeTasks.length,
      overdueTasksCount: overdueTasks.length,
      activeOrdersCount: activeOrders.length,
      completedOrdersCount: completedOrders.length,
    },
    attention: {
      overdueTasks: serializedOverdue,
      followUpsDueToday: followUpsDue
        .slice(0, 5)
        .map((l) => serializeLead(l as unknown as Record<string, unknown>)),
      unassignedLeads: unassignedLeads
        .slice(0, 5)
        .map((l) => serializeLead(l as unknown as Record<string, unknown>)),
      ordersNeedingAttention: ordersNeedingAttention
        .slice(0, 5)
        .map((o) => serializeOrder(o as unknown as Record<string, unknown>)),
    },
    leadDistribution,
    taskOverview: {
      pending: tasks.filter((t) => t.status === "Pending").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      completed: tasks.filter((t) => t.status === "Completed").length,
      overdue: overdueTasks.length,
    },
    recentActivities: recentAudit.map((a) =>
      serializeAudit(a as unknown as Record<string, unknown>),
    ),
  };
}
