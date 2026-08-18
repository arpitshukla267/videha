import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { SectionCta } from "@/components/section-cta";
import { WorldMap } from "@/components/ui/world-map";

type GlobalReachProps = {
  preview?: boolean;
};

export function GlobalReach({ preview = false }: GlobalReachProps) {
  return (
    <section className="bg-background overflow-hidden">
      <div className="mx-auto max-w-[95vw] px-5 py-24 md:px-10 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 lg:items-stretch">
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <Reveal>
                <SectionLabel>Global Trade Lanes</SectionLabel>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground text-balance md:text-5xl">
                  From India to Global Port Destinations.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                  We operate direct export supply corridors from Bihar through
                  Kolkata and JNPT ports, servicing importers, supermarkets, and
                  snack distributors across 6 primary global trade regions.
                </p>
              </Reveal>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6">
                <div>
                  <span className=" text-2xl font-semibold text-primary">
                    100%
                  </span>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    FCL / LCL Container Loading
                  </p>
                </div>
                <div>
                  <span className="font-mono text-2xl font-bold text-accent">
                    12+
                  </span>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    Target Import Markets
                  </p>
                </div>
              </div>
            </div>

            {/* {preview ? (
              <SectionCta
                href="/global-reach"
                label="Explore interactive map & ports"
                className="mt-8"
              />
            ) : (
              <div className="mt-8 pt-6 border-t border-border">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  COMPLIANCE & DOCUMENTS
                </span>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Every international shipment is dispatched with Phytosanitary
                  Certificate, Bill of Lading, Certificate of Analysis (COA),
                  and custom country-specific origin documentation.
                </p>
              </div>
            )} */}
          </div>

          <div className="lg:col-span-8 flex">
            <Reveal delay={0.1} className="w-full">
              <WorldMap compact={preview} interactive={true} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
