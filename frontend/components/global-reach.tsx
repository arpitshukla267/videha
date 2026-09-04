import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { WorldMap } from "@/components/ui/world-map";
import { CheckCircle2 } from "lucide-react";

type GlobalReachProps = {
  preview?: boolean;
};

const TARGET_REGIONS = [
  "Middle East",
  "North America",
  "Europe",
  "Southeast Asia",
  "Australia & Oceania",
];

export function GlobalReach({ preview = false }: GlobalReachProps) {
  return (
    <section className="overflow-hidden bg-secondary/30 border-t border-border">
      <div className="mx-auto max-w-[95vw] px-5 py-12 md:px-10 md:py-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-stretch lg:gap-14">
          {/* Content */}
          <div className="flex flex-col justify-between lg:col-span-4">
            <div>
              <Reveal>
                <SectionLabel>Global Presence</SectionLabel>
              </Reveal>

              <Reveal delay={0.05}>
                <h2 className="mt-6 text-[2rem] font-medium leading-[1.02] md:tracking-[-0.04em] text-videha-navy text-balance md:text-5xl">
                  Our Target Export Markets
                </h2>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-6 max-w-lg text-[15px] leading-[1.75] text-slate-600">
                  We are structured to serve international distributors, food
                  brands, and wholesale buyers across key global regions. As an
                  agricultural products exporter from India, we tailor export
                  logistics, compliance standards, and packaging formats to meet
                  import requirements across major international markets.
                </p>
              </Reveal>

              {/* Target Regions List */}
              <div className="mt-8 border-t border-border/60 pt-6">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent block mb-4">
                  Markets We Cater To
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TARGET_REGIONS.map((region, idx) => (
                    <Reveal key={region} delay={0.15 + idx * 0.04}>
                      <div className="flex items-center gap-2.5 border border-border bg-background/80 px-3.5 py-2.5 rounded-[4px]">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs font-medium text-foreground">
                          {region}
                        </span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* World Map */}
          <div className="flex lg:col-span-8">
            <Reveal delay={0.1} className="w-full">
              <WorldMap compact={preview} interactive={true} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
