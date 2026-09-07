import { COMPANY } from "../config/company";
import type { QuotationData } from "../types";
import { formatDisplayDate } from "../lib/calculations";

type Props = {
  data: QuotationData;
  pageNum: number;
  totalPages: number;
  logoSrc?: string;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

export function QuotationPageFooter({
  data,
  pageNum,
  totalPages,
  logoSrc,
  className,
  "aria-hidden": ariaHidden,
}: Props) {
  return (
    <footer
      className={className ? `qb-doc-page-footer ${className}` : "qb-doc-page-footer"}
      aria-hidden={ariaHidden}
    >
      <div className="qb-doc-page-footer-line" />
      <div className="qb-doc-page-footer-grid">
        <div className="qb-doc-page-footer-left">
          <span>
            Page {pageNum} of {totalPages}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="qb-doc-footer-logo"
            src={logoSrc || "/logo.png"}
            alt={COMPANY.brandName}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="qb-doc-page-footer-right">
          <span>Quotation No: {data.meta.quotationNumber || "—"}</span>
          <span>Quotation Date: {formatDisplayDate(data.meta.date)}</span>
          <span>Billed To: {data.client.companyName || "—"}</span>
        </div>
      </div>
    </footer>
  );
}
