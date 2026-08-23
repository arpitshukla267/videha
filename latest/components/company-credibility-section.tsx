import {
  Building2,
  FileCheck2,
  ShieldCheck,
  Landmark,
  Globe2,
  FileText,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

/**
 * ------------------------------------------------------------------
 * EDITABLE CONTENT — COMPANY CREDENTIALS
 * ------------------------------------------------------------------
 * Replace each "value" below with the real registration number once
 * confirmed. Remove a row entirely if it does not apply to Videha
 * Overseas Private Limited. Do not add any product/system
 * certification (ISO, HACCP, Organic, Halal, Kosher, US FDA, etc.)
 * here unless a valid document has been separately confirmed.
 * ------------------------------------------------------------------
 */
const CREDENTIALS = [
  {
    icon: FileCheck2,
    label: "IEC (Import Export Code)",
    value: "[Add IEC number]",
  },
  {
    icon: Landmark,
    label: "GST Registration",
    value: "[Add GSTIN]",
  },
  {
    icon: ShieldCheck,
    label: "FSSAI License",
    value: "[Add FSSAI license number]",
  },
  {
    icon: Globe2,
    label: "APEDA / RCMC",
    value: "[Add APEDA Registration-cum-Membership Certificate number]",
  },
  {
    icon: Building2,
    label: "CIN (Corporate Identity Number)",
    value: "[Add CIN]",
  },
  {
    icon: FileText,
    label: "Other Export Registrations",
    value: "[Add any additional applicable registration]",
  },
];

export function CompanyCredibilitySection() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-24 font-poppins">
      <div className="mx-auto max-w-[95vw] md:max-w-[90vw] px-5 md:px-10">
        {/* Company identity */}
        <Reveal>
          <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
            COMPANY CREDIBILITY
          </span>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            VIDEHA OVERSEAS PRIVATE LIMITED
          </h2>

          <p className="mt-2 text-sm md:text-base font-medium text-primary">
            Exporter of Premium Agricultural &amp; Food Products from India
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-3xl text-sm md:text-base text-muted-foreground leading-relaxed">
            Videha Overseas Private Limited is a registered Indian company
            engaged in the export of agricultural and food products to
            international buyers. Our registration and export credentials are
            listed below, and full copies of any document are available on
            request.
          </p>
        </Reveal>

        {/* Credentials grid */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CREDENTIALS.map((cred) => {
            const Icon = cred.icon;
            return (
              <div
                key={cred.label}
                className="border border-border bg-card p-5 rounded-[5px] flex flex-col gap-3"
              >
                <div className="flex flex-col md:flex-row items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5 text-accent shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground text-center">
                    {cred.label}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground italic text-center md:text-left">
                  {cred.value}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed">
          Registration details above will be updated with confirmed numbers
          before this section goes live. We do not display product or system
          certifications (such as ISO, HACCP, Organic, Halal, Kosher, or US FDA
          registration) unless a valid, current certificate has been confirmed
          and supplied by Videha Overseas.
        </p>
      </div>
    </section>
  );
}

export default CompanyCredibilitySection;
