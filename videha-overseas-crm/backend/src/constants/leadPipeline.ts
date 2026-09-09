/** Primary B2B export sales pipeline stages (Phase 1A). */
export const PIPELINE_LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Sample Requested",
  "Sample Sent",
  "Negotiation",
  "Quotation Sent",
  "Converted",
  "Lost",
] as const;

/** Legacy statuses kept for backward compatibility with existing data and APIs. */
export const LEGACY_LEAD_STATUSES = [
  "Interested",
  "Follow-up",
  "Not Interested",
] as const;

export const LEAD_STATUSES = [...PIPELINE_LEAD_STATUSES, ...LEGACY_LEAD_STATUSES] as const;

export type PipelineLeadStatus = (typeof PIPELINE_LEAD_STATUSES)[number];
export type LegacyLeadStatus = (typeof LEGACY_LEAD_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const CLOSED_LEAD_STATUSES: LeadStatus[] = [
  "Converted",
  "Lost",
  "Not Interested",
];

/** Converted means the lead is now a customer (set only via convert flow). */
export const CONVERTED_LEAD_STATUSES: LeadStatus[] = ["Converted"];

export const LOST_LEAD_STATUSES: LeadStatus[] = ["Lost", "Not Interested"];

/** Statuses from which a lead may be converted to a customer account. */
export const CONVERTIBLE_LEAD_STATUSES: LeadStatus[] = [
  "Qualified",
  "Sample Requested",
  "Sample Sent",
  "Negotiation",
  "Quotation Sent",
  "Interested",
];

/** Suggested mapping when migrating legacy records (informational; not auto-applied). */
export const LEGACY_STATUS_MIGRATION_MAP: Partial<Record<LegacyLeadStatus, PipelineLeadStatus>> = {
  Interested: "Qualified",
  "Follow-up": "Contacted",
  "Not Interested": "Lost",
};

export function isClosedLeadStatus(status: string): boolean {
  return CLOSED_LEAD_STATUSES.includes(status as LeadStatus);
}

export function isConvertedLeadStatus(status: string): boolean {
  return CONVERTED_LEAD_STATUSES.includes(status as LeadStatus) || status === "Won";
}

/** @deprecated Use isConvertedLeadStatus — Won was removed in favor of Converted. */
export function isWonLeadStatus(status: string): boolean {
  return isConvertedLeadStatus(status);
}

export function isLostLeadStatus(status: string): boolean {
  return LOST_LEAD_STATUSES.includes(status as LeadStatus);
}

export function isConvertibleLeadStatus(status: string): boolean {
  return CONVERTIBLE_LEAD_STATUSES.includes(status as LeadStatus);
}

/** Converted is set by convert-to-customer — block manual status changes to Converted via regular update. */
export function assertManualStatusChange(
  currentStatus: LeadStatus,
  nextStatus: LeadStatus,
  expectedRevision: number | undefined,
): void {
  if (nextStatus === "Converted" && !isConvertedLeadStatus(currentStatus)) {
    throw new Error("CONVERTED_REQUIRES_CONVERT");
  }
  if (isClosedLeadStatus(currentStatus) && !isClosedLeadStatus(nextStatus)) {
    if (expectedRevision === undefined) {
      throw new Error("REVISION_REQUIRED_FOR_REOPEN");
    }
  }
}
