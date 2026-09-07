import type { QuotationData, QuotationTotals } from "../types";
import { A4_PAGE_HEIGHT_PX, A4_PAGE_WIDTH_PX } from "./a4";
import { formatDisplayDate } from "./calculations";

const A4_WIDTH_PX = A4_PAGE_WIDTH_PX;
const A4_HEIGHT_PX = A4_PAGE_HEIGHT_PX;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_MM = 210;
const PAGE_MARGIN_MM = 10;
/** Matches `.qb-doc-page-footer` + square logo in CSS */
const FOOTER_ZONE_MM = 26;
const FOOTER_LOGO_SIZE_PX = 72;
const FOOTER_LOGO_NUDGE_PX = 10;

function pxToMmX(px: number): number {
  return (px * A4_WIDTH_MM) / A4_WIDTH_PX;
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  ).then(() => undefined);
}

async function loadLogoDataUrl(root: HTMLElement): Promise<string | null> {
  const img =
    (root.querySelector(".qb-doc-footer-logo") as HTMLImageElement | null) ??
    (root.querySelector(".qb-doc-logo") as HTMLImageElement | null);
  if (!img?.src) return null;

  await waitForImages(root);

  try {
    const canvas = document.createElement("canvas");
    const naturalWidth = img.naturalWidth || img.width || 120;
    const naturalHeight = img.naturalHeight || img.height || 120;
    const cropSize = Math.min(naturalWidth, naturalHeight);
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const sx = (naturalWidth - cropSize) / 2;
    const sy = (naturalHeight - cropSize) / 2;
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function drawPageFooter(
  pdf: import("jspdf").jsPDF,
  pageNum: number,
  totalPages: number,
  data: QuotationData,
  logoDataUrl: string | null,
): void {
  const footerLineY = A4_HEIGHT_MM - FOOTER_ZONE_MM;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, footerLineY - 1.5, A4_WIDTH_MM, FOOTER_ZONE_MM + 2, "F");

  pdf.setDrawColor(102, 94, 82);
  pdf.setLineWidth(0.25);
  pdf.line(PAGE_MARGIN_MM, footerLineY, A4_WIDTH_MM - PAGE_MARGIN_MM, footerLineY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(31, 36, 33);

  const logoSizeMm = pxToMmX(FOOTER_LOGO_SIZE_PX);
  const logoNudgeMm = pxToMmX(FOOTER_LOGO_NUDGE_PX);
  const rightX = A4_WIDTH_MM - PAGE_MARGIN_MM;

  const metaLines = [
    `Quotation No: ${data.meta.quotationNumber || "—"}`,
    `Quotation Date: ${formatDisplayDate(data.meta.date)}`,
    `Billed To: ${data.client.companyName || "—"}`,
  ];

  metaLines.forEach((line, index) => {
    pdf.text(line, PAGE_MARGIN_MM, footerLineY + 4.5 + index * 3.8, { align: "left" });
  });

  pdf.text(`Page ${pageNum} of ${totalPages}`, rightX, footerLineY + 4.5, { align: "right" });

  if (logoDataUrl) {
    pdf.addImage(
      logoDataUrl,
      "PNG",
      rightX - logoSizeMm + logoNudgeMm,
      footerLineY + 6 - logoNudgeMm,
      logoSizeMm,
      logoSizeMm,
    );
  }
}

function applyCanvasCloneStyles(clonedEl: HTMLElement): void {
  clonedEl.style.setProperty("--qb-ink", "#1f2421");
  clonedEl.style.setProperty("--qb-muted", "#665e52");
  clonedEl.style.setProperty("--qb-line", "#d4c8b6");
  clonedEl.style.setProperty("--qb-paper", "#ffffff");
  clonedEl.style.setProperty("--qb-accent", "#c86d3b");
  clonedEl.style.setProperty("--qb-primary", "#483226");
  clonedEl.style.width = `${A4_WIDTH_PX}px`;
  clonedEl.style.maxWidth = "none";
  clonedEl.style.boxShadow = "none";
  clonedEl.style.background = "#ffffff";
  clonedEl.style.color = "#1f2421";
}

async function capturePageCanvas(
  pageEl: HTMLElement,
  html2canvas: typeof import("html2canvas")["default"],
): Promise<HTMLCanvasElement> {
  pageEl.style.width = `${A4_WIDTH_PX}px`;
  pageEl.style.height = `${A4_HEIGHT_PX}px`;
  pageEl.style.maxWidth = "none";
  pageEl.style.minHeight = `${A4_HEIGHT_PX}px`;
  pageEl.style.maxHeight = `${A4_HEIGHT_PX}px`;
  pageEl.style.boxShadow = "none";
  pageEl.style.transform = "none";
  pageEl.style.background = "#ffffff";
  pageEl.style.overflow = "hidden";

  return html2canvas(pageEl, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    windowWidth: A4_WIDTH_PX,
    scrollX: 0,
    scrollY: -window.scrollY,
    foreignObjectRendering: false,
    onclone: (_doc, clonedEl) => {
      applyCanvasCloneStyles(clonedEl);
    },
  });
}

/**
 * Capture paginated A4 sheets and download a multi-page PDF.
 */
export async function downloadQuotationPdf(
  element: HTMLElement,
  data: QuotationData,
  _totals: QuotationTotals,
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const host = element.closest(".qb-export-host") as HTMLElement | null;
  const prevHostStyle = host?.getAttribute("style") ?? null;
  const pageElements = Array.from(
    element.querySelectorAll<HTMLElement>("[data-qb-page]"),
  );

  if (host) {
    host.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      `width:${A4_WIDTH_PX}px`,
      "margin:0",
      "padding:0",
      "opacity:0",
      "pointer-events:none",
      "z-index:-1",
      "overflow:visible",
    ].join(";");
  }

  const prevRootStyle = element.getAttribute("style");
  element.style.width = `${A4_WIDTH_PX}px`;
  element.style.maxWidth = "none";
  element.style.background = "transparent";

  const savedPageStyles = pageElements.map((pageEl) => pageEl.getAttribute("style"));

  try {
    await waitForImages(element);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const logoDataUrl = await loadLogoDataUrl(element);
    const totalPages = pageElements.length || 1;

    if (pageElements.length === 0) {
      const canvas = await capturePageCanvas(element, html2canvas);
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
      drawPageFooter(pdf, 1, 1, data, logoDataUrl);
    } else {
      for (let index = 0; index < pageElements.length; index += 1) {
        const pageEl = pageElements[index];
        const canvas = await capturePageCanvas(pageEl, html2canvas);
        const imgData = canvas.toDataURL("image/png");

        if (index > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
        drawPageFooter(pdf, index + 1, totalPages, data, logoDataUrl);
      }
    }

    const safeName = (data.meta.quotationNumber || "quotation").replace(/[^\w\-]+/g, "_");
    pdf.save(`${safeName}.pdf`);
  } finally {
    if (prevRootStyle == null) element.removeAttribute("style");
    else element.setAttribute("style", prevRootStyle);

    pageElements.forEach((pageEl, index) => {
      const prev = savedPageStyles[index];
      if (prev == null) pageEl.removeAttribute("style");
      else pageEl.setAttribute("style", prev);
    });

    if (host) {
      if (prevHostStyle == null) host.removeAttribute("style");
      else host.setAttribute("style", prevHostStyle);
    }
  }
}
