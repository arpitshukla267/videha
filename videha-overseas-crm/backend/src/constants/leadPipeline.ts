/** Primary B2B export sales pipeline stages (CRM Phase 1: exactly 11 stages). */
export const PIPELINE_LEAD_STATUSES = [
  "New Lead",
  "Verification",
  "Qualified",
  "Quotation Sent",
  "Follow-up",
  "Sample",
  "Negotiation",
  "Confirmed Order",
  "Payment",
  "Shipment",
  "Closed",
] as const;

/** Legacy statuses kept for backward compatibility and migration metadata. */
export const LEGACY_LEAD_STATUSES = [
  "New",
  "Contacted",
  "Sample Requested",
  "Sample Sent",
  "Converted",
  "Won",
  "Lost",
  "Not Interested",
  "Interested",
] as const;

export type LegacyLeadStatus = (typeof LEGACY_LEAD_STATUSES)[number];

/** All valid lead statuses are exactly the 11 pipeline stages. */
export const LEAD_STATUSES = [...PIPELINE_LEAD_STATUSES] as const;

export type PipelineLeadStatus = (typeof PIPELINE_LEAD_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const CLOSED_LEAD_STATUSES: LeadStatus[] = ["Closed"];

/** Stages that represent won/confirmed or closed business. */
export const CONVERTED_LEAD_STATUSES: LeadStatus[] = [
  "Confirmed Order",
  "Payment",
  "Shipment",
  "Closed",
];

export const LOST_LEAD_STATUSES: LeadStatus[] = ["Closed"];

/** Statuses from which a lead may be converted to a customer account. */
export const CONVERTIBLE_LEAD_STATUSES: LeadStatus[] = [
  "Qualified",
  "Quotation Sent",
  "Follow-up",
  "Sample",
  "Negotiation",
  "Confirmed Order",
];

/** Safe migration map for legacy records from earlier phases. */
export const LEGACY_STATUS_MIGRATION_MAP: Record<string, PipelineLeadStatus> = {
  New: "New Lead",
  Contacted: "Verification",
  Qualified: "Qualified",
  "Quotation Sent": "Quotation Sent",
  "Follow-up": "Follow-up",
  "Sample Requested": "Sample",
  "Sample Sent": "Sample",
  Sample: "Sample",
  Negotiation: "Negotiation",
  Converted: "Confirmed Order",
  Won: "Confirmed Order",
  "Confirmed Order": "Confirmed Order",
  Payment: "Payment",
  Shipment: "Shipment",
  Lost: "Closed",
  "Not Interested": "Closed",
  Interested: "Qualified",
  Closed: "Closed",
  "New Lead": "New Lead",
  Verification: "Verification",
};

/** Normalize any incoming status string into one of the 11 pipeline stages. */
export function normalizePipelineStatus(rawStatus?: string | null): LeadStatus {
  if (!rawStatus) return "New Lead";
  const trimmed = rawStatus.trim();
  if (PIPELINE_LEAD_STATUSES.includes(trimmed as LeadStatus)) {
    return trimmed as LeadStatus;
  }
  if (trimmed in LEGACY_STATUS_MIGRATION_MAP) {
    return LEGACY_STATUS_MIGRATION_MAP[trimmed];
  }
  return "New Lead";
}

export function isClosedLeadStatus(status: string): boolean {
  return CLOSED_LEAD_STATUSES.includes(status as LeadStatus);
}

export function isConvertedLeadStatus(status: string): boolean {
  return CONVERTED_LEAD_STATUSES.includes(status as LeadStatus) || status === "Converted" || status === "Won";
}

/** @deprecated Use isConvertedLeadStatus. */
export function isWonLeadStatus(status: string): boolean {
  return isConvertedLeadStatus(status);
}

export function isLostLeadStatus(status: string): boolean {
  return LOST_LEAD_STATUSES.includes(status as LeadStatus);
}

export function isConvertibleLeadStatus(status: string): boolean {
  return CONVERTIBLE_LEAD_STATUSES.includes(status as LeadStatus);
}

/** Status transition validation across all 11 stages. */
export function assertManualStatusChange(
  currentStatus: LeadStatus,
  nextStatus: LeadStatus,
  expectedRevision: number | undefined,
): void {
  if (isClosedLeadStatus(currentStatus) && !isClosedLeadStatus(nextStatus)) {
    if (expectedRevision === undefined) {
      throw new Error("REVISION_REQUIRED_FOR_REOPEN");
    }
  }
}
