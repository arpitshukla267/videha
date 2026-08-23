"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { WhyGlobalBuyersChoose } from "@/components/why-global-buyers-choose"

const DIFFERENTIATORS = [
  {
    num: "01",
    title: "PREMIUM SOURCING",
    heading: "Direct Wetland Sourcing Eliminates Middlemen Risks",
    desc: "By coordinating crop procurement directly with local cooperatives in Bihar's wetland belt, we eliminate intermediate traders. This ensures batch purity, seasonal cost savings, and direct origin certifications matching the strict trace requests of international importers.",
    image: "/images/process-source.png"
  },
  {
    num: "02",
    title: "CONSISTENT QUALITY",
    heading: "Grade AAA Uniformity, Batch After Batch",
    desc: "Export markets cannot tolerate batch variation. Every popped lot passes mechanical diameter grading, optical color checks, and moisture testing. Our strict double-sorting limits unpopped kernels and shell rates below 0.5%.",
    image: "/images/quality-macro.png"
  },
  {
    num: "03",
    title: "EXPORT-READY STANDARDS",
    heading: "Nitrogen Flushed & Vacuum Sealed Transit Protection",
    desc: "To survive varied shipping climates and transit timelines without going soft, we drop moisture levels below 4.5% in kiln dryers and immediately pack makhana in nitrogen-flushed or heavy-duty vacuum bags.",
    image: "/images/process-pack.png"
  },
  {
    num: "04",
    title: "RELIABLE SUPPLY",
    heading: "Monthly Capacities & Season Contract Price Locking",
    desc: "Agricultural prices can be volatile. We lock crop season supply pricing for our contract partners and maintain a 24 Metric Ton monthly processing capacity, buffering you from seasonal price spikes and supply deficits.",
    image: "/images/process-process.png"
  },
  {
    num: "05",
    title: "LONG-TERM PARTNERSHIPS",
    heading: "End-to-End Coordination & Transparent Support",
    desc: "We function as a reliable extension of your procurement division. Our team clears phytosanitary checks, prepares customized labeling conforming to destination custom authorities, and handles sea dispatches transparently.",
    image: "/images/process-export.png"
  }
]

const BUYER_EXPECTATIONS = [
  {
    title: "Moisture consistency",
    desc: "Batch moisture guaranteed under 4.5% to maintain crunch through global transit."
  },
  {
    title: "Physical calibration",
    desc: "Jumbo sorting limits small or broken puffs to under 1.5% trace limits."
  },
  {
    title: "Phytosanitary clearance",
    desc: "Certified inspections by ministry agents ensure clean customs releases."
  },
  {
    title: "Packaging integrity",
    desc: "Triple-ply cartons and thick barrier liners avoid transit damages."
  },
  {
    title: "Pricing stability",
    desc: "Locked seasonal volumes protect you from regional market volatility."
  }
]

export default function WhyVidehaPage() {
  return (
    <main className="overflow-hidden bg-background">
      {/* Hero Header with background image */}
      <header className="relative border-b border-border pt-36 md:pt-48 pb-20 md:pb-28 overflow-hidden">
        <Image
          src="/images/hero-makhana.png"
          alt="Premium makhana background"
          fill
          className="object-cover object-center opacity-12"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f6f0]/80 via-[#f8f6f0]/70 to-[#f8f6f0]" />
        <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-4xl">
            <Reveal>
              <SectionLabel>WHY VIDEHA</SectionLabel>
            </Reveal>
            <h1 className="mt-6 text-[clamp(2.5rem,6.5vw,5.2rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-foreground text-balance">
              Built Around Quality.<br />Driven by Trust.
            </h1>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
                Importers choose Videha Overseas because we replace agricultural commodity fluctuations with industrial consistency. We structure sourcing, pricing, quality, and transit paperwork.
              </p>
            </Reveal>
          </div>
        </div>
      </header>

      {/* Differentiators — alternating image/text rows */}
      {/* <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          {DIFFERENTIATORS.map((item, idx) => {
            const isEven = idx % 2 === 0
            return (
              <div
                key={item.num}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center py-20 md:py-28 ${
                  idx !== DIFFERENTIATORS.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className={`relative aspect-[4/3] w-full overflow-hidden border border-border bg-secondary ${
                  isEven ? "lg:order-1" : "lg:order-2"
                }`}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                  <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-xs px-3 py-1.5 border border-border text-[9px] font-mono uppercase tracking-widest text-foreground">
                    {item.num} / 05
                  </div>
                </div>

                <div className={`flex flex-col justify-center ${
                  isEven ? "lg:order-2" : "lg:order-1"
                }`}>
                  <Reveal>
                    <div className="flex items-center gap-3 font-mono text-xs font-bold text-accent">
                      <span>{item.num}</span>
                      <span>—</span>
                      <span className="tracking-widest uppercase">{item.title}</span>
                    </div>
                  </Reveal>

                  <Reveal delay={0.05}>
                    <h3 className="text-2xl md:text-4xl font-semibold text-foreground tracking-tight mt-5 text-balance leading-[1.1]">
                      {item.heading}
                    </h3>
                  </Reveal>

                  <Reveal delay={0.1}>
                    <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed mt-6 max-w-lg">
                      {item.desc}
                    </p>
                  </Reveal>
                </div>
              </div>
            )
          })}
        </div>
      </section> */}

      {/* WHAT BUYERS CAN EXPECT */}
      <section className="py-24 md:py-32 bg-secondary/30 border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-2xl mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              B2B SPECIFICATION GUARANTEES
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              What Buyers Can Expect
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Core operations guarantees structured into every sales agreement.
            </p>
          </div>

          <div className="flex flex-col border border-border bg-background">
            {BUYER_EXPECTATIONS.map((item, idx) => (
              <div
                key={item.title}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 p-8 items-start ${
                  idx !== BUYER_EXPECTATIONS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="md:col-span-1 font-mono text-xs text-accent font-bold">
                  0{idx + 1}
                </div>
                <div className="md:col-span-4 font-bold text-foreground text-sm uppercase tracking-tight">
                  {item.title}
                </div>
                <div className="md:col-span-7 text-xs md:text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhyGlobalBuyersChoose />

      {/* CTA SECTION */}
      <section className="py-20 md:py-28 bg-foreground text-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                  FOREIGN BUYER DESK
                </span>
                <h2 className="text-3xl md:text-4xl font-semibold text-background mt-2 text-balance">
                  Ready to Settle a Sourcing Contract?
                </h2>
                <p className="text-sm text-background/70 mt-2 max-w-xl">
                  Contact our export coordinators to outline pricing slots, seasonal volume locks, and private formulation.
                </p>
              </div>

              <Link
                href="/contact?subject=EXIM+Sourcing+Contract"
                className="group inline-flex items-center gap-3 border border-background/40 px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"
              >
                Start EXIM Enquiry
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
