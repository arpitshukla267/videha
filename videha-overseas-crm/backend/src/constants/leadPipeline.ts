/** Primary B2B export sales pipeline stages (Phase 1A). */
export const PIPELINE_LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Sample Requested",
  "Sample Sent",
  "Negotiation",
  "Quotation Sent",
  "Won",
  "Lost",
] as const;

/** Legacy statuses kept for backward compatibility with existing data and APIs. */
export const LEGACY_LEAD_STATUSES = [
  "Interested",
  "Follow-up",
  "Not Interested",
  "Converted",
] as const;

export const LEAD_STATUSES = [...PIPELINE_LEAD_STATUSES, ...LEGACY_LEAD_STATUSES] as const;

export type PipelineLeadStatus = (typeof PIPELINE_LEAD_STATUSES)[number];
export type LegacyLeadStatus = (typeof LEGACY_LEAD_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const CLOSED_LEAD_STATUSES: LeadStatus[] = [
  "Won",
  "Lost",
  "Converted",
  "Not Interested",
];

export const WON_LEAD_STATUSES: LeadStatus[] = ["Won", "Converted"];

export const LOST_LEAD_STATUSES: LeadStatus[] = ["Lost", "Not Interested"];

/** Statuses from which a lead may be converted to a customer account. */
export const CONVERTIBLE_LEAD_STATUSES: LeadStatus[] = [
  "Qualified",
  "Sample Requested",
  "Sample Sent",
  "Negotiation",
  "Quotation Sent",
  "Interested",
  "Converted",
];

/** Suggested mapping when migrating legacy records (informational; not auto-applied). */
export const LEGACY_STATUS_MIGRATION_MAP: Partial<Record<LegacyLeadStatus, PipelineLeadStatus>> = {
  Interested: "Qualified",
  "Follow-up": "Contacted",
  "Not Interested": "Lost",
  Converted: "Won",
};

export function isClosedLeadStatus(status: string): boolean {
  return CLOSED_LEAD_STATUSES.includes(status as LeadStatus);
}

export function isWonLeadStatus(status: string): boolean {
  return WON_LEAD_STATUSES.includes(status as LeadStatus);
}

export function isLostLeadStatus(status: string): boolean {
  return LOST_LEAD_STATUSES.includes(status as LeadStatus);
}

export function isConvertibleLeadStatus(status: string): boolean {
  return CONVERTIBLE_LEAD_STATUSES.includes(status as LeadStatus);
}

/** Won is set by conversion — block manual status changes to Won via regular update. */
export function assertManualStatusChange(
  currentStatus: LeadStatus,
  nextStatus: LeadStatus,
  expectedRevision: number | undefined,
): void {
  if (nextStatus === "Won" && !isWonLeadStatus(currentStatus)) {
    throw new Error("WON_REQUIRES_CONVERT");
  }
  if (isClosedLeadStatus(currentStatus) && !isClosedLeadStatus(nextStatus)) {
    if (expectedRevision === undefined) {
      throw new Error("REVISION_REQUIRED_FOR_REOPEN");
    }
  }
}
