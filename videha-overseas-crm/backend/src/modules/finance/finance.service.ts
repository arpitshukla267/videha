import { Bill } from "../../models/Bill";
import { resolveBillDueINR, resolveBillPaidINR } from "../../utils/currency";

export async function getFinanceOverview() {
  const bills = await Bill.find({ status: { $ne: "void" } }).lean();

  let totalRevenueINR = 0;
  let totalDueINR = 0;
  let overdueAmountINR = 0;
  let paidBillsCount = 0;
  let dueBillsCount = 0;
  let overdueBillsCount = 0;

  const revenueByCurrency: Record<string, number> = {};
  const dueByCurrency: Record<string, number> = {};
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let revenueThisMonthINR = 0;

  for (const bill of bills) {
    const currency = bill.currency || "USD";
    const paid = Number(bill.amountPaid) || 0;
    const due = Number(bill.amountDue) || 0;
    const paidINR = resolveBillPaidINR(bill);
    const dueINR = resolveBillDueINR(bill);

    totalRevenueINR += paidINR;
    totalDueINR += dueINR;
    revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + paid;
    dueByCurrency[currency] = (dueByCurrency[currency] || 0) + due;

    if (paid > 0 && bill.paidAt && new Date(bill.paidAt) >= monthStart) {
      revenueThisMonthINR += paidINR;
    }

    if (bill.status === "paid" || due <= 0) {
      paidBillsCount += 1;
    } else {
      dueBillsCount += 1;
      if (bill.dueDate && new Date(bill.dueDate) < now && due > 0) {
        overdueAmountINR += dueINR;
        overdueBillsCount += 1;
      }
    }
  }

  const recentDue = bills
    .filter((b) => (Number(b.amountDue) || 0) > 0 && b.status !== "void")
    .sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return ad - bd;
    })
    .slice(0, 8)
    .map((b) => ({
      id: String(b._id),
      billCode: b.billCode,
      orderCode: b.orderCode,
      company: b.company,
      amountDue: Number(b.amountDue) || 0,
      amountDueINR: resolveBillDueINR(b),
      totalAmount: Number(b.totalAmount) || 0,
      amountPaid: Number(b.amountPaid) || 0,
      currency: b.currency || "USD",
      dueDate: b.dueDate ? new Date(b.dueDate).toISOString() : "",
      status: b.status,
    }));

  const recentPaid = bills
    .filter((b) => (Number(b.amountPaid) || 0) > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)
    .map((b) => ({
      id: String(b._id),
      billCode: b.billCode,
      orderCode: b.orderCode,
      company: b.company,
      amountPaid: Number(b.amountPaid) || 0,
      amountPaidINR: resolveBillPaidINR(b),
      currency: b.currency || "USD",
      paidAt: b.paidAt ? new Date(b.paidAt).toISOString() : new Date(b.updatedAt).toISOString(),
    }));

  return {
    totalRevenue: Math.round(totalRevenueINR * 100) / 100,
    totalDue: Math.round(totalDueINR * 100) / 100,
    overdueAmount: Math.round(overdueAmountINR * 100) / 100,
    revenueThisMonth: Math.round(revenueThisMonthINR * 100) / 100,
    reportingCurrency: "INR",
    paidBillsCount,
    dueBillsCount,
    overdueBillsCount,
    totalBills: bills.length,
    revenueByCurrency,
    dueByCurrency,
    recentDue,
    recentPaid,
  };
}
