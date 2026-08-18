import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Shield, Sparkles, Package } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { MakhanaGradingDiagram } from "@/components/graphics"
import { PRODUCTS } from "@/lib/content"

export const metadata: Metadata = {
  title: "Products — Videha Overseas",
  description:
    "Explore our premium export-ready makhana range. Size-graded classic roasted, seasoned gourmet, and bulk raw fox nuts.",
}

// Generate slugs based on product name
const getSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function ProductsPage() {
  return (
    <main className="overflow-hidden bg-background">
      {/* HERO SECTION */}
      <header className="border-b border-border bg-[#f8f6f0] pt-36 md:pt-48 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <SectionLabel>OUR PRODUCTS</SectionLabel>
              </Reveal>
              <h1 className="mt-6 text-[clamp(2.5rem,6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-foreground text-balance">
                A Better Standard<br />of Makhana.
              </h1>
              <Reveal delay={0.1}>
                <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                  Our product catalog covers three primary export requirements: Plain double-roasted for retail/ingredient use, custom-seasoned flavored makhana for modern brands, and size-graded raw fox nuts for processing and packaging lines.
                </p>
              </Reveal>
            </div>

            {/* <div className="lg:col-span-6">
              <Reveal delay={0.15}>
                <MakhanaGradingDiagram />
              </Reveal>
            </div> */}
          </div>
        </div>
      </header>

      {/* ASYMMETRIC EDITORIAL CATALOGUE */}
      <section className="py-24 md:py-32 border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="flex flex-col gap-28 md:gap-40">
            
            {/* PRODUCT 01: Classic Roasted - Image Left, Text Right */}
            {PRODUCTS[0] && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                <div className="lg:col-span-7">
                  <Reveal>
                    <div className="relative aspect-[16/11] w-full overflow-hidden border border-border bg-secondary group">
                      <Image
                        src={PRODUCTS[0].image}
                        alt={PRODUCTS[0].name}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        priority
                      />
                      <div className="absolute top-4 left-4 bg-background/90 px-3 py-1.5 border border-border text-[10px] font-mono uppercase text-foreground">
                        {PRODUCTS[0].format}
                      </div>
                    </div>
                  </Reveal>
                </div>
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <Reveal>
                    <span className="font-mono text-xs font-bold text-accent">PRODUCT 01</span>
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground mt-2 md:text-4xl">
                      {PRODUCTS[0].name}
                    </h2>
                    <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                      {PRODUCTS[0].copy}
                    </p>
                  </Reveal>

                  <Reveal delay={0.05}>
                    <div className="mt-8 border-t border-border pt-6 grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground uppercase text-[9px] tracking-wider block">GRADE STANDARD</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{PRODUCTS[0].grade}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase text-[9px] tracking-wider block">PACKAGING</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{PRODUCTS[0].packaging}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground uppercase text-[9px] tracking-wider block">TARGET APPLICATION</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{PRODUCTS[0].application}</span>
                      </div>
                    </div>
                  </Reveal>

                  <Reveal delay={0.1}>
                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                      <Link
                        href={`/products/${getSlug(PRODUCTS[0].name)}`}
                        className="group inline-flex items-center gap-2 bg-foreground px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-background hover:bg-primary transition-colors"
                      >
                        View Specifications
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </Reveal>
                </div>
              </div>
            )}

            {/* PRODUCT 02: Flavoured Makhana - Text Left, Image Right */}
            {PRODUCTS[1] && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col justify-center">
                  <Reveal>
                    <span className="font-mono text-xs font-bold text-accent">PRODUCT 02</span>
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground mt-2 md:text-4xl">
                      {PRODUCTS[1].name}
                    </h2>
                    <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                      {PRODUCTS[1].copy}
                    </p>
                  </Reveal>

                  <Reveal delay={0.05}>
                    <div className="mt-8 border-t border-border pt-6 grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground uppercase text-[9px] tracking-wider block">GRADE STANDARD</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{PRODUCTS[1].grade}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase text-[9px] tracking-wider block">PACKAGING</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{PRODUCTS[1].packaging}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground uppercase text-[9px] tracking-wider block">TARGET APPLICATION</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{PRODUCTS[1].application}</span>
                      </div>
                    </div>
                  </Reveal>

                  <Reveal delay={0.1}>
                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                      <Link
                        href={`/products/${getSlug(PRODUCTS[1].name)}`}
                        className="group inline-flex items-center gap-2 bg-foreground px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-background hover:bg-primary transition-colors"
                      >
                        View Specifications
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </Reveal>
                </div>
                <div className="lg:col-span-7 order-1 lg:order-2">
                  <Reveal>
                    <div className="relative aspect-[16/11] w-full overflow-hidden border border-border bg-secondary group">
                      <Image
                        src={PRODUCTS[1].image}
                        alt={PRODUCTS[1].name}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 55vw"
                      />
                      <div className="absolute top-4 left-4 bg-background/90 px-3 py-1.5 border border-border text-[10px] font-mono uppercase text-foreground">
                        {PRODUCTS[1].format}
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>
            )}

            {/* PRODUCT 03: Bulk & Raw Export - Full-width Image with Floating Typography */}
            {PRODUCTS[2] && (
              <div className="relative border border-border overflow-hidden bg-foreground text-background">
                {/* Background image container */}
                <div className="absolute inset-0 z-0 opacity-20">
                  <Image
                    src={PRODUCTS[2].image}
                    alt={PRODUCTS[2].name}
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                  />
                </div>

                <div className="relative z-10 p-8 md:p-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end min-h-[500px]">
                  <div className="lg:col-span-7">
                    <span className="font-mono text-xs font-bold text-accent">PRODUCT 03</span>
                    <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-background mt-2">
                      {PRODUCTS[2].name}
                    </h2>
                    <p className="mt-6 text-sm md:text-base leading-relaxed text-background/70 max-w-xl">
                      {PRODUCTS[2].copy}
                    </p>

                    <div className="mt-8 border-t border-background/25 pt-6 grid grid-cols-2 gap-4 text-xs font-mono max-w-lg">
                      <div>
                        <span className="text-background/40 uppercase text-[9px] tracking-wider block">GRADE STANDARD</span>
                        <span className="font-semibold text-background mt-0.5 block">{PRODUCTS[2].grade}</span>
                      </div>
                      <div>
                        <span className="text-background/40 uppercase text-[9px] tracking-wider block">PACKAGING</span>
                        <span className="font-semibold text-background mt-0.5 block">{PRODUCTS[2].packaging}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex justify-start lg:justify-end">
                    <Link
                      href={`/products/${getSlug(PRODUCTS[2].name)}`}
                      className="group inline-flex items-center gap-3 bg-background text-foreground px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] transition-colors hover:bg-primary hover:text-background whitespace-nowrap"
                    >
                      View Specifications
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* TAILORED SPECIFICATION CTA */}
      <section className="py-24 md:py-32 bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 text-center max-w-3xl">
          <Reveal>
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              CUSTOM SPECIFICATIONS
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl">
              Need a specification tailored to your market?
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground max-w-xl mx-auto">
              We work closely with distributors and food brands to accommodate customized sizing, bespoke seasoning profiles, and custom bulk or retail packaging requirements.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-3 bg-foreground px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary"
            >
              Enquire Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
