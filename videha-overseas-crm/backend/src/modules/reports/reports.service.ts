import { Lead } from "../../models/Lead";
import { Task } from "../../models/Task";
import { Order } from "../../models/Order";
import { User } from "../../models/User";

function isOverdue(status: string, dueDate: Date): boolean {
  if (status === "Completed" || status === "Cancelled") return false;
  return dueDate.getTime() < Date.now();
}

export async function getReports() {
  const [leads, tasks, orders, users] = await Promise.all([
    Lead.find({ archived: { $ne: true } }).lean(),
    Task.find().lean(),
    Order.find().lean(),
    User.find().select("name").lean(),
  ]);

  const userName = (id: unknown) => {
    if (!id) return "Unassigned";
    const u = users.find((x) => String(x._id) === String(id));
    return u?.name || "Unknown";
  };

  const leadsByStatus: Record<string, number> = {};
  const leadsByCountry: Record<string, number> = {};
  const leadsBySource: Record<string, number> = {};
  const leadsByMember: Record<string, number> = {};

  for (const l of leads) {
    leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
    leadsByCountry[l.country] = (leadsByCountry[l.country] || 0) + 1;
    leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;
    const member = userName(l.assignedToId);
    leadsByMember[member] = (leadsByMember[member] || 0) + 1;
  }

  const totalLeads = leads.length;
  const converted = leads.filter((l) => l.status === "Converted").length;
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : "0";

  const tasksByStatus: Record<string, number> = {
    Pending: 0,
    "In Progress": 0,
    Completed: 0,
    Cancelled: 0,
  };
  let overdueTasksCount = 0;
  const tasksByMember: Record<string, { total: number; completed: number; overdue: number }> = {};

  for (const t of tasks) {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
    const ov = isOverdue(t.status, t.dueDate);
    if (ov) overdueTasksCount++;

    const memberName = userName(t.assignedToId);
    if (!tasksByMember[memberName]) {
      tasksByMember[memberName] = { total: 0, completed: 0, overdue: 0 };
    }
    tasksByMember[memberName].total++;
    if (t.status === "Completed") tasksByMember[memberName].completed++;
    if (ov) tasksByMember[memberName].overdue++;
  }

  const ordersByStatus: Record<string, number> = {};
  const ordersByCountry: Record<string, number> = {};
  let totalOrderValueINR = 0;

  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    ordersByCountry[o.country] = (ordersByCountry[o.country] || 0) + 1;
    totalOrderValueINR += o.orderValue || 0;
  }

  return {
    leads: {
      total: totalLeads,
      converted,
      conversionRate: `${conversionRate}%`,
      byStatus: leadsByStatus,
      byCountry: leadsByCountry,
      bySource: leadsBySource,
      byMember: leadsByMember,
    },
    tasks: {
      total: tasks.length,
      completed: tasksByStatus.Completed,
      pending: tasksByStatus.Pending,
      inProgress: tasksByStatus["In Progress"],
      overdue: overdueTasksCount,
      byStatus: tasksByStatus,
      byMember: tasksByMember,
    },
    orders: {
      total: orders.length,
      totalValueINR: totalOrderValueINR,
      totalValueUSD: totalOrderValueINR,
      byStatus: ordersByStatus,
      byCountry: ordersByCountry,
    },
  };
}
