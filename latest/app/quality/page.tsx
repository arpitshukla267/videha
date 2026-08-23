import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ClipboardList,
  Users,
  FileCheck2,
  Building2,
  ArrowRight,
  FileText,
  Info,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Quality & Compliance — Videha Overseas",
  description:
    "How Videha Overseas approaches quality control, supplier verification, documentation, and buyer-specific requirements for export shipments.",
};

/**
 * ------------------------------------------------------------------
 * EDITABLE CONTENT — BUSINESS REGISTRATIONS & EXPORT CREDENTIALS
 * ------------------------------------------------------------------
 * Only list a credential here once the corresponding document/number
 * has been confirmed and supplied by Videha Overseas. Do NOT add
 * ISO, HACCP, Organic, Halal, Kosher, US FDA, or any other
 * certification unless it has been explicitly confirmed and a valid
 * document exists to support it.
 *
 * Replace the "value" fields below with the real registration
 * numbers / details, or remove a row entirely if it does not apply.
 * ------------------------------------------------------------------
 */
const REGISTRATIONS = [
  {
    label: "Company Registration / Incorporation",
    value: "[Add company registration / incorporation number]",
  },
  {
    label: "Import Export Code (IEC)",
    value: "[Add IEC number]",
  },
  {
    label: "GST Registration",
    value: "[Add GSTIN]",
  },
  {
    label: "MSME / Udyam Registration",
    value: "[Add Udyam registration number, if applicable]",
  },
  {
    label: "AD Code (Authorized Dealer Code)",
    value: "[Add AD Code, if applicable]",
  },
  {
    label: "RCMC (Export Promotion Council Membership)",
    value: "[Add RCMC number and issuing council, if applicable]",
  },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Consistent Product Quality",
    copy: "Every batch is produced and packed against a defined set of internal parameters, so buyers receive the same quality lot after lot, shipment after shipment.",
  },
  {
    icon: Users,
    title: "Supplier Verification",
    copy: "Raw material is sourced from vetted growers and processors. We track where each lot originates from so quality issues can be traced back and corrected at the source.",
  },
  {
    icon: ClipboardList,
    title: "Appropriate Documentation",
    copy: "We prepare the commercial, shipping, and quality documentation relevant to each order — matched to what the destination market and the buyer's contract actually require.",
  },
  {
    icon: FileCheck2,
    title: "Buyer-Specific Requirements",
    copy: "Different buyers test for different parameters. We work directly with procurement and QA teams to understand their specification sheet and confirm it against our product before shipment.",
  },
];

export default function QualityCompliancePage() {
  const getContactLink = (subject: string, message: string) =>
    `/contact?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;

  return (
    <main
      className="overflow-hidden bg-background pt-24 font-poppins"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* 1. HERO */}
      <section className="border-b border-border bg-background py-16 md:py-24">
        <div className="mx-auto max-w-[90vw] px-5 md:px-10">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
              QUALITY & COMPLIANCE
            </span>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl">
              How We Approach Quality
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Our focus is on maintaining consistent product quality, verified
              suppliers, appropriate documentation, and the ability to meet
              buyer-specific quality requirements — rather than on collecting
              certification badges. Below is an honest picture of how we manage
              quality internally, along with our actual business registrations
              and export credentials.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. FOUR PILLARS */}
      <section className="py-16 md:py-24 border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto max-w-[90vw] px-5 md:px-10">
          <div className="mb-12 max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.24em] text-primary">
              OUR APPROACH
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              What Quality Means at Videha Overseas
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="border border-border bg-background p-6 md:p-7 rounded-[5px]"
                >
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-4 text-base md:text-lg font-bold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {pillar.copy}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. BUSINESS REGISTRATIONS & EXPORT CREDENTIALS */}
      <section className="py-16 md:py-24 border-b border-border bg-background">
        <div className="mx-auto max-w-[90vw] px-5 md:px-10">
          <div className="mb-10 max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
              BUSINESS REGISTRATIONS
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Registrations & Export Credentials
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              The details below reflect the registrations and credentials
              actually held by Videha Overseas. Fields marked as placeholders
              will be updated with the final registration numbers before this
              page goes live.
            </p>
          </div>

          <div className="border border-border bg-card rounded-[5px] divide-y divide-border overflow-hidden">
            {REGISTRATIONS.map((reg) => (
              <div
                key={reg.label}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4.5 items-baseline"
              >
                <span className="flex items-center gap-2 text-xs md:text-sm font-medium uppercase tracking-wider text-foreground">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  {reg.label}
                </span>
                <span className="sm:col-span-2 text-sm text-muted-foreground italic">
                  {reg.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 border border-dashed border-border bg-secondary/20 p-4 rounded-[5px]">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              We do not list product or system certifications (such as ISO,
              HACCP, Organic, Halal, Kosher, or US FDA registration) on this
              page unless a valid, current certificate has been confirmed and
              provided by Videha Overseas. If any such certification applies to
              your order, please ask our export desk and we will share the
              relevant document directly.
            </p>
          </div>
        </div>
      </section>

      {/* 4. DOCUMENTATION ON REQUEST */}
      <section className="py-16 md:py-24 bg-[#f8f6f0] border-b border-border">
        <div className="mx-auto max-w-[90vw] px-5 md:px-10">
          <div className="mb-10 max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.24em] text-primary">
              PER-SHIPMENT DOCUMENTATION
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              What We Provide With Each Order
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Alongside the commercial paperwork for your shipment, we can
              prepare the following on request, matched to what your specific
              order and destination require:
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Batch-specific Certificate of Analysis (COA)",
              "Commercial Invoice & Packing List",
              "Certificate of Origin",
              "Buyer-specific quality declaration or checklist",
            ].map((doc) => (
              <li
                key={doc}
                className="flex items-start gap-3 border border-border bg-background p-4 rounded-[5px]"
              >
                <FileText className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-[90vw] px-5 md:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-border bg-[#514536] text-white p-8 md:p-12 rounded-[5px]">
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                HAVE A SPECIFIC REQUIREMENT?
              </span>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-white">
                Talk to Our Quality & Export Desk
              </h2>
              <p className="mt-3 max-w-2xl text-xs md:text-sm leading-relaxed text-white/70">
                Share your specification sheet, buyer quality checklist, or any
                documentation requirement and we will confirm what we can
                provide before you place an order.
              </p>
            </div>

            <Link
              href={getContactLink(
                "Quality & Compliance Enquiry",
                "Hello, we would like to discuss your quality control process, supplier verification, and documentation available for our specific order requirements.",
              )}
              className="group inline-flex shrink-0 items-center gap-3 bg-white px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-black transition-colors hover:bg-secondary"
            >
              Contact Quality Desk
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
