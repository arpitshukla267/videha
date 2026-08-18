"use client"

import { motion } from "framer-motion"

/* 
  1. Origin Seal / Quality Emblem SVG Graphic
  Rotates subtly or acts as a premium editorial stamp
*/
export function OriginSealGraphic({ className = "w-28 h-28" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.svg
        viewBox="0 0 200 200"
        className="w-full h-full text-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <path
          id="sealCirclePath"
          d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
          fill="none"
        />
        <text className="text-[11.5px] font-semibold uppercase tracking-[0.28em] fill-primary/80">
          <textPath href="#sealCirclePath" startOffset="0%">
            • VIDEHA OVERSEAS • BIHAR ORIGIN • GRADE AAA EXPORT
          </textPath>
        </text>
      </motion.svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">EST.</span>
        <span className="text-xs font-semibold tracking-tight text-foreground">INDIA</span>
        <span className="h-0.5 w-4 bg-accent/60 my-0.5" />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">100% TRACEABLE</span>
      </div>
    </div>
  )
}

/*
  2. Makhana Grading & Quality Matrix Graphic
  Visual vector diagram showing particle size, moisture standards, and quality parameters
*/
export function MakhanaGradingDiagram({ className = "" }: { className?: string }) {
  return (
    <div className={`border border-border bg-background p-6 md:p-8 ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
            SPECIFICATION MATRIX
          </span>
          <h4 className="mt-1 text-base font-semibold text-foreground">
            Makhana Size & Quality Benchmarks
          </h4>
        </div>
        <span className="hidden sm:inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-primary">
          Export Grade AAA
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Grade 1: Size Standard */}
        <div className="flex flex-col space-y-3 p-4 bg-secondary/30 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">6mm+ Super Jumbo</span>
            <span className="font-mono text-[11px] text-accent">Grade AAA</span>
          </div>
          <div className="relative h-16 w-full flex items-center justify-center bg-background border border-border/40 overflow-hidden">
            {/* SVG Puff Scale */}
            <svg viewBox="0 0 120 50" className="w-24 h-10">
              <circle cx="25" cy="25" r="18" className="fill-primary/15 stroke-primary" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="25" cy="25" r="14" className="fill-primary/20 stroke-primary" strokeWidth="1.5" />
              <circle cx="85" cy="25" r="21" className="fill-accent/20 stroke-accent" strokeWidth="1.5" />
              <text x="85" y="29" textAnchor="middle" className="fill-foreground text-[10px] font-mono font-bold">6mm+</text>
            </svg>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Largest, roundest white pops. Uniform density and supreme crunch for premium retail.
          </p>
        </div>

        {/* Grade 2: Moisture Control */}
        <div className="flex flex-col space-y-3 p-4 bg-secondary/30 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Moisture Barrier</span>
            <span className="font-mono text-[11px] text-primary">&lt; 4.5% Standard</span>
          </div>
          <div className="relative h-16 w-full flex items-center justify-center bg-background border border-border/40 overflow-hidden px-4">
            <div className="w-full space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Moisture Level</span>
                <span className="text-primary font-bold">3.8% Optimal</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: "38%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Sealed in multi-layer barrier foil to maintain crunch across 12+ months sea freight.
          </p>
        </div>

        {/* Grade 3: Purity & Zero Defect */}
        <div className="flex flex-col space-y-3 p-4 bg-secondary/30 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Whiteness & Purity</span>
            <span className="font-mono text-[11px] text-accent">98.5% Ivory</span>
          </div>
          <div className="relative h-16 w-full flex items-center justify-center bg-background border border-border/40">
            <div className="flex items-center space-x-2 text-xs font-mono text-foreground">
              <span className="inline-block h-3 w-3 rounded-full bg-primary" />
              <span>Zero Artificial Bleach</span>
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Naturally sun-dried and flame-roasted. Clean natural ivory color with zero chemicals.
          </p>
        </div>
      </div>
    </div>
  )
}

/*
  3. Traceability Flow Graphic (Wetland -> Export Container)
*/
export function TraceabilityFlowGraphic({ className = "" }: { className?: string }) {
  const steps = [
    {
      num: "01",
      title: "Wetland Lotus Harvest",
      sub: "Mithila Ponds, Bihar",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v10 M7 12h10" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "Sun-Drying & Sorting",
      sub: "Size & Density Batching",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Precision Roasting",
      sub: "Controlled Popping",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
    },
    {
      num: "04",
      title: "Lab Testing & COA",
      sub: "Moisture & Hygiene Audit",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      num: "05",
      title: "Sealed Export Container",
      sub: "Global Shipping",
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ]

  return (
    <div className={`border border-border bg-secondary/20 p-6 md:p-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
            SUPPLY CHAIN INTEGRITY
          </span>
          <h4 className="text-lg font-semibold text-foreground">
            End-to-End Batch Traceability Protocol
          </h4>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          QR / Batch Code Tagged on Every SACK
        </span>
      </div>

      <div className="mt-8 relative">
        {/* Connector line for desktop */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col bg-background border border-border p-4 relative group hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-accent">{s.num}</span>
                <div className="p-1.5 rounded-full bg-secondary text-primary">
                  {s.icon}
                </div>
              </div>
              <h5 className="text-sm font-semibold text-foreground leading-snug">{s.title}</h5>
              <p className="text-[11px] text-muted-foreground mt-1">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/*
  4. B2B Comparison Matrix Graphic (Videha vs Generic Exporters)
*/
export function B2BComparisonMatrix({ className = "" }: { className?: string }) {
  const features = [
    {
      feature: "Origin Sourcing",
      videha: "Direct wetland farmer clusters in Bihar",
      others: "Middlemen traders & mixed regional batches",
    },
    {
      feature: "Size Grading Uniformity",
      videha: "6mm+ / Grade AAA laser sorted (>95% uniformity)",
      others: "Variable sizes (mixed 4mm - 6mm)",
    },
    {
      feature: "Moisture Content",
      videha: "Guaranteed < 4.5% with double moisture foil",
      others: "6% - 8% (vulnerable to softening in transit)",
    },
    {
      feature: "Batch Documentation & COA",
      videha: "Lab Certificate of Analysis & Phytosanitary with every lot",
      others: "Basic commercial invoice only",
    },
    {
      feature: "Custom Private Label Packaging",
      videha: "Full OEM, nitrogen flushing & pouch customization",
      others: "Bulk sacks only",
    },
    {
      feature: "Export Logistics Support",
      videha: "Dedicated EXIM desk, door-to-port CFR/FOB clearance",
      others: "Ex-factory delivery only",
    },
  ]

  return (
    <div className={`border border-border bg-background p-6 md:p-10 ${className}`}>
      <div className="mb-8 max-w-2xl">
        <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-accent">
          THE VIDEHA ADVANTAGE
        </span>
        <h3 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">
          Why International Importers Partner With Us
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Built specifically to eliminate supply-chain friction for foreign buyers and global snack brands.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b-2 border-border text-[11px] uppercase tracking-wider font-mono text-muted-foreground">
              <th className="py-3 px-4 font-normal w-1/3">Key Export Metric</th>
              <th className="py-3 px-4 font-semibold text-primary w-1/3 bg-primary/5">
                Videha Overseas Standard
              </th>
              <th className="py-3 px-4 font-normal w-1/3">Standard Commodity Suppliers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {features.map((item, idx) => (
              <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                <td className="py-4 px-4 font-medium text-foreground">{item.feature}</td>
                <td className="py-4 px-4 font-medium text-foreground bg-primary/5 border-x border-border/40">
                  <div className="flex items-start space-x-2">
                    <span className="inline-block mt-0.5 text-primary">✓</span>
                    <span>{item.videha}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <span className="inline-block mt-0.5 text-muted-foreground/60">✕</span>
                    <span>{item.others}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/*
  5. Compliance & Certification Badges Graphic
*/
export function ComplianceBadgesGraphic({ className = "" }: { className?: string }) {
  const badges = [
    { label: "ISO 22000", sub: "Food Safety Mgt" },
    { label: "HACCP", sub: "Hazard Audit Certified" },
    { label: "APEDA & FSSAI", sub: "Govt. Export Registered" },
    { label: "US FDA Aligned", sub: "Import Compliant" },
    { label: "HALAL & KOSHER", sub: "Global Standards Ready" },
    { label: "100% ORGANIC", sub: "Natural Wetland Grown" },
  ]

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      {badges.map((b, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center p-4 border border-border bg-background text-center hover:border-primary/60 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center mb-2 bg-primary/5 group-hover:bg-primary/10 transition-colors">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span className="text-xs font-bold font-mono text-foreground">{b.label}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{b.sub}</span>
        </div>
      ))}
    </div>
  )
}
