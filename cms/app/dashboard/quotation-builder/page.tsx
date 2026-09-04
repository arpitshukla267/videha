"use client";

/**
 * Thin CMS host page for the standalone Quotation Builder.
 * All quotation logic lives in /quotation-builder — extract that folder to reuse elsewhere.
 */
import { QuotationBuilder } from "@quotation-builder/index";

export default function QuotationBuilderPage() {
  return <QuotationBuilder logoSrc="/quotation-builder-logo.png" />;
}
