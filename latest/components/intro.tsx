import Image from "next/image";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/ui/count-up";

const FACTS = [
  {
    value: 12,
    suffix: "+",
    label: "Global markets served",
  },
  {
    value: 100,
    suffix: "%",
    label: "Traceable sourcing",
  },
  {
    value: 24,
    suffix: "T",
    label: "Monthly export capacity",
  },
];

export function Intro() {
  return (
    <section id="about" className="border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 md:px-10 md:py-8 lg:py-22 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20">
          {/* LEFT — CONTENT */}
          <div className="flex flex-col justify-center lg:col-span-6">
            <Reveal>
              <SectionLabel>WHO WE ARE</SectionLabel>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="mt-5 max-w-[600px] text-[clamp(2rem,4.2vw,4.5rem)] font-medium leading-[0.98] md:tracking-[-0.045em] text-[#24231F]">
                Built in India.
                <br />
                Ready for the World.
              </h2>
            </Reveal>

            <Reveal
              as="figure"
              delay={0.12}
              className="md:hidden py-8 lg:col-span-6"
            >
              <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-[4px] md:min-h-[520px] lg:min-h-[580px]">
                <Image
                  src="/images/intro.webp"
                  alt="Lotus wetlands in India at golden hour where makhana is sourced"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-right transition-transform duration-[1.2s] ease-out hover:scale-[1.025]"
                />
              </div>
            </Reveal>

            <div className="md:mt-8 max-w-[650px] space-y-5">
              <Reveal delay={0.1}>
                <p className="text-[15px] leading-[1.75] text-[#66635C] md:text-[16px]">
                  Videha Overseas was built with a clear purpose — to connect
                  quality Indian products with buyers and markets across the
                  world. We focus on reliable sourcing, consistent quality,
                  export-ready standards, and flexible solutions tailored to
                  buyer requirements. From product specifications and packaging
                  to documentation and export coordination, we work closely with
                  our buyers to deliver solutions that are practical,
                  transparent, and suited to their individual requirements.
                </p>
              </Reveal>

              <Reveal delay={0.15}>
                <p className="text-[15px] leading-[1.75] text-[#66635C] md:text-[16px]">
                  The result is a consistent, export-ready product and a partner
                  our buyers can rely on, shipment after shipment.
                </p>
              </Reveal>
            </div>

            {/* STATS */}
            {/* <div className="mt-10 grid grid-cols-3 border-t border-[#D9D5CB] pt-7">
              {FACTS.map((fact, index) => (
                <Reveal key={fact.label} delay={0.18 + index * 0.06}>
                  <div className="pr-4">
                    <div className="text-2xl font-medium tracking-[-0.03em] text-[#315C3A] md:text-3xl">
                      <CountUp
                        end={fact.value}
                        suffix={fact.suffix}
                        duration={1800}
                      />
                    </div>

                    <div className="mt-1.5 max-w-[110px] text-[11px] leading-[1.4] text-[#77736A]">
                      {fact.label}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div> */}

            {/* TRUST ELEMENTS */}
            <div className="mt-8 border-t border-[#D9D5CB] pt-6">
              <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
                {[
                  "Registered Indian Company",
                  "Export Documentation Support",
                  "Quality-Focused Sourcing",
                  "Bulk & Customized Supply",
                  "Direct Buyer Communication",
                ].map((item, index) => (
                  <Reveal key={item} delay={0.18 + index * 0.04}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-[#315C3A]">
                        <svg
                          viewBox="0 0 12 12"
                          className="h-3 w-3 text-[#315C3A]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d="M3 6.2 5.1 8.3 9 4.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <span className="text-[13px] font-medium text-[#24231F]">
                        {item}
                      </span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — IMAGE */}
          <Reveal
            as="figure"
            delay={0.12}
            className="hidden md:block lg:col-span-6"
          >
            <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-[4px] md:min-h-[520px] lg:min-h-[580px]">
              <Image
                src="/images/intro.webp"
                alt="Lotus wetlands in India at golden hour where makhana is sourced"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-right transition-transform duration-[1.2s] ease-out hover:scale-[1.025]"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
