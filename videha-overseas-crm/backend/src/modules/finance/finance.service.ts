import { Bill } from "../../models/Bill";

export async function getFinanceOverview() {
  const bills = await Bill.find({ status: { $ne: "void" } }).lean();

  let totalRevenue = 0;
  let totalDue = 0;
  let overdueAmount = 0;
  let paidBillsCount = 0;
  let dueBillsCount = 0;
  let overdueBillsCount = 0;

  const revenueByCurrency: Record<string, number> = {};
  const dueByCurrency: Record<string, number> = {};
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let revenueThisMonth = 0;

  for (const bill of bills) {
    const currency = bill.currency || "USD";
    const paid = Number(bill.amountPaid) || 0;
    const due = Number(bill.amountDue) || 0;

    totalRevenue += paid;
    totalDue += due;
    revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + paid;
    dueByCurrency[currency] = (dueByCurrency[currency] || 0) + due;

    if (paid > 0 && bill.paidAt && new Date(bill.paidAt) >= monthStart) {
      revenueThisMonth += paid;
    }

    if (bill.status === "paid" || due <= 0) {
      paidBillsCount += 1;
    } else {
      dueBillsCount += 1;
      if (bill.dueDate && new Date(bill.dueDate) < now && due > 0) {
        overdueAmount += due;
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
      currency: b.currency || "USD",
      paidAt: b.paidAt ? new Date(b.paidAt).toISOString() : new Date(b.updatedAt).toISOString(),
    }));

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
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
