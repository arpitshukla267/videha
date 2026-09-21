import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

import type { IBill } from "../../models/Bill";

// Monochrome palette — the only color on the page is the logo image itself.
// A tighter, more restrained grayscale ramp reads as "printed letterhead"
// rather than "UI screenshot".
const COLORS = {
  text: "#111111",
  muted: "#6B6B6B",
  light: "#9A9A9A",
  border: "#E3E3E3",
  headerFill: "#111111",
  headerText: "#FFFFFF",
  rowLine: "#EAEAEA",
  totalLine: "#111111",
};

// Helvetica (a PDF standard font) has no glyph for "₹", which is what was
// rendering as a broken/garbled character in the old PDF. Using plain ASCII
// prefixes avoids that entirely without needing to embed a custom font.
function formatMoney(amount: number, currency: string) {
  const prefix =
    currency === "INR" ? "Rs. " : currency === "USD" ? "$" : `${currency} `;

  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return `${prefix}${safeAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getLogoPath(): string | null {
  const candidates = [
    path.resolve(__dirname, "../../../assets/logo.png"),
    path.resolve(__dirname, "../../../public/logo.png"),
    path.resolve(__dirname, "../../../../frontend/public/logo.png"),
    path.resolve(process.cwd(), "public/logo.png"),
    path.resolve(process.cwd(), "../frontend/public/logo.png"),
    path.resolve(process.cwd(), "../crm/frontend/public/logo.png"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

// Draws left-aligned text and returns the Y position immediately below it,
// accounting for however many lines it actually wrapped to. This is the fix
// for the overlapping-text bug: the old code always advanced by a fixed
// 13px regardless of how many lines a field wrapped to.
function drawWrappedLine(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  extraGap = 4,
): number {
  const height = doc.heightOfString(text, { width });
  doc.text(text, x, y, { width });
  return y + height + extraGap;
}

// Small tracked-out caps for section labels — this one detail (letter
// spacing on a small bold label) does more for a "professional letterhead"
// feel than any color or box ever did.
function drawSectionLabel(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
) {
  doc
    .fontSize(7.5)
    .font("Helvetica-Bold")
    .fillColor(COLORS.muted)
    .text(text.toUpperCase(), x, y, { characterSpacing: 0.8 });

  return y + 15;
}

export function buildBillPdfBuffer(bill: IBill): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageHeight = 841.89;
    const left = 48;
    const right = 547;
    const contentWidth = right - left;

    /*
     * ---------------------------------------------------------
     * HEADER (logo stays in full color — everything else is B/W)
     * ---------------------------------------------------------
     */

    const logoPath = getLogoPath();

    if (logoPath) {
      try {
        doc.image(logoPath, left, 42, {
          fit: [145, 52],
          valign: "center",
        });
      } catch {
        doc
          .font("Helvetica-Bold")
          .fontSize(20)
          .fillColor(COLORS.text)
          .text("VIDEHA OVERSEAS", left, 48);
      }
    } else {
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(COLORS.text)
        .text("VIDEHA OVERSEAS", left, 48);
    }

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text("EXPORT CRM · COMMERCIAL INVOICE", left, 84, {
        characterSpacing: 0.6,
      });

    // Title, right-aligned, with the status as a small tracked-out label
    // underneath it rather than a colored pill — reads as letterhead, not UI.
    const statusLabel = (bill.status || "pending")
      .replace(/_/g, " ")
      .toUpperCase();

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor(COLORS.text)
      .text("TAX INVOICE", left, 42, { width: contentWidth, align: "right" });

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(statusLabel, left, 66, {
        width: contentWidth,
        align: "right",
        characterSpacing: 1,
      });

    // Meta block: label / value pairs, evenly spaced, right-aligned as a
    // clean two-column grid instead of loose stacked lines.
    const metaRows: [string, string][] = [
      ["Invoice No.", String(bill.billCode || "—")],
      ["Order Ref.", String(bill.orderCode || "—")],
      ["Issue Date", formatDate(bill.issuedAt)],
      ["Due Date", formatDate(bill.dueDate)],
    ];

    const metaLabelX = 300;
    const metaLabelWidth = 130;
    const metaValueX = 435;
    const metaValueWidth = right - metaValueX;

    let metaY = 92;
    metaRows.forEach(([label, value]) => {
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(COLORS.light)
        .text(label, metaLabelX, metaY, {
          width: metaLabelWidth,
          align: "right",
        });
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(COLORS.text)
        .text(value, metaValueX, metaY, {
          width: metaValueWidth,
          align: "right",
        });
      metaY += 13;
    });

    doc
      .moveTo(left, 152)
      .lineTo(right, 152)
      .lineWidth(1)
      .strokeColor(COLORS.text)
      .stroke();

    /*
     * ---------------------------------------------------------
     * BILL TO / FROM — each line now advances by its real
     * wrapped height so long addresses can never overlap.
     * ---------------------------------------------------------
     */

    const infoTop = 174;
    const colWidth = 225;

    // Left block: BILL TO
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text("BILL TO", left, infoTop, { characterSpacing: 0.8 });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.text)
      .text(bill.company || "—", left, infoTop + 16, { width: colWidth });

    let billToY =
      infoTop +
      16 +
      doc.heightOfString(bill.company || "—", { width: colWidth }) +
      6;

    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);

    if (bill.customerName) {
      billToY = drawWrappedLine(
        doc,
        bill.customerName,
        left,
        billToY,
        colWidth,
        3,
      );
    }

    // billingAddress and country are two distinct facts — only print country
    // again if it isn't already part of the address string, and give each
    // its own properly-measured line so nothing overlaps.
    const addressLine = bill.billingAddress || bill.country || "—";
    billToY = drawWrappedLine(doc, addressLine, left, billToY, colWidth, 3);

    if (
      bill.country &&
      bill.billingAddress &&
      !bill.billingAddress.includes(bill.country)
    ) {
      billToY = drawWrappedLine(doc, bill.country, left, billToY, colWidth, 3);
    }

    if (bill.email) {
      billToY = drawWrappedLine(doc, bill.email, left, billToY, colWidth, 3);
    }

    if (bill.phone) {
      billToY = drawWrappedLine(doc, bill.phone, left, billToY, colWidth, 3);
    }

    // Right block: FROM
    const fromX = 320;
    const fromWidth = 227;

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text("FROM", fromX, infoTop, { characterSpacing: 0.8 });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.text)
      .text("Videha Overseas Pvt. Ltd.", fromX, infoTop + 16, {
        width: fromWidth,
      });

    let fromY =
      infoTop +
      16 +
      doc.heightOfString("Videha Overseas Pvt. Ltd.", { width: fromWidth }) +
      6;

    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);

    fromY = drawWrappedLine(
      doc,
      "New Delhi, India",
      fromX,
      fromY,
      fromWidth,
      3,
    );

    if (bill.gstNumber) {
      fromY = drawWrappedLine(
        doc,
        `GSTIN: ${bill.gstNumber}`,
        fromX,
        fromY,
        fromWidth,
        3,
      );
    }

    fromY = drawWrappedLine(
      doc,
      "Export & International Trade",
      fromX,
      fromY,
      fromWidth,
      3,
    );

    /*
     * ---------------------------------------------------------
     * ITEMS TABLE — plain header bar, thin row rules, no
     * alternating row colors.
     * ---------------------------------------------------------
     */

    const tableTop = Math.max(billToY, fromY) + 16;

    const descriptionX = left + 10;
    const qtyX = 290;
    const priceX = 350;
    const amountX = 465;

    const headerHeight = 24;

    doc
      .rect(left, tableTop, contentWidth, headerHeight)
      .fill(COLORS.headerFill);

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.headerText)
      .text("DESCRIPTION", descriptionX, tableTop + 9, {
        width: 210,
        characterSpacing: 0.6,
      })
      .text("QTY", qtyX, tableTop + 9, { width: 45, characterSpacing: 0.6 })
      .text("UNIT PRICE", priceX, tableTop + 9, {
        width: 95,
        characterSpacing: 0.6,
      })
      .text("AMOUNT", amountX, tableTop + 9, {
        width: 72,
        align: "right",
        characterSpacing: 0.6,
      });

    let rowY = tableTop + headerHeight;
    const rowHeight = 28;

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

    items.forEach((item) => {
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(COLORS.text)
        .text(item.description || "—", descriptionX, rowY + 8, {
          width: 210,
          ellipsis: true,
        })
        .text(String(item.quantity || "—"), qtyX, rowY + 8, { width: 45 })
        .text(
          formatMoney(Number(item.unitPrice) || 0, bill.currency),
          priceX,
          rowY + 8,
          { width: 95 },
        )
        .text(
          formatMoney(Number(item.amount) || 0, bill.currency),
          amountX,
          rowY + 8,
          {
            width: 72,
            align: "right",
          },
        );

      doc
        .moveTo(left, rowY + rowHeight)
        .lineTo(right, rowY + rowHeight)
        .lineWidth(0.5)
        .strokeColor(COLORS.rowLine)
        .stroke();

      rowY += rowHeight;
    });

    /*
     * ---------------------------------------------------------
     * TOTALS — no fill boxes, just a bold rule above the total.
     * ---------------------------------------------------------
     */

    rowY += 16;

    const totalsX = 350;
    const valueX = 465;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text("Subtotal", totalsX, rowY, { width: 100 })
      .text(formatMoney(bill.subtotal, bill.currency), valueX, rowY, {
        width: 72,
        align: "right",
      });

    rowY += 16;

    if (bill.taxRate > 0) {
      doc
        .text(`Tax (${bill.taxRate}%)`, totalsX, rowY, { width: 100 })
        .text(formatMoney(bill.taxAmount, bill.currency), valueX, rowY, {
          width: 72,
          align: "right",
        });
      rowY += 16;
    }

    doc
      .moveTo(totalsX - 10, rowY)
      .lineTo(right, rowY)
      .lineWidth(1)
      .strokeColor(COLORS.totalLine)
      .stroke();

    rowY += 6;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.text)
      .text("TOTAL", totalsX, rowY, { width: 100 })
      .text(formatMoney(bill.totalAmount, bill.currency), valueX, rowY, {
        width: 72,
        align: "right",
      });

    rowY += 26;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text("Amount Paid", totalsX, rowY, { width: 100 })
      .text(formatMoney(bill.amountPaid, bill.currency), valueX, rowY, {
        width: 72,
        align: "right",
      });

    rowY += 16;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.text)
      .text("Amount Due", totalsX, rowY, { width: 100 })
      .text(formatMoney(bill.amountDue, bill.currency), valueX, rowY, {
        width: 72,
        align: "right",
      });

    /*
     * ---------------------------------------------------------
     * PAYMENT TERMS / NOTES / BANK DETAILS — each section now
     * measures its own text height before the next one starts.
     * ---------------------------------------------------------
     */

    const lowerTop = rowY + 34;

    doc
      .moveTo(left, lowerTop)
      .lineTo(right, lowerTop)
      .lineWidth(0.6)
      .strokeColor(COLORS.border)
      .stroke();

    let sectionY = lowerTop + 16;

    sectionY = drawSectionLabel(doc, "Payment Terms", left, sectionY);

    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
    sectionY = drawWrappedLine(
      doc,
      bill.paymentTerms || "—",
      left,
      sectionY,
      499,
      18,
    );

    if (bill.invoiceNotes) {
      sectionY = drawSectionLabel(doc, "Notes", left, sectionY);
      doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
      sectionY = drawWrappedLine(
        doc,
        bill.invoiceNotes,
        left,
        sectionY,
        499,
        18,
      );
    }

    if (bill.bankDetails) {
      sectionY = drawSectionLabel(doc, "Bank Details", left, sectionY);

      // A thin left rule instead of a full box — reads as a quiet aside,
      // not another card competing for attention.
      const bankHeight = doc.heightOfString(bill.bankDetails, { width: 475 });

      doc
        .moveTo(left, sectionY - 2)
        .lineTo(left, sectionY + bankHeight + 2)
        .lineWidth(1.5)
        .strokeColor(COLORS.border)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(COLORS.muted)
        .text(bill.bankDetails, left + 12, sectionY, {
          width: 475,
          lineGap: 2.5,
        });
    }

    /*
     * ---------------------------------------------------------
     * FOOTER
     * ---------------------------------------------------------
     */

    const footerY = pageHeight - 55;

    doc
      .moveTo(left, footerY - 12)
      .lineTo(right, footerY - 12)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.light)
      .text("VIDEHA OVERSEAS PVT. LTD. · EXPORT CRM", left, footerY, {
        width: 250,
        align: "left",
        characterSpacing: 0.4,
      })
      .text(
        "This is a computer-generated invoice. No signature is required.",
        295,
        footerY,
        {
          width: 252,
          align: "right",
        },
      );

    doc.end();
  });
}
