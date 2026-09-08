import { Lead } from "../models/Lead";
import { Task } from "../models/Task";
import { Order } from "../models/Order";
import { Bill } from "../models/Bill";
import { Company } from "../models/Company";
import { Customer } from "../models/Customer";
import { Quotation } from "../models/Quotation";
import { Document } from "../models/Document";
import { Shipment } from "../models/Shipment";

function extractTrailingNumber(code: string, prefix: string): number {
  if (!code.startsWith(prefix)) return 0;
  const n = parseInt(code.slice(prefix.length), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function nextLeadCode(): Promise<string> {
  const prefix = "VO-LEAD-";
  const leads = await Lead.find({ leadCode: new RegExp(`^${prefix}`) })
    .select("leadCode")
    .lean();
  let max = 1000;
  for (const row of leads) {
    const n = extractTrailingNumber(row.leadCode, prefix);
    if (n > max) max = n;
  }
  return `${prefix}${max + 1}`;
}

export async function nextTaskCode(): Promise<string> {
  const last = await Task.findOne().sort({ createdAt: -1 }).select("taskCode").lean();
  const current = last?.taskCode ? extractTrailingNumber(last.taskCode, "VO-TSK-") : 200;
  return `VO-TSK-${Math.max(200, current) + 1}`;
}

export async function nextOrderCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VO-${year}-`;
  const orders = await Order.find({ orderCode: new RegExp(`^${prefix}`) })
    .select("orderCode")
    .lean();
  let max = 180;
  for (const row of orders) {
    const n = extractTrailingNumber(row.orderCode, prefix);
    if (n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export function isDuplicateKeyError(error: unknown, field?: string): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: number; keyPattern?: Record<string, number> };
  if (err.code !== 11000) return false;
  if (field && err.keyPattern && !(field in err.keyPattern)) return false;
  return true;
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
  const prefix = "VO-QT-";
  const rows = await Quotation.find({ quotationCode: new RegExp(`^${prefix}`) })
    .select("quotationCode")
    .lean();
  let max = 100;
  for (const row of rows) {
    const n = extractTrailingNumber(row.quotationCode, prefix);
    if (n > max) max = n;
  }
  return `${prefix}${max + 1}`;
}

export async function nextDocumentCode(): Promise<string> {
  const last = await Document.findOne().sort({ createdAt: -1 }).select("documentCode").lean();
  const current = last?.documentCode ? extractTrailingNumber(last.documentCode, "VO-DOC-") : 100;
  return `VO-DOC-${Math.max(100, current) + 1}`;
}

export async function nextShipmentCode(): Promise<string> {
  const last = await Shipment.findOne().sort({ createdAt: -1 }).select("shipmentCode").lean();
  const current = last?.shipmentCode ? extractTrailingNumber(last.shipmentCode, "VO-SH-") : 100;
  return `VO-SH-${Math.max(100, current) + 1}`;
}
