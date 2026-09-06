import { Types } from "mongoose";
import { Bill, BILL_STATUSES, type BillStatus, type IBillLineItem } from "../../models/Bill";
import { Order } from "../../models/Order";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { nextBillCode } from "../../utils/codes";
import { serializeBill } from "../../utils/serializers";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import { buildBillPdfBuffer } from "./bills.pdf";

function recalcBillAmounts(bill: {
  lineItems: IBillLineItem[];
  taxRate: number;
  amountPaid: number;
}) {
  const subtotal = bill.lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxAmount = Math.round(subtotal * (bill.taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
  const amountDue = Math.max(0, Math.round((totalAmount - bill.amountPaid) * 100) / 100);
  return { subtotal, taxAmount, totalAmount, amountDue };
}

function deriveStatus(amountDue: number, amountPaid: number, totalAmount: number, dueDate: Date | null): BillStatus {
  if (totalAmount <= 0 && amountPaid <= 0) return "issued";
  if (amountDue <= 0) return "paid";
  if (amountPaid > 0) {
    if (dueDate && dueDate < new Date()) return "overdue";
    return "partially_paid";
  }
  if (dueDate && dueDate < new Date()) return "overdue";
  return "issued";
}

function defaultLineItems(products: string, quantity: string, orderValue: number): IBillLineItem[] {
  return [
    {
      description: products,
      quantity: quantity || "1",
      unitPrice: orderValue,
      amount: orderValue,
    },
  ];
}

export async function syncDeliveredOrdersToBills(actorId: string) {
  const delivered = await Order.find({ status: "Delivered" }).select("_id").lean();
  let created = 0;
  for (const order of delivered) {
    const exists = await Bill.findOne({ orderId: order._id }).select("_id").lean();
    if (!exists) {
      await createBillFromOrder(String(order._id), actorId);
      created += 1;
    }
  }
  return created;
}

export async function createBillFromOrder(orderId: string, actorId: string) {
  assertObjectId(orderId, "order id");
  assertObjectId(actorId, "actor id");

  const existing = await Bill.findOne({ orderId });
  if (existing) {
    return serializeBill(existing.toObject() as unknown as Record<string, unknown>);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (order.status !== "Delivered") {
    throw new AppError("Only delivered orders can be converted to bills.", 400);
  }

  const lineItems = defaultLineItems(order.products, order.quantity, order.orderValue);
  const { subtotal, taxAmount, totalAmount, amountDue } = recalcBillAmounts({
    lineItems,
    taxRate: 0,
    amountPaid: 0,
  });

  const issuedAt = new Date();
  const dueDate = new Date(issuedAt);
  dueDate.setDate(dueDate.getDate() + 30);

  const bill = await Bill.create({
    billCode: await nextBillCode(),
    orderId: order._id,
    orderCode: order.orderCode,
    customerName: order.customerName,
    company: order.company,
    phone: order.phone,
    email: order.email,
    country: order.country,
    products: order.products,
    quantity: order.quantity,
    lineItems,
    subtotal,
    taxRate: 0,
    taxAmount,
    totalAmount,
    amountPaid: 0,
    amountDue,
    currency: order.currency || "USD",
    paymentTerms: "Net 30 days from invoice date",
    status: "issued",
    dueDate,
    issuedAt,
    paidAt: null,
    invoiceNotes: order.notes || "",
    billingAddress: `${order.company}\n${order.country}`,
    createdById: new Types.ObjectId(actorId),
  });

  return serializeBill(bill.toObject() as unknown as Record<string, unknown>);
}

export async function listBills(filters: {
  search?: string;
  status?: string;
  sync?: boolean;
}, actor: AuthUser) {
  if (filters.sync !== false) {
    await syncDeliveredOrdersToBills(actor.id);
  }

  const query: Record<string, unknown> = {};
  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }
  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { billCode: new RegExp(s, "i") },
      { orderCode: new RegExp(s, "i") },
      { company: new RegExp(s, "i") },
      { customerName: new RegExp(s, "i") },
    ];
  }

  const docs = await Bill.find(query).sort({ createdAt: -1 });
  return docs.map((d) => serializeBill(d.toObject() as unknown as Record<string, unknown>));
}

export async function getBill(id: string) {
  assertObjectId(id, "bill id");
  const bill = await Bill.findById(id);
  if (!bill) throw new AppError("Bill not found.", 404);
  return serializeBill(bill.toObject() as unknown as Record<string, unknown>);
}

export async function updateBill(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "bill id");
  const bill = await Bill.findById(id);
  if (!bill) throw new AppError("Bill not found.", 404);

  if (body.customerName !== undefined) bill.customerName = String(body.customerName);
  if (body.company !== undefined) bill.company = String(body.company);
  if (body.phone !== undefined) bill.phone = String(body.phone);
  if (body.email !== undefined) bill.email = String(body.email);
  if (body.country !== undefined) bill.country = String(body.country);
  if (body.products !== undefined) bill.products = String(body.products);
  if (body.quantity !== undefined) bill.quantity = String(body.quantity);
  if (body.paymentTerms !== undefined) bill.paymentTerms = String(body.paymentTerms);
  if (body.invoiceNotes !== undefined) bill.invoiceNotes = String(body.invoiceNotes);
  if (body.billingAddress !== undefined) bill.billingAddress = String(body.billingAddress);
  if (body.gstNumber !== undefined) bill.gstNumber = String(body.gstNumber);
  if (body.bankDetails !== undefined) bill.bankDetails = String(body.bankDetails);
  if (body.currency !== undefined) bill.currency = String(body.currency);
  if (body.taxRate !== undefined) bill.taxRate = Number(body.taxRate) || 0;
  if (body.amountPaid !== undefined) bill.amountPaid = Math.max(0, Number(body.amountPaid) || 0);
  if (body.dueDate !== undefined) {
    bill.dueDate = body.dueDate ? new Date(String(body.dueDate)) : null;
  }
  if (body.issuedAt !== undefined) {
    bill.issuedAt = body.issuedAt ? new Date(String(body.issuedAt)) : null;
  }

  if (Array.isArray(body.lineItems)) {
    bill.lineItems = (body.lineItems as IBillLineItem[]).map((item) => ({
      description: String(item.description || ""),
      quantity: String(item.quantity || "1"),
      unitPrice: Number(item.unitPrice) || 0,
      amount: Number(item.amount) || Number(item.unitPrice) || 0,
    }));
  }

  const statusRaw = body.status as string | undefined;
  if (statusRaw && BILL_STATUSES.includes(statusRaw as BillStatus)) {
    bill.status = statusRaw as BillStatus;
  }

  const amounts = recalcBillAmounts({
    lineItems: bill.lineItems,
    taxRate: bill.taxRate,
    amountPaid: bill.amountPaid,
  });
  bill.subtotal = amounts.subtotal;
  bill.taxAmount = amounts.taxAmount;
  bill.totalAmount = amounts.totalAmount;
  bill.amountDue = amounts.amountDue;

  if (!statusRaw) {
    bill.status = deriveStatus(bill.amountDue, bill.amountPaid, bill.totalAmount, bill.dueDate);
  }
  if (bill.status === "paid" || bill.amountDue <= 0) {
    bill.paidAt = bill.paidAt || new Date();
  }

  await bill.save();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Bill Updated",
    entity: "Bill",
    entityId: id,
    details: `Updated invoice ${bill.billCode} for ${bill.company}.`,
  });

  return serializeBill(bill.toObject() as unknown as Record<string, unknown>);
}

export async function recordBillPayment(
  id: string,
  amount: number,
  notes: string | undefined,
  actor: AuthUser,
) {
  assertObjectId(id, "bill id");
  if (!amount || amount <= 0) throw new AppError("Payment amount must be greater than zero.", 400);

  const bill = await Bill.findById(id);
  if (!bill) throw new AppError("Bill not found.", 404);

  bill.amountPaid = Math.round((bill.amountPaid + amount) * 100) / 100;
  const amounts = recalcBillAmounts({
    lineItems: bill.lineItems,
    taxRate: bill.taxRate,
    amountPaid: bill.amountPaid,
  });
  bill.subtotal = amounts.subtotal;
  bill.taxAmount = amounts.taxAmount;
  bill.totalAmount = amounts.totalAmount;
  bill.amountDue = amounts.amountDue;
  bill.status = deriveStatus(bill.amountDue, bill.amountPaid, bill.totalAmount, bill.dueDate);
  if (bill.amountDue <= 0) bill.paidAt = new Date();
  if (notes) {
    bill.invoiceNotes = bill.invoiceNotes
      ? `${bill.invoiceNotes}\n\nPayment (${new Date().toLocaleDateString()}): ${notes}`
      : `Payment (${new Date().toLocaleDateString()}): ${notes}`;
  }

  await bill.save();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Bill Payment Recorded",
    entity: "Bill",
    entityId: id,
    details: `Recorded ${amount} ${bill.currency} payment on ${bill.billCode}.`,
  });

  return serializeBill(bill.toObject() as unknown as Record<string, unknown>);
}

export async function getBillPdf(id: string) {
  assertObjectId(id, "bill id");
  const bill = await Bill.findById(id);
  if (!bill) throw new AppError("Bill not found.", 404);
  const buffer = await buildBillPdfBuffer(bill);
  return { buffer, filename: `${bill.billCode}.pdf` };
}
