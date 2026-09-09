import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

import type { IBill } from "../../models/Bill";

const COLORS = {
  primary: "#3B2A23",
  primaryLight: "#F4EEE9",
  text: "#241E1A",
  muted: "#756B64",
  light: "#A49A92",
  border: "#DDD5CF",
  tableHeader: "#3B2A23",
  white: "#FFFFFF",
  success: "#3F6B4A",
  warning: "#9A6A25",
};

function formatMoney(amount: number, currency: string) {
  const symbol =
    currency === "INR"
      ? "₹"
      : currency === "USD"
        ? "$"
        : `${currency} `;

  return `${symbol}${amount.toLocaleString("en-IN", {
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
    // backend/assets/logo.png
    path.resolve(__dirname, "../../../assets/logo.png"),

    // backend/public/logo.png
    path.resolve(__dirname, "../../../public/logo.png"),

    // project frontend public folder
    path.resolve(__dirname, "../../../../frontend/public/logo.png"),

    // project crm/frontend/public folder
    path.resolve(__dirname, "../../../../frontend/public/logo.png"),

    // process working directory fallback
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

function drawSectionLabel(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
) {
  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text(text.toUpperCase(), x, y);

  return y + 14;
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

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const left = 48;
    const right = 547;
    const contentWidth = right - left;

    /*
     * ---------------------------------------------------------
     * HEADER
     * ---------------------------------------------------------
     */

    const logoPath = getLogoPath();

    if (logoPath) {
      try {
        doc.image(logoPath, left, 42, {
          fit: [145, 52],
          align: "left",
          valign: "center",
        });
      } catch {
        // Fallback to text branding if logo cannot be rendered.
        doc
          .font("Helvetica-Bold")
          .fontSize(20)
          .fillColor(COLORS.primary)
          .text("VIDEHA OVERSEAS", left, 48);
      }
    } else {
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(COLORS.primary)
        .text("VIDEHA OVERSEAS", left, 48);
    }

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text("Export CRM · Commercial Invoice", left, 82);

    // Invoice title
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(COLORS.primary)
      .text("TAX INVOICE", 350, 45, {
        width: 197,
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(`Invoice No.  ${bill.billCode}`, 350, 72, {
        width: 197,
        align: "right",
      })
      .text(`Order Ref.  ${bill.orderCode}`, 350, 87, {
        width: 197,
        align: "right",
      })
      .text(`Issue Date  ${formatDate(bill.issuedAt)}`, 350, 102, {
        width: 197,
        align: "right",
      })
      .text(`Due Date  ${formatDate(bill.dueDate)}`, 350, 117, {
        width: 197,
        align: "right",
      });

    // Brand divider
    doc
      .moveTo(left, 135)
      .lineTo(right, 135)
      .lineWidth(1.2)
      .strokeColor(COLORS.primary)
      .stroke();

    /*
     * ---------------------------------------------------------
     * BILL TO / FROM
     * ---------------------------------------------------------
     */

    const infoTop = 155;

    // Left block
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.primary)
      .text("BILL TO", left, infoTop);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.text)
      .text(bill.company || "—", left, infoTop + 16, {
        width: 225,
      });

    let billToY = infoTop + 32;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted);

    if (bill.customerName) {
      doc.text(bill.customerName, left, billToY, {
        width: 225,
      });
      billToY += 13;
    }

    doc.text(bill.billingAddress || bill.country || "—", left, billToY, {
      width: 225,
    });

    billToY += 13;

    if (bill.country && bill.billingAddress) {
      doc.text(bill.country, left, billToY, {
        width: 225,
      });
      billToY += 13;
    }

    if (bill.email) {
      doc.text(bill.email, left, billToY, {
        width: 225,
      });
      billToY += 13;
    }

    if (bill.phone) {
      doc.text(bill.phone, left, billToY, {
        width: 225,
      });
      billToY += 13;
    }

    // Right block
    const fromX = 320;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.primary)
      .text("FROM", fromX, infoTop);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.text)
      .text("Videha Overseas Pvt. Ltd.", fromX, infoTop + 16, {
        width: 227,
      });

    let fromY = infoTop + 32;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text("New Delhi, India", fromX, fromY, {
        width: 227,
      });

    fromY += 13;

    if (bill.gstNumber) {
      doc.text(`GSTIN: ${bill.gstNumber}`, fromX, fromY, {
        width: 227,
      });
      fromY += 13;
    }

    doc.text("Export & International Trade", fromX, fromY, {
      width: 227,
    });

    /*
     * ---------------------------------------------------------
     * ITEMS TABLE
     * ---------------------------------------------------------
     */

    const tableTop = Math.max(billToY, fromY) + 20;

    const descriptionX = left + 10;
    const qtyX = 290;
    const priceX = 350;
    const amountX = 465;

    const headerHeight = 27;

    // Header background
    doc
      .roundedRect(left, tableTop, contentWidth, headerHeight, 4)
      .fill(COLORS.tableHeader);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.white)
      .text("DESCRIPTION", descriptionX, tableTop + 9, {
        width: 210,
      })
      .text("QTY", qtyX, tableTop + 9, {
        width: 45,
      })
      .text("UNIT PRICE", priceX, tableTop + 9, {
        width: 95,
      })
      .text("AMOUNT", amountX, tableTop + 9, {
        width: 72,
        align: "right",
      });

    let rowY = tableTop + headerHeight;
    const rowHeight = 30;

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

    items.forEach((item, index) => {
      const background = index % 2 === 0 ? "#FBF9F7" : COLORS.white;

      doc
        .rect(left, rowY, contentWidth, rowHeight)
        .fill(background);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(COLORS.text)
        .text(item.description || "—", descriptionX, rowY + 9, {
          width: 210,
          ellipsis: true,
        })
        .text(String(item.quantity || "—"), qtyX, rowY + 9, {
          width: 45,
        })
        .text(
          formatMoney(Number(item.unitPrice) || 0, bill.currency),
          priceX,
          rowY + 9,
          {
            width: 95,
          },
        )
        .text(
          formatMoney(Number(item.amount) || 0, bill.currency),
          amountX,
          rowY + 9,
          {
            width: 72,
            align: "right",
          },
        );

      doc
        .moveTo(left, rowY + rowHeight)
        .lineTo(right, rowY + rowHeight)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke();

      rowY += rowHeight;
    });

    /*
     * ---------------------------------------------------------
     * TOTALS
     * ---------------------------------------------------------
     */

    rowY += 18;

    const totalsX = 350;
    const valueX = 465;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text("Subtotal", totalsX, rowY, {
        width: 100,
      })
      .text(
        formatMoney(bill.subtotal, bill.currency),
        valueX,
        rowY,
        {
          width: 72,
          align: "right",
        },
      );

    rowY += 17;

    if (bill.taxRate > 0) {
      doc
        .text(`Tax (${bill.taxRate}%)`, totalsX, rowY, {
          width: 100,
        })
        .text(
          formatMoney(bill.taxAmount, bill.currency),
          valueX,
          rowY,
          {
            width: 72,
            align: "right",
          },
        );

      rowY += 17;
    }

    // Total highlight
    doc
      .roundedRect(totalsX - 10, rowY - 5, 187, 30, 4)
      .fill(COLORS.primaryLight);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.primary)
      .text("TOTAL", totalsX, rowY + 4, {
        width: 100,
      })
      .text(
        formatMoney(bill.totalAmount, bill.currency),
        valueX,
        rowY + 4,
        {
          width: 72,
          align: "right",
        },
      );

    rowY += 39;

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.success)
      .text("Amount Paid", totalsX, rowY, {
        width: 100,
      })
      .text(
        formatMoney(bill.amountPaid, bill.currency),
        valueX,
        rowY,
        {
          width: 72,
          align: "right",
        },
      );

    rowY += 17;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(bill.amountDue > 0 ? COLORS.warning : COLORS.success)
      .text("Amount Due", totalsX, rowY, {
        width: 100,
      })
      .text(
        formatMoney(bill.amountDue, bill.currency),
        valueX,
        rowY,
        {
          width: 72,
          align: "right",
        },
      );

    /*
     * ---------------------------------------------------------
     * PAYMENT TERMS
     * ---------------------------------------------------------
     */

    const lowerTop = rowY + 38;

    doc
      .moveTo(left, lowerTop)
      .lineTo(right, lowerTop)
      .lineWidth(0.6)
      .strokeColor(COLORS.border)
      .stroke();

    let sectionY = lowerTop + 16;

    sectionY = drawSectionLabel(
      doc,
      "Payment Terms",
      left,
      sectionY,
    );

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(bill.paymentTerms || "—", left, sectionY, {
        width: 499,
      });

    sectionY += 27;

    /*
     * ---------------------------------------------------------
     * NOTES
     * ---------------------------------------------------------
     */

    if (bill.invoiceNotes) {
      sectionY = drawSectionLabel(
        doc,
        "Notes",
        left,
        sectionY,
      );

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text(bill.invoiceNotes, left, sectionY, {
          width: 499,
          lineGap: 2,
        });

      sectionY += 35;
    }

    /*
     * ---------------------------------------------------------
     * BANK DETAILS
     * ---------------------------------------------------------
     */

    if (bill.bankDetails) {
      sectionY = drawSectionLabel(
        doc,
        "Bank Details",
        left,
        sectionY,
      );

      // Light background for bank details
      const bankHeight = Math.max(
        48,
        doc.heightOfString(bill.bankDetails, {
          width: 475,
          fontSize: 8.5,
        }) + 22,
      );

      doc
        .roundedRect(left, sectionY - 5, contentWidth, bankHeight, 4)
        .fill("#FAF7F4");

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(COLORS.muted)
        .text(bill.bankDetails, left + 11, sectionY + 5, {
          width: 475,
          lineGap: 2,
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
      .text(
        "Videha Overseas Pvt. Ltd. · Export CRM",
        left,
        footerY,
        {
          width: 250,
          align: "left",
        },
      )
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