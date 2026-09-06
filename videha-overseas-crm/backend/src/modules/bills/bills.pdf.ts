import PDFDocument from "pdfkit";
import type { IBill } from "../../models/Bill";

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function buildBillPdfBuffer(bill: IBill): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(20)
      .fillColor("#0c4a6e")
      .text("VIDEHA OVERSEAS", { align: "left" });
    doc
      .fontSize(10)
      .fillColor("#64748b")
      .text("Export CRM · Commercial Invoice", { align: "left" });
    doc.moveDown(0.5);

    doc
      .fontSize(16)
      .fillColor("#0f172a")
      .text("TAX INVOICE", { align: "right" });
    doc
      .fontSize(10)
      .fillColor("#475569")
      .text(`Invoice No: ${bill.billCode}`, { align: "right" })
      .text(`Order Ref: ${bill.orderCode}`, { align: "right" })
      .text(`Issue Date: ${formatDate(bill.issuedAt)}`, { align: "right" })
      .text(`Due Date: ${formatDate(bill.dueDate)}`, { align: "right" });

    doc.moveDown(1.2);
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#e2e8f0").stroke();
    doc.moveDown(0.8);

    const leftY = doc.y;
    doc.fontSize(9).fillColor("#94a3b8").text("BILL TO", 48, leftY);
    doc
      .fontSize(11)
      .fillColor("#0f172a")
      .text(bill.company, 48, leftY + 14)
      .fontSize(10)
      .fillColor("#475569")
      .text(bill.customerName, 48)
      .text(bill.billingAddress || bill.country, 48);
    if (bill.email) doc.text(bill.email, 48);
    if (bill.phone) doc.text(bill.phone, 48);

    doc.fontSize(9).fillColor("#94a3b8").text("FROM", 320, leftY);
    doc
      .fontSize(11)
      .fillColor("#0f172a")
      .text("Videha Overseas Pvt. Ltd.", 320, leftY + 14)
      .fontSize(10)
      .fillColor("#475569")
      .text("New Delhi, India", 320);
    if (bill.gstNumber) doc.text(`GSTIN: ${bill.gstNumber}`, 320);

    doc.moveDown(2);

    const tableTop = doc.y + 8;
    doc.fontSize(9).fillColor("#ffffff");
    doc.rect(48, tableTop, 499, 22).fill("#0284c7");
    doc.fillColor("#ffffff").text("Description", 56, tableTop + 6, { width: 220 });
    doc.text("Qty", 280, tableTop + 6);
    doc.text("Unit Price", 330, tableTop + 6);
    doc.text("Amount", 460, tableTop + 6, { align: "right", width: 80 });

    let rowY = tableTop + 28;
    const items = bill.lineItems?.length
      ? bill.lineItems
      : [
          {
            description: bill.products,
            quantity: bill.quantity || "1",
            unitPrice: bill.subtotal || bill.totalAmount,
            amount: bill.subtotal || bill.totalAmount,
          },
        ];

    doc.fillColor("#334155").fontSize(9);
    for (const item of items) {
      doc.text(item.description, 56, rowY, { width: 220 });
      doc.text(String(item.quantity), 280, rowY);
      doc.text(formatMoney(item.unitPrice, bill.currency), 330, rowY);
      doc.text(formatMoney(item.amount, bill.currency), 460, rowY, { align: "right", width: 80 });
      rowY += 22;
    }

    rowY += 10;
    doc.moveTo(48, rowY).lineTo(547, rowY).strokeColor("#e2e8f0").stroke();
    rowY += 14;

    const totalsX = 360;
    doc.fontSize(10).fillColor("#475569");
    doc.text("Subtotal:", totalsX, rowY);
    doc.text(formatMoney(bill.subtotal, bill.currency), 460, rowY, { align: "right", width: 80 });
    rowY += 16;
    if (bill.taxRate > 0) {
      doc.text(`Tax (${bill.taxRate}%):`, totalsX, rowY);
      doc.text(formatMoney(bill.taxAmount, bill.currency), 460, rowY, { align: "right", width: 80 });
      rowY += 16;
    }
    doc.fontSize(11).fillColor("#0f172a").text("Total:", totalsX, rowY);
    doc.text(formatMoney(bill.totalAmount, bill.currency), 460, rowY, { align: "right", width: 80 });
    rowY += 18;
    doc.fillColor("#059669").text("Amount Paid:", totalsX, rowY);
    doc.text(formatMoney(bill.amountPaid, bill.currency), 460, rowY, { align: "right", width: 80 });
    rowY += 18;
    doc.fillColor("#b45309").text("Amount Due:", totalsX, rowY);
    doc.text(formatMoney(bill.amountDue, bill.currency), 460, rowY, { align: "right", width: 80 });

    rowY += 28;
    doc.fontSize(9).fillColor("#64748b").text(`Payment Terms: ${bill.paymentTerms}`, 48, rowY);

    if (bill.invoiceNotes) {
      rowY += 20;
      doc.fontSize(9).fillColor("#94a3b8").text("NOTES", 48, rowY);
      doc.fontSize(10).fillColor("#475569").text(bill.invoiceNotes, 48, rowY + 14, { width: 499 });
      rowY += 40;
    }

    if (bill.bankDetails) {
      rowY += 10;
      doc.fontSize(9).fillColor("#94a3b8").text("BANK DETAILS", 48, rowY);
      doc.fontSize(9).fillColor("#475569").text(bill.bankDetails, 48, rowY + 14, { width: 499 });
    }

    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        "This is a computer-generated invoice from Videha Overseas CRM.",
        48,
        780,
        { align: "center", width: 499 },
      );

    doc.end();
  });
}
