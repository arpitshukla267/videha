import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sprout,
  Award,
  MapPin,
} from "lucide-react";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import {
  OriginSealGraphic,
  TraceabilityFlowGraphic,
  ComplianceBadgesGraphic,
} from "@/components/graphics";
import { SourceToPartnershipSection } from "@/components/source-to-partnership";

export const metadata: Metadata = {
  title: "About — Videha Overseas",
  description:
    "The story, mission, origin and export quality standards behind Videha Overseas — an Indian makhana exporter built for global trade.",
};

const PRINCIPLES = [
  {
    num: "01",
    title: "Direct Wetland Sourcing",
    tagline: "Wetland Roots in Bihar's Mithila Region",
    description:
      "Every shipment is traceable back to specific harvesting clusters in the wetlands of Mithila, Bihar. By bypassing raw material traders and working directly with local farming cooperatives at origin, we secure first-grade seed lots and guarantee batch purity.",
    image: "/images/process-source.png",
  },
  {
    num: "02",
    title: "Zero Defect Grading",
    tagline: "Uncompromising Size & Crunch",
    description:
      "Export makhana demands absolute physical consistency. We sort all popped lots mechanically and optically to ensure only 6mm+ Super Jumbo puffs make it into our packing lines. Unpopped kernels, shell fragments, and off-color puffs are strictly weeded out.",
    image: "/images/process-select.png",
  },
  {
    num: "03",
    title: "Preserving the Transit Integrity",
    tagline: "Moisture Protection Under 4.5%",
    description:
      "Popped makhana is highly hygroscopic, easily absorbing moisture and turning soft. To lock in the delicate crunch across 20+ days of ocean transit, we kiln-dry our makhana to under 4.5% moisture and seal it immediately in heavy-gauge double-barrier packaging.",
    image: "/images/process-pack.png",
  },
  {
    num: "04",
    title: "Aligned to Destination Standards",
    tagline: "Transparent EXIM Operations",
    description:
      "We prepare all phytosanitary certifications, commercial invoices, and origin certificates with meticulous care. Every container comes with an independent lab Certificate of Analysis (COA) matching destination market regulations.",
    image: "/images/process-export.png",
  },
];

const TIMELINE_FLOW = [
  {
    step: "01",
    label: "Source",
    title: "Bihar Wetlands Sourcing",
    body: "Cooperative procurement directly from the lotus ponds of Mithila, Bihar.",
  },
  {
    step: "02",
    label: "Selection",
    title: "Sieving & Sizing",
    body: "Rigorous cleaning and sizing of harvested seeds prior to flame popping.",
  },
  {
    step: "03",
    label: "Processing",
    title: "Controlled Roasting",
    body: "Traditional flame popping and roasting to achieve uniform puffed expansion.",
  },
  {
    step: "04",
    label: "Quality",
    title: "Double-Batch Inspection",
    body: "Moisture checks (<4.5%), optical sorting and laboratory testing.",
  },
  {
    step: "05",
    label: "Export",
    title: "Barrier Sealed Packing",
    body: "Vacuum sealing and master cartoon boxing designed for long-haul shipping.",
  },
  {
    step: "06",
    label: "Partnership",
    title: "Global Supply Lane Delivery",
    body: "Port delivery, customs clearance, and structured contract execution.",
  },
];

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-background">
      {/* HERO SECTION */}
      <header className="relative min-h-[100svh] w-full overflow-hidden border-b border-border">
        <Image
          src="/about-3.png"
          alt="Bihar wetlands background"
          fill
          priority
          sizes="100vw"
          className="about-hero-image object-cover"
        />
        <div className="about-hero-overlay hidden md:block absolute inset-0 z-[1]" />
        <div className="relative z-10 flex min-h-[100svh] items-center bg-black/20">
          <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16">
            <div className="max-w-[620px]">
              <Reveal className=" hidden md:block">
                <SectionLabel>ABOUT VIDEHA</SectionLabel>
              </Reveal>

              <h1 className="mt-6 max-w-[600px] text-[clamp(3.2rem,6.2vw,6rem)] font-normal leading-[0.91] tracking-[-0.055em] text-white md:text-[#24231F]">
                Built in India.
                <br />
                Ready for the
                <br />
                World.
              </h1>

              <Reveal delay={0.1}>
                <p className="mt-8 max-w-[530px] text-[15px] leading-[1.7] text-white md:text-[#5F5D57] md:text-[16px]">
                  Videha Overseas bridges India&apos;s ancient wetland heritage
                  with the strict quality and supply expectations of
                  international markets — delivering premium, export-graded fox
                  nuts to discerning global buyers.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 02: THE ORIGIN OF MAKHANA (Bihar Cultivation) */}
      <section className="border-b border-border bg-[#f8f6f0] py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-12">
            {/* <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              SECTION 02
            </span> */}
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              The Origin of Makhana
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-secondary">
                  <Image
                    src="/images/process-source.png"
                    alt="Lotus ponds in Bihar makhana harvesting"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute bottom-4 left-4 bg-background/95 px-3 py-1 border border-border text-[9px] font-mono uppercase text-foreground">
                    Wetland Sourcing
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-8">
              <div className="flex flex-col md:flex-row items-start gap-6 border-b border-border pb-8">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    A Natural Superfood
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Euryale ferox, commonly known as fox nut or makhana, matures
                    in wetlands before its black seeds are popped under extreme
                    heat. The resulting white puff is high in protein, fiber,
                    and minerals while remaining naturally gluten-free and
                    low-glycemic.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="relative aspect-[3/2] w-full overflow-hidden border border-border bg-secondary">
                  <Image
                    src="/images/process-select.png"
                    alt="Sorting harvested seeds"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                  <div className="absolute bottom-3 left-3 bg-background/95 px-2 py-0.5 border border-border text-[8px] font-mono uppercase text-foreground">
                    Size Sorting
                  </div>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Our grading system separates raw seeds into precise size
                  brackets (ranging from Super Jumbo 6.5mm+ to standard grades)
                  to ensure that the expansion ratio and crunch density are
                  optimized during popping.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: HOW WE THINK (Principles vertical list) */}
      <section className="border-b border-border py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-16">
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              How We Think — Core Operating Principles
            </h2>
          </div>

          <div className="flex flex-col gap-12">
            {PRINCIPLES.map((p, idx) => (
              <Reveal key={p.num} delay={idx * 0.05}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-border pt-12 items-start group">
                  <div className="lg:col-span-4 flex items-baseline gap-4">
                    <span className="font-mono text-4xl font-semibold text-accent/50 group-hover:text-accent transition-colors">
                      {p.num}
                    </span>
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
                        {p.title}
                      </h3>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mt-1">
                        {p.tagline}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="relative aspect-[16/10] w-full overflow-hidden border border-border bg-secondary">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        className="object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
                        sizes="(max-width: 1024px) 100vw, 20vw"
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 04: FROM SOURCE TO PARTNERSHIP */}
      <SourceToPartnershipSection steps={TIMELINE_FLOW} />

      {/* SECTION 05: OUR PROMISE */}
      <section className="relative border-b border-border bg-foreground text-background py-24 md:py-32">
        <div className="absolute inset-0 z-0 opacity-15">
          <Image
            src="/images/brand-statement.png"
            alt="Videha export loading dock makhana bags background"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-4xl">
            {/* <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              SECTION 05 · OUR PROMISE
            </span> */}
            <p className="mt-6 text-[clamp(1.8rem,4vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-background text-balance">
              &ldquo;Consistency is not an option. It is the standard.&rdquo;
            </p>
            <p className="mt-8 max-w-xl text-[14px] leading-relaxed text-background/60">
              Foreign importers, health food brands, and distributors cannot
              afford variable quality or container-to-container delays. We back
              every order with locked pricing contracts, strict quality grades,
              and transparent EXIM clearance.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 md:py-28 bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <div className="p-8 md:p-16 border border-border bg-background flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                  FOREIGN BUYER DESK
                </span>
                <h3 className="text-2xl md:text-3xl font-semibold text-foreground mt-2">
                  Ready to Source Export-Grade Makhana?
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  Contact our export team for sample requests, specifications
                  sheets, and container pricing.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-3 border border-foreground/30 px-6 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  View Products
                </Link>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-3 bg-foreground px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary whitespace-nowrap"
                >
                  Request Samples
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
