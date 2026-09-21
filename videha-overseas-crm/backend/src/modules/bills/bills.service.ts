import { Types, type ClientSession } from "mongoose";
import { Bill, BILL_STATUSES, type BillStatus, type IBill, type IBillLineItem } from "../../models/Bill";
import { Order } from "../../models/Order";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextBillCode } from "../../utils/codes";
import { serializeBill, serializeBillSummary } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import { buildBillPdfBuffer } from "./bills.pdf";
import { buildBillReportingAmounts } from "../../utils/currency";

function recalcBillAmounts(bill: {
  lineItems: IBillLineItem[];
  taxRate: number;
  amountPaid: number;
}) {
  const subtotal = bill.lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxAmount = Math.round(subtotal * (bill.taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
  const safePaid = Math.min(totalAmount, Math.max(0, bill.amountPaid));
  const amountDue = Math.max(0, Math.round((totalAmount - safePaid) * 100) / 100);
  return { subtotal, taxAmount, totalAmount, amountPaid: safePaid, amountDue };
}

function deriveStatus(
  amountDue: number,
  amountPaid: number,
  totalAmount: number,
  dueDate: Date | null,
  currentStatus?: BillStatus,
): BillStatus {
  if (currentStatus === "draft" && amountPaid <= 0) return "draft";
  if (currentStatus === "void") return "void";
  if (totalAmount <= 0 && amountPaid <= 0) return "pending";
  if (amountDue <= 0) return "paid";
  if (amountPaid > 0) {
    if (dueDate && dueDate < new Date()) return "overdue";
    return "partially_paid";
  }
  if (dueDate && dueDate < new Date()) return "overdue";
  return "pending";
}

function applyBillReportingFields(bill: {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  exchangeRateSnapshot?: IBill["exchangeRateSnapshot"];
}) {
  const currencyChanged =
    bill.exchangeRateSnapshot &&
    bill.exchangeRateSnapshot.fromCurrency !== String(bill.currency || "USD").trim().toUpperCase();
  const reporting = buildBillReportingAmounts(
    {
      subtotal: bill.subtotal,
      taxAmount: bill.taxAmount,
      totalAmount: bill.totalAmount,
      amountPaid: bill.amountPaid,
      amountDue: bill.amountDue,
    },
    bill.currency,
    currencyChanged ? null : bill.exchangeRateSnapshot,
  );
  return reporting;
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

async function syncBillToOrder(bill: IBill, session?: ClientSession) {
  if (!bill.orderId) return;
  await Order.findByIdAndUpdate(
    bill.orderId,
    {
      billId: bill._id,
      billingStatus: bill.status,
      amountPaid: bill.amountPaid,
      amountDue: bill.amountDue,
    },
    { session },
  );
}

export async function syncDeliveredOrdersToBills(actorId: string) {
  const eligibleOrders = await Order.find({
    status: {
      $in: [
        "Order Confirmed",
        "Processing",
        "Production",
        "Packed",
        "Shipped",
        "In Transit",
        "Delivered",
      ],
    },
  })
    .select("_id")
    .lean();

  let created = 0;
  for (const order of eligibleOrders) {
    const exists = await Bill.findOne({ orderId: order._id }).select("_id").lean();
    if (!exists) {
      await createBillFromOrder(String(order._id), actorId);
      created += 1;
    }
  }
  return created;
}

export async function createBillFromOrder(
  orderId: string,
  actorId: string,
  session?: ClientSession,
) {
  assertObjectId(orderId, "order id");
  assertObjectId(actorId, "actor id");

  const existingQuery = Bill.findOne({ orderId });
  if (session) existingQuery.session(session);
  const existing = await existingQuery;

  if (existing) {
    await syncBillToOrder(existing, session);
    return serializeBill(existing.toObject() as unknown as Record<string, unknown>);
  }

  const orderQuery = Order.findById(orderId);
  if (session) orderQuery.session(session);
  const order = await orderQuery;
  if (!order) throw new AppError("Order not found.", 404);

  const lineItems = defaultLineItems(order.products, order.quantity, order.orderValue);
  const { subtotal, taxAmount, totalAmount, amountDue } = recalcBillAmounts({
    lineItems,
    taxRate: 0,
    amountPaid: 0,
  });

  const issuedAt = new Date();
  const dueDate = new Date(issuedAt);
  dueDate.setDate(dueDate.getDate() + 30);

  const initialStatus: BillStatus = order.status === "Draft" ? "draft" : "pending";
  const currency = order.currency || "USD";
  const reporting = applyBillReportingFields({
    subtotal,
    taxAmount,
    totalAmount,
    amountPaid: 0,
    amountDue,
    currency,
  });

  const billDocs = await Bill.create(
    [
      {
        billCode: await nextBillCode(),
        orderId: order._id,
        orderCode: order.orderCode,
        customerId: order.customerId ?? null,
        companyId: order.companyId ?? null,
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
        currency,
        exchangeRateSnapshot: reporting.exchangeRateSnapshot,
        reportingAmountINR: reporting.reportingAmountINR,
        paymentTerms: "Net 30 days from invoice date",
        status: initialStatus,
        dueDate,
        issuedAt,
        paidAt: null,
        invoiceNotes: order.notes || "",
        billingAddress: `${order.company}\n${order.country}`,
        createdById: new Types.ObjectId(actorId),
      },
    ],
    { session },
  );

  const bill = billDocs[0];

  order.billId = bill._id;
  order.billingStatus = bill.status as typeof order.billingStatus;
  order.amountPaid = 0;
  order.amountDue = amountDue;
  await order.save({ session });

  return serializeBill(bill.toObject() as unknown as Record<string, unknown>);
}

export async function listBills(
  filters: {
    search?: string;
    status?: string;
    customerId?: string;
    companyId?: string;
    orderId?: string;
    sync?: boolean;
    page?: unknown;
    limit?: unknown;
  },
  actor: AuthUser,
) {
  if (filters.sync !== false) {
    await syncDeliveredOrdersToBills(actor.id);
  }

  const query: Record<string, unknown> = {};
  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }
  if (filters.customerId && filters.customerId !== "all") {
    assertObjectId(filters.customerId, "customerId");
    query.customerId = filters.customerId;
  }
  if (filters.companyId && filters.companyId !== "all") {
    assertObjectId(filters.companyId, "companyId");
    query.companyId = filters.companyId;
  }
  if (filters.orderId && filters.orderId !== "all") {
    assertObjectId(filters.orderId, "orderId");
    query.orderId = filters.orderId;
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

  const { page, limit, skip } = parsePagination(filters);
  const [total, docs] = await Promise.all([
    Bill.countDocuments(query),
    Bill.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  const items = docs.map((d) =>
    serializeBillSummary(d.toObject() as unknown as Record<string, unknown>),
  );
  return paginatedResponse(items, total, page, limit);
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
  if (body.customerId !== undefined) {
    bill.customerId = optionalObjectId((body.customerId as string) || null) as unknown as Types.ObjectId | null;
  }
  if (body.companyId !== undefined) {
    bill.companyId = optionalObjectId((body.companyId as string) || null) as unknown as Types.ObjectId | null;
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
  bill.amountPaid = amounts.amountPaid;
  bill.amountDue = amounts.amountDue;

  const reporting = applyBillReportingFields(bill);
  bill.exchangeRateSnapshot = reporting.exchangeRateSnapshot;
  bill.reportingAmountINR = reporting.reportingAmountINR;

  if (!statusRaw) {
    bill.status = deriveStatus(bill.amountDue, bill.amountPaid, bill.totalAmount, bill.dueDate, bill.status);
  }
  if (bill.status === "paid" || bill.amountDue <= 0) {
    bill.paidAt = bill.paidAt || new Date();
  }

  await bill.save();
  await syncBillToOrder(bill);

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Bill Updated",
    entity: "Bill",
    entityId: id,
    details: `Updated invoice ${bill.billCode} for ${bill.company}. Total: ${bill.totalAmount}, Paid: ${bill.amountPaid}, Due: ${bill.amountDue}, Status: ${bill.status}.`,
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

  const newAmountPaid = Math.round((bill.amountPaid + amount) * 100) / 100;
  if (newAmountPaid > bill.totalAmount) {
    throw new AppError(
      `Payment amount (${amount}) would cause total paid (${newAmountPaid}) to exceed invoice total (${bill.totalAmount}).`,
      400,
    );
  }

  bill.amountPaid = newAmountPaid;
  const amounts = recalcBillAmounts({
    lineItems: bill.lineItems,
    taxRate: bill.taxRate,
    amountPaid: bill.amountPaid,
  });
  bill.subtotal = amounts.subtotal;
  bill.taxAmount = amounts.taxAmount;
  bill.totalAmount = amounts.totalAmount;
  bill.amountPaid = amounts.amountPaid;
  bill.amountDue = amounts.amountDue;
  bill.status = deriveStatus(bill.amountDue, bill.amountPaid, bill.totalAmount, bill.dueDate, bill.status);

  const reporting = applyBillReportingFields(bill);
  bill.exchangeRateSnapshot = reporting.exchangeRateSnapshot;
  bill.reportingAmountINR = reporting.reportingAmountINR;

  if (bill.amountDue <= 0) bill.paidAt = new Date();
  if (notes) {
    bill.invoiceNotes = bill.invoiceNotes
      ? `${bill.invoiceNotes}\n\nPayment (${new Date().toLocaleDateString()}): ${notes}`
      : `Payment (${new Date().toLocaleDateString()}): ${notes}`;
  }

  await bill.save();
  await syncBillToOrder(bill);

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Bill Payment Recorded",
    entity: "Bill",
    entityId: id,
    details: `Recorded ${amount} ${bill.currency} payment on ${bill.billCode}. Paid: ${bill.amountPaid}, Due: ${bill.amountDue}, Status: ${bill.status}.`,
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
