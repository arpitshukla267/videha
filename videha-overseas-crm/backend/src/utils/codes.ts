import { Lead } from "../models/Lead";
import { Task } from "../models/Task";
import { Order } from "../models/Order";
import { Bill } from "../models/Bill";
import { Company } from "../models/Company";
import { Customer } from "../models/Customer";
import { Quotation } from "../models/Quotation";

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

export async function nextBillCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VO-INV-${year}-`;
  const last = await Bill.findOne({ billCode: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .select("billCode")
    .lean();
  const current = last?.billCode ? extractTrailingNumber(last.billCode, prefix) : 0;
  return `${prefix}${String(Math.max(0, current) + 1).padStart(4, "0")}`;
}

export async function nextCompanyCode(): Promise<string> {
  const last = await Company.findOne().sort({ createdAt: -1 }).select("companyCode").lean();
  const current = last?.companyCode ? extractTrailingNumber(last.companyCode, "VO-CO-") : 100;
  return `VO-CO-${Math.max(100, current) + 1}`;
}

export async function nextCustomerCode(): Promise<string> {
  const last = await Customer.findOne().sort({ createdAt: -1 }).select("customerCode").lean();
  const current = last?.customerCode ? extractTrailingNumber(last.customerCode, "VO-CU-") : 100;
  return `VO-CU-${Math.max(100, current) + 1}`;
}

export async function nextQuotationCode(): Promise<string> {
  const last = await Quotation.findOne().sort({ createdAt: -1 }).select("quotationCode").lean();
  const current = last?.quotationCode ? extractTrailingNumber(last.quotationCode, "VO-QT-") : 100;
  return `VO-QT-${Math.max(100, current) + 1}`;
}
