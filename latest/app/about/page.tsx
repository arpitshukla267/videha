import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Target, Compass, Award } from "lucide-react";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { SourceToPartnershipSection } from "@/components/source-to-partnership";
import { FeatureFilmstrip } from "@/components/ui/feature-filmstrip";
import { CompanyCredibilitySection } from "@/components/company-credibility-section";

export const metadata: Metadata = {
  title: "About Us — Videha Overseas",
  description:
    "Learn about Videha Overseas — a professional Indian agricultural exporter dedicated to transparent sourcing, strict quality compliance, and long-term global trade partnerships.",
};

const PRINCIPLES = [
  {
    num: "01",
    title: "Reliable Indian Sourcing",
    tagline: "Quality-Focused Procurement",
    description:
      "We focus on reliable sourcing and quality-focused procurement to meet the requirements of international buyers across our agricultural and food product range.",
    image: "/images/process-source.webp",
  },
  {
    num: "02",
    title: "Quality-Focused Processing",
    tagline: "Consistency Across Every Requirement",
    description:
      "Our sourcing and quality approach is guided by product specifications, buyer requirements, and the quality parameters relevant to each product.",
    image: "/images/process-select.webp",
  },
  {
    num: "03",
    title: "Flexible B2B Supply",
    tagline: "Built Around Buyer Requirements",
    description:
      "We support bulk supply, flexible packaging options, private label requirements, and product specifications based on individual buyer needs.",
    image: "/images/process-pack.webp",
  },
  {
    num: "04",
    title: "Export Documentation",
    tagline: "Support for International Trade",
    description:
      "Documentation can be arranged as applicable to the product, destination country, and buyer requirement, including commercial invoices, packing lists, certificates of origin, COAs, and other applicable shipping documents.",
    image: "/images/process-export.webp",
  },
];

const TIMELINE_FLOW = [
  {
    step: "01",
    label: "Requirement",
    title: "Understanding Buyer Needs",
    body: "We begin by understanding the buyer's product, specification, quantity, packaging, and destination requirements.",
  },
  {
    step: "02",
    label: "Sourcing",
    title: "Reliable Product Sourcing",
    body: "We focus on quality-focused procurement and sourcing products according to the required specifications.",
  },
  {
    step: "03",
    label: "Quality",
    title: "Quality-Focused Procurement",
    body: "Product quality parameters and buyer-specific requirements are considered throughout the sourcing and supply process.",
  },
  {
    step: "04",
    label: "Packaging",
    title: "Flexible Packaging Solutions",
    body: "Bulk, retail, private label, and customized packaging options can be arranged according to product and buyer requirements.",
  },
  {
    step: "05",
    label: "Documentation",
    title: "Export Documentation",
    body: "Documentation can be arranged as applicable to the product, destination country, and buyer requirement.",
  },
  {
    step: "06",
    label: "Export",
    title: "Export Dispatch",
    body: "We coordinate the export process through logistics and shipping arrangements based on the buyer's requirements.",
  },
];

export default function AboutPage() {
  return (
    <main className="overflow-x-clip bg-background">
      {/* 1. HERO SECTION */}
      <header className="relative min-h-[100svh] w-full overflow-hidden">
        {/* IMAGE */}
        <Image
          src="/about.webp"
          alt="Indian agricultural fields sourcing origin"
          fill
          priority
          sizes="100vw"
          className="
      !z-0
      object-cover
      object-center
      max-md:object-[75%_center]
    "
        />

        {/* DESKTOP OVERLAY */}
        <div className="hidden md:block about-hero-overlay absolute inset-0 z-[1] bg-black/40 md:bg-black/20" />

        {/* MOBILE OVERLAY */}
        <div
          className="absolute inset-0 z-10 block md:hidden"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.40)",
          }}
        />

        {/* CONTENT */}
        <div className="relative z-20 flex min-h-[90svh] md:min-h-[100svh] items-center">
          <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16">
            <div className="max-w-[700px] max-md:translate-y-[70px]">
              <Reveal>
                <SectionLabel className="text-white md:text-[#24231F]">
                  ABOUT VIDEHA OVERSEAS
                </SectionLabel>
              </Reveal>

              <h1
                className="
            mt-6
            text-[clamp(2.5rem,6.2vw,4.5rem)]
            font-semibold
            leading-[0.99]
            tracking-[-0.03em]
            text-white
            md:text-[#24231F]
            max-md:mt-5
            max-md:text-[2.35rem]
          "
              >
                Indian Sourcing.
                <br />
                Global Standards.
                <br />
                Trusted Trade.
              </h1>

              <Reveal delay={0.1}>
                <p
                  className="
              mt-8
              max-w-[580px]
              text-[15px]
              leading-[1.75]
              text-white/95
              md:text-[#5F5D57]
              md:text-[16px]
              max-md:mt-6
              max-md:text-[14px]
              max-md:leading-[1.7]
            "
                >
                  Videha Overseas is a professional agricultural export merchant
                  based in India. We bridge farming cooperatives at origin with
                  international food manufacturers, distributors, and brands
                  seeking reliable B2B supply lines.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* 2. WHO WE ARE & WHAT WE EXPORT */}
      <section className="border-b border-border bg-secondary/30 py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
            {/* Left: Who We Are */}
            <div className="lg:col-span-6">
              <Reveal>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                  EXPORT MERCHANT IDENTITY
                </span>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Who We Are
                </h2>
                <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
                  We operate as a committed, direct extension of our clients'
                  global procurement divisions. In an industry often marked by
                  crop fluctuations and inconsistent grading, Videha Overseas
                  focuses on operational transparency, standardized quality
                  calibration, and contract supply security.
                </p>
                <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  By controlling the supply chain from raw agricultural
                  collections to container stuffing, we offer global buyers
                  predictable cargo deliveries, export documentation, and
                  multi-year contract stability.
                </p>
              </Reveal>
            </div>

            {/* Right: What We Export */}
            <div className="lg:col-span-6 bg-background border border-border p-6 md:p-8 rounded-[5px]">
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                PRODUCT PORTFOLIO
              </span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                What We Export
              </h2>

              <div className="mt-6 space-y-6">
                <div className="border-l-2 border-accent pl-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Premium Graded Makhana
                  </h3>
                  <p className="mt-1.5 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Naturally cultivated popped fox nuts graded systematically
                    by puff size (ranging from 6mm+ Super Jumbo to raw seeds and
                    milling powders). pecialized packaging options can be
                    arranged according to product requirements and buyer
                    specifications..
                  </p>
                </div>

                <div className="border-l-2 border-accent pl-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Food Grade Guar Gum Powder (E412)
                  </h3>
                  <p className="mt-1.5 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    A high-purity natural hydrocolloid milled from premium guar
                    splits. We supply standardized viscosity grades (up to 5,500
                    cps) and custom mesh sizes aligned with buyer-defined
                    food-grade specifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MISSION & VISION */}
      <section className="border-b border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="border border-border p-8 md:p-10 bg-secondary/20 rounded-[5px] flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center border border-accent/20 bg-background text-accent rounded-full mb-6">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground uppercase">
                  Our Mission
                </h3>
                <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  To supply industrial-grade Indian agricultural
                  ingredients to global food and manufacturing sectors through
                  transparent sourcing, rigorous batch compliance, and reliable
                  contract execution. We aim to replace market uncertainty with
                  standardized B2B trade lane operations.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="border border-border p-8 md:p-10 bg-secondary/20 rounded-[5px] flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center border border-accent/20 bg-background text-accent rounded-full mb-6">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground uppercase">
                  Our Vision
                </h3>
                <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  To serve as the trusted supply bridge connecting India's
                  regional farming clusters directly with global food
                  industries. We envision fostering sustainable agricultural
                  trade routes based on long-term commercial relationships and
                  joint quality commitments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BUSINESS PHILOSOPHY & CORE PRINCIPLES */}
      <section className="border-b border-border py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-3xl mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              OPERATIONAL FRAMEWORK
            </span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Our Core Operating Principles
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              We structure our procurement and shipping around four business
              philosophies, converting agricultural commodities into uniform
              technical ingredients.
            </p>
          </div>

          {/* Desktop grid layout */}
          <div className="hidden md:flex flex-col gap-12">
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
                    <div className="relative aspect-[16/10] w-full overflow-hidden border border-border bg-secondary rounded-[3px]">
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

        {/* Mobile sticky filmstrip */}
        <FeatureFilmstrip
          title={
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Our Core Operating Principles
            </h2>
          }
          items={PRINCIPLES.map((p) => ({
            num: p.num,
            title: p.title,
            tagline: p.tagline,
            description: p.description,
            image: p.image,
          }))}
        />
      </section>

      {/* 5. BUYER-FIRST & GLOBAL MARKET FOCUS */}
      <section className="border-b border-border bg-[#f8f6f0] py-20 md:py-28 font-poppins">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            <div className="flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
                BUYER-FIRST OPERATIONS
              </span>
              <h2 className="mt-3 text-3xl font-semibold text-foreground tracking-tight">
                Global Market Focus & Client Trade Desks
              </h2>
              <p className="mt-4 text-xs md:text-sm leading-relaxed text-muted-foreground">
                We support international buyers with reliable sourcing,
                quality-focused procurement, flexible supply options and
                documentation aligned with product and destination requirements.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center bg-accent/10 text-accent rounded-full">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase text-foreground">
                      Quality-Focused Sourcing
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Quality-focused procurement and supplier verification
                      based on buyer requirements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center bg-accent/10 text-accent rounded-full">
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase text-foreground">
                      Export Documentation
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Documentation can be arranged as applicable to the
                      product, destination country and buyer requirement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative w-full h-full min-h-[320px] overflow-hidden border border-border bg-secondary rounded-[5px]">
              <Image
                src="/images/process-export.webp"
                alt="Videha export container logistics cargo ship"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. TIMELINE: FROM SOURCE TO PARTNERSHIP */}
      <SourceToPartnershipSection steps={TIMELINE_FLOW} />

      {/* 7. LONG-TERM SUPPLY VISION */}
      <section className="relative border-b border-border bg-foreground text-background py-24 md:py-32">
        <div className="absolute inset-0 z-0 opacity-15">
          <Image
            src="/images/brand-statement.webp"
            alt="Videha export loading dock makhana bags background"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-4xl">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              SUPPLY LANE VISION
            </span>
            <p className="mt-6 text-[clamp(1.8rem,4vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-background text-balance">
              &ldquo;Building stable, sustainable trade lanes that buyers can
              depend on year after year.&rdquo;
            </p>
            <p className="mt-8 max-w-xl text-[14px] leading-relaxed text-background/60">
              Our long-term business vision is centered on transforming
              agricultural ingredient procurement. We support local harvesting
              clusters with fair trade practices, invest in moisture-control
              technologies, and align our processes with global food safety
              standards.
            </p>
          </div>
        </div>
      </section>

      <CompanyCredibilitySection />

      {/* 8. CTA SECTION */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <div className="p-8 md:p-16 border border-border bg-background flex flex-col md:flex-row items-start md:items-center justify-between gap-8 rounded-[5px]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                  FOREIGN BUYER DESK
                </span>
                <h3 className="text-2xl md:text-3xl font-semibold text-foreground mt-2">
                  Establish a Reliable Export Contract
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  Contact our trade coordinators to outline sample requests,
                  customized specification parameters, and export container
                  rates.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-3 border border-foreground/30 px-6 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Makhana Range
                </Link>
                <Link
                  href="/guar-gum"
                  className="group inline-flex items-center gap-3 border border-foreground/30 px-6 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Guar Gum Specs
                </Link>
                <Link
                  href="/contact?subject=B2B+Sourcing+Enquiry"
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
