import { Lead } from "../models/Lead";
import { Task } from "../models/Task";
import { Order } from "../models/Order";

function extractTrailingNumber(code: string, prefix: string): number {
  if (!code.startsWith(prefix)) return 0;
  const n = parseInt(code.slice(prefix.length), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function nextLeadCode(): Promise<string> {
  const last = await Lead.findOne().sort({ createdAt: -1 }).select("leadCode").lean();
  const current = last?.leadCode ? extractTrailingNumber(last.leadCode, "VO-LEAD-") : 1000;
  return `VO-LEAD-${Math.max(1000, current) + 1}`;
}

export async function nextTaskCode(): Promise<string> {
  const last = await Task.findOne().sort({ createdAt: -1 }).select("taskCode").lean();
  const current = last?.taskCode ? extractTrailingNumber(last.taskCode, "VO-TSK-") : 200;
  return `VO-TSK-${Math.max(200, current) + 1}`;
}

export async function nextOrderCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VO-${year}-`;
  const last = await Order.findOne({ orderCode: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .select("orderCode")
    .lean();
  const current = last?.orderCode ? extractTrailingNumber(last.orderCode, prefix) : 180;
  return `${prefix}${String(Math.max(180, current) + 1).padStart(4, "0")}`;
}
