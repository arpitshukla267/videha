import type { QuotationData, QuotationTotals } from "../types";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_MM = 210;

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

/**
 * Capture the dedicated A4 export sheet in-place and download a multi-page PDF.
 * Does not move the node outside `.qb-root`, so document styles stay intact.
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

  // Bring the export sheet on-screen (still invisible to the user via opacity)
  // so html2canvas paints fonts, borders, and colors reliably.
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

  const prevInline = element.getAttribute("style");
  element.style.width = `${A4_WIDTH_PX}px`;
  element.style.maxWidth = "none";
  element.style.minHeight = "1123px";
  element.style.boxShadow = "none";
  element.style.transform = "none";
  element.style.background = "#ffffff";

  try {
    await waitForImages(element);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX,
      scrollX: 0,
      scrollY: -window.scrollY,
      foreignObjectRendering: false,
      onclone: (_doc, clonedEl) => {
        // Ensure hex brand tokens exist even if clone loses inherited variables
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
      },
    });

    // PNG keeps accent colors and thin divider lines sharper than JPEG
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = A4_WIDTH_MM;
    const pageHeight = A4_HEIGHT_MM;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    while (heightLeft > 1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    const safeName = (data.meta.quotationNumber || "quotation").replace(/[^\w\-]+/g, "_");
    pdf.save(`${safeName}.pdf`);
  } finally {
    if (prevInline == null) element.removeAttribute("style");
    else element.setAttribute("style", prevInline);

    if (host) {
      if (prevHostStyle == null) host.removeAttribute("style");
      else host.setAttribute("style", prevHostStyle);
    }
  }
}
