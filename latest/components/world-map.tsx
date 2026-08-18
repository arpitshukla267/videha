"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"

export type MarketDestination = {
  id: string
  name: string
  region: string
  x: number
  y: number
  ports: string
  transit: string
  packaging: string
  description: string
}

export const GLOBAL_MARKETS: MarketDestination[] = [
  {
    id: "north-america",
    name: "North America",
    region: "USA & Canada",
    x: 210,
    y: 185,
    ports: "New York, Los Angeles, Toronto",
    transit: "18 - 24 Sea Freight Days",
    packaging: "Retail Pouches & Bulk 10kg Sacks",
    description: "Serving leading health food brands, ethnic distributors, and private-label retail chains across the US & Canada.",
  },
  {
    id: "europe",
    name: "Europe",
    region: "UK, EU & Nordics",
    x: 515,
    y: 150,
    ports: "Rotterdam, Hamburg, Felixstowe",
    transit: "14 - 20 Sea Freight Days",
    packaging: "Nitrogen Flush Barrier Pouches",
    description: "Complete EU food safety compliance (IFS/BRC aligned) with full batch documentation for European retailers.",
  },
  {
    id: "middle-east",
    name: "Middle East",
    region: "GCC & Levant",
    x: 585,
    y: 230,
    ports: "Jebel Ali (Dubai), Jeddah, Dammam",
    transit: "4 - 7 Sea Freight Days",
    packaging: "Vacuum Bulk Sacks & Custom Tins",
    description: "Rapid direct sea transit from western Indian ports with Halal certification & Arabic labeling compliance.",
  },
  {
    id: "southeast-asia",
    name: "Southeast Asia",
    region: "ASEAN Hubs",
    x: 785,
    y: 285,
    ports: "Singapore, Port Klang, Bangkok",
    transit: "6 - 10 Sea Freight Days",
    packaging: "Bulk & Flavoured Snack Ready",
    description: "Consistent volume supply to snack processors, re-exporters, and Asian grocery networks.",
  },
  {
    id: "east-asia",
    name: "East Asia",
    region: "Japan & Korea",
    x: 840,
    y: 195,
    ports: "Yokohama, Busan",
    transit: "10 - 14 Sea Freight Days",
    packaging: "Grade AAA Extra Jumbo (6mm+)",
    description: "Strict quality tolerance shipments catering to premium healthy snack buyers in East Asia.",
  },
  {
    id: "oceania",
    name: "Oceania",
    region: "Australia & New Zealand",
    x: 860,
    y: 390,
    ports: "Sydney, Melbourne, Auckland",
    transit: "16 - 22 Sea Freight Days",
    packaging: "Moisture-Locked Export Master Cartons",
    description: "Supplying mainstream supermarket suppliers and specialized organic import networks.",
  },
]

export const INDIA_ORIGIN = {
  x: 665,
  y: 245,
  label: "Bihar, India",
  ports: "Kolkata & JNPT Outlets",
}

/* Quadratic curve string generator for smooth arched trade routes */
function getBezierRoutePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const cx = from.x + dx * 0.5
  // Arch the curve upwards proportional to distance
  const cy = from.y + dy * 0.5 - Math.min(Math.abs(dx) * 0.28, 80)
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
}

type WorldMapProps = {
  interactive?: boolean
  className?: string
  compact?: boolean
}

export function WorldMap({ interactive = true, className = "", compact = false }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-60px" })
  const [selectedMarket, setSelectedMarket] = useState<MarketDestination | null>(GLOBAL_MARKETS[0])

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* SVG Container with Aspect Ratio */}
      <div className="relative w-full overflow-hidden border border-border bg-[#faf8f5] shadow-xs">
        {/* Map Header / Control bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-border bg-background px-4 py-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-semibold text-foreground">ORIGIN: BIHAR, INDIA</span>
            <span className="text-muted-foreground hidden sm:inline">| (25.5941° N, 85.1376° E)</span>
          </div>
          <div className="text-muted-foreground flex items-center space-x-4 text-[11px]">
            <span>6 ACTIVE TRADE LANES</span>
            <span className="hidden md:inline">• CLICK MARKET FOR SPECS</span>
          </div>
        </div>

        {/* Map SVG Canvas */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-auto select-none"
          role="img"
          aria-label="Videha Overseas Global Trade Map"
        >
          <defs>
            {/* Gradient for Trade Lanes */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing filter for origin */}
            <filter id="glowOrigin" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines (Latitude / Longitude) */}
          <g className="stroke-border/40" strokeWidth="0.5" strokeDasharray="3 6">
            {[100, 200, 300, 400].map((y) => (
              <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} />
            ))}
            {[150, 300, 450, 600, 750, 900].map((x) => (
              <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="500" />
            ))}
          </g>

          {/* Real Continent Polygons & Outlines */}
          <g className="fill-[#e8e3d8] stroke-border/80" strokeWidth="0.75">
            {/* North America */}
            <path d="M 80 80 L 150 70 L 230 65 L 290 85 L 300 120 L 280 150 L 250 170 L 230 210 L 200 230 L 180 200 L 150 190 L 110 170 L 60 140 L 40 100 Z Greenland: M 330 40 L 400 35 L 420 70 L 370 90 L 320 70 Z" />

            {/* South America */}
            <path d="M 230 240 L 280 235 L 320 270 L 330 330 L 290 420 L 260 450 L 230 400 L 210 320 L 220 270 Z" />

            {/* Europe */}
            <path d="M 450 120 L 480 90 L 530 85 L 570 105 L 580 145 L 530 170 L 490 165 L 460 145 Z UK: M 435 125 L 450 115 L 460 135 L 440 145 Z" />

            {/* Africa */}
            <path d="M 470 185 L 530 175 L 590 195 L 610 260 L 580 340 L 540 380 L 500 350 L 460 260 L 450 210 Z Madagascar: M 620 320 L 635 310 L 640 350 L 625 360 Z" />

            {/* Eurasia / Mainland Asia */}
            <path d="M 580 90 L 680 70 L 820 80 L 920 110 L 960 160 L 920 220 L 840 240 L 760 230 L 680 220 L 620 180 Z" />

            {/* Middle East */}
            <path d="M 540 180 L 600 175 L 620 220 L 590 250 L 550 240 Z" />

            {/* India Subcontinent */}
            <path
              d="M 630 200 L 680 195 L 700 230 L 680 290 L 650 300 L 620 250 Z"
              className="fill-primary/20 stroke-primary"
              strokeWidth="1"
            />

            {/* Southeast Asia & Maritime Archipelago */}
            <path d="M 740 250 L 790 240 L 820 270 L 790 310 L 750 300 Z M 760 320 L 820 315 L 850 340 L 800 350 Z" />

            {/* East Asia / Japan / Korea */}
            <path d="M 830 160 L 870 150 L 890 180 L 850 210 Z Japan: M 880 160 L 910 150 L 920 190 L 890 200 Z" />

            {/* Australia / Oceania */}
            <path d="M 780 360 L 870 350 L 910 380 L 890 440 L 810 450 L 760 410 Z NZ: M 930 430 L 950 420 L 960 460 L 940 470 Z" />
          </g>

          {/* Animated Trade Route Curves */}
          <g>
            {GLOBAL_MARKETS.map((market, idx) => {
              const pathD = getBezierRoutePath(INDIA_ORIGIN, market)
              const isSelected = selectedMarket?.id === market.id

              return (
                <g key={`route-${market.id}`}>
                  {/* Background Path Line */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    className={isSelected ? "stroke-primary" : "stroke-primary/40"}
                    strokeWidth={isSelected ? "2.5" : "1.25"}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={inView ? { pathLength: 1, opacity: isSelected ? 1 : 0.6 } : {}}
                    transition={{
                      duration: 1.4,
                      delay: 0.3 + idx * 0.15,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />

                  {/* Flow Dash Animation along route */}
                  {inView && (
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke="url(#routeGradient)"
                      strokeWidth={isSelected ? "3" : "2"}
                      strokeDasharray="8 12"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}
                </g>
              )
            })}
          </g>

          {/* Destination Interactive Markers */}
          {GLOBAL_MARKETS.map((market, idx) => {
            const isSelected = selectedMarket?.id === market.id

            return (
              <motion.g
                key={`marker-${market.id}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.8 + idx * 0.1 }}
                onClick={() => interactive && setSelectedMarket(market)}
                className="cursor-pointer group"
                style={{ transformOrigin: `${market.x}px ${market.y}px` }}
              >
                {/* Outer Ring */}
                <circle
                  cx={market.x}
                  cy={market.y}
                  r={isSelected ? 12 : 8}
                  className={
                    isSelected
                      ? "fill-accent/20 stroke-accent"
                      : "fill-background stroke-primary/70 group-hover:stroke-accent"
                  }
                  strokeWidth="1.5"
                />

                {/* Inner Dot */}
                <circle
                  cx={market.x}
                  cy={market.y}
                  r={isSelected ? 5 : 3.5}
                  className={isSelected ? "fill-accent" : "fill-primary group-hover:fill-accent"}
                />

                {/* Label text */}
                <text
                  x={market.x}
                  y={market.y - 14}
                  textAnchor="middle"
                  className={
                    isSelected
                      ? "fill-foreground font-semibold text-[12px]"
                      : "fill-muted-foreground font-medium text-[11px] group-hover:fill-foreground"
                  }
                  style={{ letterSpacing: "0.04em" }}
                >
                  {market.name}
                </text>
              </motion.g>
            )
          })}

          {/* India Origin Pulsing Pin */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            filter="url(#glowOrigin)"
          >
            {/* Pulse Wave */}
            <circle cx={INDIA_ORIGIN.x} cy={INDIA_ORIGIN.y} r="18" className="fill-primary/10">
              <animate
                attributeName="r"
                values="12;26;12"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Core Pin */}
            <circle cx={INDIA_ORIGIN.x} cy={INDIA_ORIGIN.y} r="8" className="fill-primary stroke-background" strokeWidth="2" />
            <circle cx={INDIA_ORIGIN.x} cy={INDIA_ORIGIN.y} r="3" className="fill-background" />

            {/* Origin Callout */}
            <g transform={`translate(${INDIA_ORIGIN.x + 12}, ${INDIA_ORIGIN.y + 4})`}>
              <rect x="0" y="-12" width="95" height="20" rx="2" className="fill-foreground/90" />
              <text x="8" y="2" className="fill-background text-[10px] font-mono font-bold tracking-wider">
                EXPORT HUB
              </text>
            </g>
          </motion.g>
        </svg>

        {/* Selected Market Info Panel */}
        {selectedMarket && (
          <motion.div
            key={selectedMarket.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border bg-background p-5 md:p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                  SELECTED DESTINATION
                </span>
                <h4 className="text-xl font-bold text-foreground mt-1">{selectedMarket.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{selectedMarket.region}</p>
              </div>

              <div className="md:col-span-5 grid grid-cols-2 gap-4 border-y md:border-y-0 md:border-x border-border py-3 md:py-0 md:px-6">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">DISPATCH PORTS</span>
                  <p className="text-xs font-medium text-foreground mt-0.5">{selectedMarket.ports}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">EST. TRANSIT</span>
                  <p className="text-xs font-semibold text-primary mt-0.5">{selectedMarket.transit}</p>
                </div>
              </div>

              <div className="md:col-span-3 text-right md:text-left">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">SPECIFICATION</span>
                <p className="text-xs text-foreground mt-0.5">{selectedMarket.packaging}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
              {selectedMarket.description}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
