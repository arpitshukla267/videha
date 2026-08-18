import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"

const REASONS = [
  {
    num: "01",
    title: "Premium sourcing",
    copy: "Direct relationships at origin give us first access to the season's finest harvests.",
  },
  {
    num: "02",
    title: "Consistent quality",
    copy: "Grading and processing built to repeat — the same standard in every carton.",
  },
  {
    num: "03",
    title: "Export-ready standards",
    copy: "Packaging, hygiene and documentation aligned to international requirements.",
  },
  {
    num: "04",
    title: "Reliable supply",
    copy: "Capacity and planning that let buyers count on volume, on schedule.",
  },
  {
    num: "05",
    title: "Long-term partnerships",
    copy: "We build relationships, not transactions — accountable at every shipment.",
  },
]

export function WhyVideha() {
  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-40">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <Reveal>
              <SectionLabel>Why Videha</SectionLabel>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground text-balance md:text-5xl">
                Built Around Quality. Driven by Trust.
              </h2>
            </Reveal>
          </div>

          <div className="md:col-span-8 md:pt-2">
            {REASONS.map((r, i) => (
              <Reveal key={r.num} delay={i * 0.05}>
                <div className="group grid grid-cols-[auto_1fr] items-baseline gap-6 border-t border-border py-8 md:grid-cols-[auto_1fr_2fr] md:gap-10 md:py-9">
                  <span className="text-[13px] font-medium tracking-[0.2em] text-accent">
                    {r.num}
                  </span>
                  <h3 className="text-xl font-medium tracking-tight text-foreground transition-colors group-hover:text-primary md:text-2xl">
                    {r.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-muted-foreground">
                    {r.copy}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
