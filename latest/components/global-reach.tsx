import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { SectionCta } from "@/components/section-cta";
import { WorldMap } from "@/components/ui/world-map";
import { CountUp } from "@/components/ui/count-up";

type GlobalReachProps = {
  preview?: boolean;
};

export function GlobalReach({ preview = false }: GlobalReachProps) {
  return (
    <section className="overflow-hidden bg-videha-mist">
      <div className="mx-auto max-w-[95vw] px-5 py-24 md:px-10 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-stretch lg:gap-14">
          {/* Content */}
          <div className="flex flex-col justify-between lg:col-span-4">
            <div>
              <Reveal>
                <SectionLabel>Global Trade Lanes</SectionLabel>
              </Reveal>

              <Reveal delay={0.05}>
                <h2 className="mt-6 text-4xl font-medium leading-[1.02] tracking-[-0.04em] text-videha-navy text-balance md:text-5xl">
                  From India to Global Port Destinations.
                </h2>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-6 max-w-lg text-[15px] leading-[1.75] text-slate-600">
                  We operate direct export supply corridors from Bihar through
                  Kolkata and JNPT ports, servicing importers, supermarkets, and
                  snack distributors across 6 primary global trade regions.
                </p>
              </Reveal>

              {/* Stats */}
              <div className="mt-9 grid grid-cols-2 border-t border-videha-green/15 pt-7">
                <Reveal delay={0.15}>
                  <div className="border-r border-videha-green/10 pr-5">
                    <span className="block text-3xl font-medium tracking-[-0.04em] text-videha-green md:text-4xl">
                      <CountUp end={100} suffix="%" duration={1800} />
                    </span>

                    <p className="mt-2 max-w-[130px] text-[10px] font-medium uppercase leading-[1.45] tracking-[0.12em] text-videha-navy/55">
                      FCL / LCL Container Loading
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={0.2}>
                  <div className="pl-5">
                    <span className="block text-3xl font-medium tracking-[-0.04em] text-videha-navy md:text-4xl">
                      <CountUp end={12} suffix="+" duration={1800} />
                    </span>

                    <p className="mt-2 max-w-[130px] text-[10px] font-medium uppercase leading-[1.45] tracking-[0.12em] text-videha-navy/55">
                      Target Import Markets
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>

            {/* Optional CTA */}
            {/* {preview && (
              <SectionCta
                href="/global-reach"
                label="Explore interactive map & ports"
                className="mt-8"
              />
            )} */}
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
