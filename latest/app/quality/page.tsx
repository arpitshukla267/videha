import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Check } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { ComplianceBadgesGraphic } from "@/components/graphics"

export const metadata: Metadata = {
  title: "Quality Standards — Videha Overseas",
  description:
    "Explore our rigorous export-ready quality checks. Traceability from pond to pack, moisture locking under 4.5%, and Grade AAA sizing.",
}

const QUALITY_PILLARS = [
  {
    num: "01",
    title: "CONSISTENT GRADING",
    desc: "Multi-level mechanical sieves and optical sorters verify puffed diameters (Grade AAA Jumbo is strictly locked at 6mm+), ensuring no unpopped kernels or shell fragments make it to the container."
  },
  {
    num: "02",
    title: "CONTROLLED PROCESSING",
    desc: "Popping operates in high-heat thermal shock systems without the addition of cooking oils, preservatives, or chemical bleaches. The natural nutrients and ivory color are locked in pure."
  },
  {
    num: "03",
    title: "EXPORT-READY PACKAGING",
    desc: "To survive long transit times across ocean routes, makhana is immediately sealed in nitrogen-flushed retail pouches or double-barrier bulk bags, keeping moisture content under 4.5%."
  },
  {
    num: "04",
    title: "TRACEABLE SOURCING",
    desc: "By coordinating crop procurement directly with farming clusters in Bihar's wetland belt, every batch is registered with pond origin, harvest logs, and drying statistics."
  }
]

const JOURNEY_STEPS = [
  { name: "Raw Product", check: "Wetland harvest seed moisture check (<12%)" },
  { name: "Inspection", check: "Seed sorting & size calibration" },
  { name: "Grading", check: "Puff sorting (AAA Jumbo 6mm+ separation)" },
  { name: "Processing", check: "Controlled flame roasting & popping" },
  { name: "Final Check", check: "Kiln-drying moisture verification (<4.5%)" },
  { name: "Shipment", check: "Double-barrier seal & container stuffing" }
]

export default function QualityPage() {
  return (
    <main className="overflow-hidden bg-background">
      {/* Hero Header */}
      <header className="border-b border-border bg-[#f8f6f0] pt-36 md:pt-48 pb-16">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-4xl">
            <Reveal>
              <SectionLabel>QUALITY STANDARDS</SectionLabel>
            </Reveal>
            <h1 className="mt-6 text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-foreground text-balance">
              Quality That Travels Beyond Borders.
            </h1>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Agricultural exports demand strict physical limits. At Videha Overseas, we eliminate variables at origin, processing, and packaging to deliver flawless shipments.
              </p>
            </Reveal>
          </div>
        </div>
      </header>

      {/* Macro Image Section */}
      <section className="border-b border-border bg-[#f8f6f0] pb-20 md:pb-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <div className="relative aspect-[21/9] w-full overflow-hidden border border-border bg-secondary">
              <Image
                src="/images/quality-macro.png"
                alt="Macro detail of premium popped makhana"
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute bottom-4 left-4 bg-background/90 px-3 py-1.5 border border-border text-[10px] font-mono uppercase text-foreground">
                Grade AAA Macro Inspection
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Typography Pillars Section */}
      <section className="py-24 md:py-32 border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-2xl mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              QUALITY CONTROL PROTOCOLS
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              Four Benchmarks of Our Sourcing Purity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {QUALITY_PILLARS.map((pillar, idx) => (
              <Reveal key={pillar.num} delay={idx * 0.05}>
                <div className="flex flex-col border-t border-border pt-8 group">
                  <span className="font-mono text-4xl font-semibold text-accent/40 group-hover:text-accent transition-colors">
                    {pillar.num}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-4 uppercase tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Map Section */}
      <section className="py-24 md:py-32 bg-[#f8f6f0] border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-2xl mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              AUDITED FLOW
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              The Journey of Audited Batches
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Critical checkpoints applied systematically to every export run.
            </p>
          </div>

          {/* SVG Journey timeline */}
          <div className="border border-border bg-background p-6 md:p-10">
            <div className="relative">
              {/* Connector line for desktop */}
              <div className="hidden lg:block absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-border z-0" />

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
                {JOURNEY_STEPS.map((step, idx) => (
                  <div key={step.name} className="flex flex-col bg-[#f8f6f0]/50 border border-border p-5 h-full group hover:border-primary transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center font-mono text-[10px] font-bold text-accent mb-4 group-hover:bg-primary group-hover:text-background transition-colors">
                      0{idx + 1}
                    </div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-tight">{step.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed flex-1">
                      {step.check}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Big Promise Band */}
      <section className="bg-primary text-primary-foreground py-28 md:py-36 border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 text-center max-w-4xl">
          <Reveal>
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent font-semibold">
              OUR SUPPLY PHILOSOPHY
            </span>
            <h2 className="mt-6 text-[clamp(2rem,5.5vw,4.2rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-balance">
              &ldquo;Quality should survive the journey.&rdquo;
            </h2>
            <p className="mt-8 text-sm md:text-base text-primary-foreground/75 max-w-xl mx-auto leading-relaxed">
              Crispness popped in India is only valuable if it remains crispy at the destination warehouse in Hamburg or New York. We verify sealing, water bounds, and packaging strengths so our makhana survives transit climates perfectly.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Global Compliance & Accreditations */}
      <section className="py-20 md:py-28 border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Reveal>
              <SectionLabel>Global Compliance</SectionLabel>
            </Reveal>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-foreground">
              Food Safety & Sourcing Certifications
            </h2>
          </div>
          <ComplianceBadgesGraphic />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-foreground text-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                  FOREIGN BUYER DESK
                </span>
                <h3 className="text-2xl md:text-3xl font-semibold text-background mt-2">
                  Request Laboratory Certifications & Samples
                </h3>
                <p className="text-sm text-background/70 mt-2 max-w-xl">
                  Connect with our export desk to request specific laboratory analyses, moisture lock sheets, or sample containers.
                </p>
              </div>

              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 border border-background/40 px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"
              >
                Request Lab Sheet
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
