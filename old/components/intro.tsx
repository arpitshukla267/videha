import Image from "next/image"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"

const FACTS = [
  { value: "12+", label: "Global markets served" },
  { value: "100%", label: "Traceable sourcing" },
  { value: "24T", label: "Monthly export capacity" },
]

export function Intro() {
  return (
    <section id="about" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-40">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
        {/* Text side */}
        <div className="flex flex-col md:col-span-6">
          <Reveal>
            <SectionLabel>Who We Are</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground text-balance md:text-5xl">
              Built in India.
              <br />
              Ready for the World.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Videha Overseas was founded on a simple conviction — that India&apos;s makhana
              deserves a place on the world&apos;s finest shelves. We work directly with
              farming communities in the wetlands of Bihar, then apply exacting processing
              and quality standards built for international trade.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              The result is a consistent, export-ready product and a partner our buyers
              can rely on, shipment after shipment.
            </p>
          </Reveal>

          {/* Facts as typography, not cards */}
          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-border pt-10">
            {FACTS.map((f, i) => (
              <Reveal key={f.label} delay={0.1 + i * 0.08}>
                <div>
                  <div className="text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                    {f.value}
                  </div>
                  <div className="mt-2 text-[12px] leading-snug text-muted-foreground">
                    {f.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Image side */}
        <Reveal as="figure" delay={0.1} className="md:col-span-6">
          <div className="relative max-h-[550px] aspect-[4/5] w-full overflow-hidden md:aspect-[3/4]">
            <Image
              src="/images/intro-farm.png"
              alt="Lotus wetlands in India at golden hour where makhana is sourced"
              fill
              sizes="100vw"
              className="object-fit"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
