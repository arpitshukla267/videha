import Image from "next/image"
import Link from "next/link"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { QUALITY_POINTS as STATIC_QUALITY_POINTS } from "@/lib/content"

type QualityProps = {
  preview?: boolean
  points?: { title: string; copy: string }[]
}

export function Quality({ preview = false, points }: QualityProps) {
  const QUALITY_POINTS = points && points.length > 0 ? points : STATIC_QUALITY_POINTS
  return (
    <section className="border-t border-border bg-[#514536] text-background">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-5 py-16 md:grid-cols-12 md:gap-10 md:px-10 md:py-20">
        <Reveal as="figure" className="md:col-span-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[3/4] md:max-h-[480px]">
            <Image
              src="/images/quality-macro.webp"
              alt="Macro detail of a single premium makhana puff"
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <div className="flex flex-col justify-center md:col-span-7">
          <Reveal>
            <SectionLabel tone="light">Quality</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.02em] text-background text-balance md:text-4xl">
              Quality That Travels Beyond Borders
            </h2>
          </Reveal>

          <div className="mt-8 grid grid-cols-1 gap-0 sm:grid-cols-2">
            {QUALITY_POINTS.map((p, i) => (
              <Reveal key={p.title} delay={0.05 + i * 0.05}>
                <div className="border-t border-background/15 py-5 pr-4">
                  <span className="text-[10px] font-medium tracking-[0.2em] text-background/45">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-base font-medium text-background">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-background/60">
                    {p.copy}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* {preview && (
            <Reveal delay={0.2}>
              <Link
                href="/quality"
                className="mt-6 inline-flex text-[11px] font-medium uppercase tracking-[0.18em] text-background/70 transition-colors hover:text-background"
              >
                Our quality philosophy →
              </Link>
            </Reveal>
          )} */}
        </div>
      </div>
    </section>
  );
}
