import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Ship, MapPin, Globe } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { WorldMap, GLOBAL_MARKETS } from "@/components/world-map"

export const metadata: Metadata = {
  title: "Global Reach — Videha Overseas",
  description:
    "Videha Overseas exports premium makhana from India to markets across Europe, the Middle East, North America and Southeast Asia.",
}

const REGIONAL_DETAILS = [
  {
    num: "01",
    name: "NORTH AMERICA",
    corridor: "JNPT/Kolkata → New York / Los Angeles / Toronto",
    transit: "18 - 24 Sea Freight Days",
    spec: "Grade AAA Jumbo (6mm+) Puffs",
    details: "Catering to organic retail buyers, specialized wellness snack brands, and extensive South Asian distributor networks. Double moisture barriers preserve puff structure across inland transit routes."
  },
  {
    num: "02",
    name: "EUROPE",
    corridor: "Kolkata Port → Rotterdam / Hamburg / Felixstowe",
    transit: "14 - 20 Sea Freight Days",
    spec: "Nitrogen Flushed Retail & Bulk Sacks",
    details: "Supplying EU distributors under IFS/BRC food safety alignment. Every dispatch includes complete heavy metal analyses and batch Certificate of Analysis (COA) matching European food laws."
  },
  {
    num: "03",
    name: "MIDDLE EAST",
    corridor: "JNPT Mumbai → Jebel Ali (Dubai) / Jeddah / Dammam",
    transit: "4 - 7 Sea Freight Days",
    spec: "Vacuum Bags & Custom Tin Box Packaging",
    details: "Fast ocean transit with Halal certified processing loops. We provide dual-language Arabic/English label layouts conforming to GCC customs standards."
  },
  {
    num: "04",
    name: "SOUTHEAST ASIA",
    corridor: "Kolkata Port → Singapore / Port Klang / Bangkok",
    transit: "6 - 10 Sea Freight Days",
    spec: "Bulk Popped Lots & Graded Raw Seeds",
    details: "Volume supplier for snack mills, re-packaging companies, and ASEAN retail chains. Reliable logistics ensure high container weight limits are matched accurately."
  },
  {
    num: "05",
    name: "EAST ASIA",
    corridor: "Kolkata Port → Yokohama / Busan",
    transit: "10 - 14 Sea Freight Days",
    spec: "Grade AAA Super Jumbo Extra Crispy",
    details: "Catering to premier health snack brands in Japan and South Korea. High-frequency sorting lines guarantee zero shell content and uniform size."
  },
  {
    num: "06",
    name: "OCEANIA",
    corridor: "JNPT Mumbai → Sydney / Melbourne / Auckland",
    transit: "16 - 22 Sea Freight Days",
    spec: "Moisture-Locked Export Master Cartons",
    details: "Supporting organic importers and distributor systems. Multi-ply carton stacking ensures boxes withstand long sea lanes without structural collapse."
  }
]

export default function GlobalReachPage() {
  return (
    <main className="overflow-hidden bg-background">
      {/* Hero Header */}
      <header className="border-b border-border bg-secondary/30 pt-36 md:pt-48 pb-16">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-4xl">
            <Reveal>
              <SectionLabel>GLOBAL REACH</SectionLabel>
            </Reveal>
            <h1 className="mt-6 text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-foreground text-balance">
              From India.<br />To Global Markets.
            </h1>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                India is the proud origin of makhana. From our Bihar wetland facility, we move graded, compliance-tested shipments to importers across six major global trade zones.
              </p>
            </Reveal>
          </div>
        </div>
      </header>

      {/* World Map Section */}
      <section className="border-b border-border py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <div className="mb-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                INTERACTIVE TRADE ROUTE MAP
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Select a highlighted market destination to view specific export specifications and transit days.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <WorldMap interactive className="mt-8" />
          </Reveal>
        </div>
      </section>

      {/* One Origin, Multiple Markets composition */}
      <section className="bg-primary text-primary-foreground py-24 md:py-32 border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <Reveal>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent font-semibold block mb-4">
                  CENTRAL SUPPLY LANES
                </span>
                <h2 className="text-3xl md:text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
                  One Origin.<br />Multiple Markets.
                </h2>
                <p className="mt-8 text-sm md:text-base text-primary-foreground/75 leading-relaxed max-w-xl">
                  While demand is global, production remains local. Popped makhana cultivation cannot be replicated easily outside the wetland marshes of eastern India. Videha Overseas acts as the critical bridge, organizing origin procurement to coordinate dispatches to all major ports.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-6 font-mono text-xs border-l border-primary-foreground/15 pl-6 lg:pl-10">
              <div>
                <span className="text-accent text-[10px]">EXPORT COMPLIANCE</span>
                <span className="block mt-1 text-primary-foreground">FSSAI Export House License</span>
              </div>
              <div className="border-t border-primary-foreground/15 pt-4">
                <span className="text-accent text-[10px]">SEA CORRIDORS</span>
                <span className="block mt-1 text-primary-foreground">Kolkata Port (Eastern India) & JNPT (Western India)</span>
              </div>
              <div className="border-t border-primary-foreground/15 pt-4">
                <span className="text-accent text-[10px]">BATCH QUALITY TESTED</span>
                <span className="block mt-1 text-primary-foreground">{"Moisture Content < 4.5% locked per container load"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Region Showcase Editorial index */}
      <section className="py-24 md:py-32 border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-2xl mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              CORRIDOR SPECIFICATIONS INDEX
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              Regional Delivery Metrics
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Transit parameters and shipping details categorized by destination markets.
            </p>
          </div>

          <div className="flex flex-col">
            {REGIONAL_DETAILS.map((region, idx) => (
              <Reveal key={region.num} delay={idx * 0.05}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 py-10 border-t border-border/70 first:border-t-0 items-start group">
                  <div className="lg:col-span-3 flex items-baseline gap-4">
                    <span className="font-mono text-xl font-bold text-accent/50 group-hover:text-accent transition-colors">
                      {region.num}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-foreground tracking-tight">
                        {region.name}
                      </h3>
                      <span className="text-[10px] font-mono text-muted-foreground block mt-1">
                        EST. TRANSIT: {region.transit}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {region.details}
                  </div>

                  <div className="lg:col-span-4 text-xs font-mono text-foreground flex flex-col gap-2">
                    <div>
                      <span className="text-muted-foreground uppercase text-[9px] block">SHIPPING ROUTE</span>
                      <span className="font-semibold block mt-0.5">{region.corridor}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground uppercase text-[9px] block">STANDARD GRADE SENT</span>
                      <span className="font-semibold block mt-0.5">{region.spec}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sourcing & Shipping reliability guarantees */}
      <section className="py-24 md:py-32 bg-secondary/30 border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border border-border bg-background">
              <Ship className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-base font-bold text-foreground">Port-to-Port Tracking</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                All ocean consignments are booked via premier container lines, providing digital location updates from Kolkata orJNPT departure hubs to your destination port.
              </p>
            </div>

            <div className="p-8 border border-border bg-background">
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-base font-bold text-foreground">Compliance Documentation</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Our documentation specialists file and coordinate local export customs clearances, assuring your commercial invoice and health papers map destination border checks.
              </p>
            </div>

            <div className="p-8 border border-border bg-background">
              <Globe className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-base font-bold text-foreground">Global Incoterms Adaptability</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We accommodate FOB (Free on Board), CFR (Cost and Freight), and CIF (Cost, Insurance, and Freight) agreements according to your trade framework.
              </p>
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
                <h3 className="text-2xl md:text-3xl font-semibold text-background mt-2 text-balance">
                  Connect to Lock Container Sourcing Slots
                </h3>
                <p className="text-sm text-background/70 mt-2 max-w-xl">
                  Contact our coordinators to determine estimated freight quotes and ocean shipping lead times matching your destination.
                </p>
              </div>

              <Link
                href="/contact?subject=Transit+Lanes+%26+Container+Sourcing"
                className="group inline-flex items-center gap-3 border border-background/40 px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"
              >
                Inquire About Transit Lanes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
