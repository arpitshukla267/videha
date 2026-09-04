/**
 * Public entry for the standalone Quotation Builder module.
 * Import from this file when integrating or extracting the package.
 */

export { QuotationBuilder, type QuotationBuilderProps } from "./QuotationBuilder";
export { COMPANY, BRAND } from "./config/company";
export type {
  QuotationData,
  LineItem,
  ClientDetails,
  QuotationMeta,
  QuotationCharges,
  QuotationTerms,
  QuotationTotals,
} from "./types";
export {
  createDefaultQuotation,
  createEmptyLine,
  calculateTotals,
  formatMoney,
} from "./lib/calculations";
