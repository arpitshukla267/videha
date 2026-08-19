import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck, MapPin, Anchor, Ship, Globe } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { ProcessStory } from "@/components/process-story"

export const metadata: Metadata = {
  title: "Our Process — Videha Overseas",
  description:
    "Follow the journey of Videha makhana — from Bihar wetlands through grading, processing, quality checks, packing and export.",
}

const DETAILED_PROCESS_DATA = [
  {
    num: "01",
    phase: "SOURCING",
    happens: "We secure direct seasonal crop volumes from harvesting cooperatives in Bihar's wetland clusters. Seeds are gathered manually from lotus lilies.",
    matters: "Bypassing intermediate traders ensures raw seed purity, preventing stale crop blending and securing cost advantages.",
    receives: "Wetland origin certificate containing harvesting coop details and pond lot coordinates."
  },
  {
    num: "02",
    phase: "SELECTING",
    happens: "Harvested seeds undergo rigorous sun-drying, sieving, and mechanical diameter sizing to isolate premier popping candidates.",
    matters: "Consistent seed diameters ensure uniform heat absorption during roasting, optimizing expansion and roundness.",
    receives: "Seed dimension grading certificates and moisture logs post drying."
  },
  {
    num: "03",
    phase: "PROCESSING",
    happens: "Controlled dry roasting in small batches pops the sieved seeds under thermal shock, expanding them into ivory-white puffs.",
    matters: "Pop expansion without oil retains makhana's native micro-nutrients, clean natural flavor, and signature crunch.",
    receives: "Roasting batch logs and expansion ratio checks."
  },
  {
    num: "04",
    phase: "QUALITY",
    happens: "Popped lots are cleaned of seed coats, sieved to isolate Grade AAA sizes, and moisture-analyzed under dry-kiln chambers.",
    matters: "Puffs exceeding 4.5% moisture turn soft during sea transit. Eliminating shell fragments avoids product recall risk.",
    receives: "Laboratory Certificate of Analysis (COA) specifying moisture, sizing, and microbiological compliance."
  },
  {
    num: "05",
    phase: "PACKING",
    happens: "Finished lots are immediately sealed in heavy double-barrier vacuum bags or nitrogen-flushed retail packaging.",
    matters: "Prevents atmospheric moisture absorption and oil oxidation during long-haul transit across shipping zones.",
    receives: "Packaging barrier specification documents and nitrogen audit certificates."
  },
  {
    num: "06",
    phase: "EXPORT",
    happens: "Container stuffing at our deport, customs inspection, phytosanitary clearance, and ocean liner booking.",
    matters: "Ensures trouble-free customs entry at destination ports, eliminating demurrage risk or import delays.",
    receives: "Phytosanitary Certificate, Bill of Lading, Certificate of Origin, and packing lists."
  }
]

export default function OurProcessPage() {
  return (
    <main className="overflow-x-clip bg-background">
      {/* Hero Header */}
      <header className="border-b border-border bg-secondary/30 pt-36 md:pt-48 pb-16">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-4xl">
            <Reveal>
              <SectionLabel>OUR PROCESS</SectionLabel>
            </Reveal>
            <h1 className="mt-6 text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-foreground text-balance">
              From Source to Global Markets.
            </h1>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Scroll through the complete journey — source, select, process, quality,
                pack and export — as each stage unfolds.
              </p>
            </Reveal>
          </div>
        </div>
      </header>

      {/* Sticky GSAP Process Story */}
      <ProcessStory />

      {/* DETAILED PROCESS EXPLANATION */}
      <section className="py-24 md:py-32 border-t border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-2xl mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              TECHNICAL AUDIT SHEET
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              Specification Benchmarks Per Step
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              What we execute, why we prioritize it, and what documents are dispatched to our buyers.
            </p>
          </div>

          <div className="flex flex-col border border-border">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 bg-secondary/30 border-b border-border text-[11px] font-mono uppercase text-muted-foreground px-6 py-4">
              <div className="col-span-1">STEP</div>
              <div className="col-span-2">PHASE</div>
              <div className="col-span-3">WHAT HAPPENS</div>
              <div className="col-span-3">WHY IT MATTERS</div>
              <div className="col-span-3">BUYER RECEIVES</div>
            </div>

            {/* Table Body */}
            {DETAILED_PROCESS_DATA.map((step, idx) => (
              <div
                key={step.num}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 px-6 py-6 items-start text-xs ${
                  idx !== DETAILED_PROCESS_DATA.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="col-span-1 font-mono text-base font-bold text-accent">
                  {step.num}
                </div>
                <div className="col-span-2 font-mono font-bold text-foreground uppercase lg:pt-1">
                  {step.phase}
                </div>
                <div className="col-span-3 text-muted-foreground leading-relaxed pr-4">
                  <span className="lg:hidden font-bold block text-foreground mb-1">WHAT HAPPENS:</span>
                  {step.happens}
                </div>
                <div className="col-span-3 text-muted-foreground leading-relaxed pr-4">
                  <span className="lg:hidden font-bold block text-foreground mb-1">WHY IT MATTERS:</span>
                  {step.matters}
                </div>
                <div className="col-span-3 text-foreground font-medium leading-relaxed">
                  <span className="lg:hidden font-bold block text-muted-foreground mb-1">BUYER RECEIVES:</span>
                  <div className="flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{step.receives}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPORT JOURNEY GRAPHIC */}
      <section className="py-24 md:py-32 bg-secondary/30 border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              EXIM TIMELINE
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              Transit Pipeline & Corridors
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A trace diagram illustrating how makhana moves from landlocked Bihar to foreign destination ports.
            </p>
          </div>

          <div className="border border-border bg-background p-6 md:p-12">
            {/* Visual Timeline Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute left-12 right-12 top-10 h-0.5 bg-border z-0" />

              {/* Node 1 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border border-border bg-background flex items-center justify-center text-primary mb-4 shadow-xs">
                  <MapPin className="w-8 h-8" />
                </div>
                <h4 className="font-mono text-xs font-bold text-foreground">1. BIHAR ORIGIN</h4>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[180px]">
                  Harvesting & popping at Mithila facility. Land transit to rail head.
                </p>
              </div>

              {/* Node 2 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border border-border bg-background flex items-center justify-center text-primary mb-4 shadow-xs">
                  <Anchor className="w-8 h-8" />
                </div>
                <h4 className="font-mono text-xs font-bold text-foreground">2. CUSTOMS CLEARANCE</h4>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[180px]">
                  Customs declaration & phytosanitary inspections at Kolkata Port.
                </p>
              </div>

              {/* Node 3 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border border-border bg-background flex items-center justify-center text-primary mb-4 shadow-xs">
                  <Ship className="w-8 h-8" />
                </div>
                <h4 className="font-mono text-xs font-bold text-foreground">3. OCEAN TRANSIT</h4>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[180px]">
                  Sea lanes transit inside nitrogen or vacuum barrier containers.
                </p>
              </div>

              {/* Node 4 */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border border-border bg-background flex items-center justify-center text-primary mb-4 shadow-xs">
                  <Globe className="w-8 h-8" />
                </div>
                <h4 className="font-mono text-xs font-bold text-foreground">4. PORT ARRIVAL</h4>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[180px]">
                  Destination port release & delivery to buyer warehouses.
                </p>
              </div>

            </div>
          </div>
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
                  Request Specifications and Sample Kits
                </h3>
                <p className="text-sm text-background/70 mt-2 max-w-xl">
                  Test the crispness and expansion ratio in your own laboratory. We dispatch physical sample boxes to verified buyers.
                </p>
              </div>

              <Link
                href="/contact?subject=Sample+Kits+%26+Specifications"
                className="group inline-flex items-center gap-3 border border-background/40 px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"
              >
                Connect With Us
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
