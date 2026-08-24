import {
  Building2,
  FileCheck2,
  ShieldCheck,
  Landmark,
  Globe2,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import {
  COMPANY_REGISTRATIONS,
  REGISTRATION_DISCLAIMER,
} from "@/lib/registrations";

const REGISTRATION_ICONS = {
  iec: FileCheck2,
  gst: Landmark,
  fssai: ShieldCheck,
  "apeda-rcmc": Globe2,
  cin: Building2,
} as const;

export function CompanyCredibilitySection() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-24 font-poppins">
      <div className="mx-auto max-w-[95vw] md:max-w-[90vw] px-5 md:px-10">
        <Reveal>
          <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
            REGISTRATIONS &amp; COMPLIANCE
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
            international buyers — including makhana, fox nuts, and food grade
            guar gum. Our actual business registrations and export credentials
            are listed below. Full copies of any document are available on
            request.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANY_REGISTRATIONS.map((cred) => {
            const Icon = REGISTRATION_ICONS[cred.id];
            return (
              <div
                key={cred.id}
                className="border border-border bg-card p-5 rounded-[5px] flex flex-col gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5 text-accent shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {cred.label}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground italic">
                  {cred.value}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed">
          {REGISTRATION_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}

export default CompanyCredibilitySection;
