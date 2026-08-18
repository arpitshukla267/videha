"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { RevealText } from "@/components/reveal"

const HERO_MASK = `
  radial-gradient(ellipse 62% 68% at 50% 40%, black 55%, transparent 100%),
  radial-gradient(ellipse 30% 26% at 14% 78%, black 40%, transparent 100%),
  radial-gradient(ellipse 34% 24% at 86% 20%, black 40%, transparent 100%),
  radial-gradient(ellipse 40% 22% at 78% 88%, black 40%, transparent 100%),
  radial-gradient(ellipse 26% 20% at 22% 12%, black 40%, transparent 100%)
`

export function Hero() {
  return (
    <section id="top" className="relative w-full bg-background">
      <div className="relative h-[92vh] min-h-[100vh] w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            maskImage: HERO_MASK,
            WebkitMaskImage: HERO_MASK,
          }}
        >
          <Image
            src="/hero-bg.jpg"
            alt="Lotus wetlands at dawn in Bihar, India"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          {/* Gradient for legibility behind the text */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,14,10,0.15) 0%, rgba(10,14,10,0.3) 45%, rgba(10,14,10,0.8) 100%)",
            }}
          />
        </div>

        {/* Guaranteed smooth fade into the page — independent of the mask above */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[30vh]"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(255,252,243,0.5) 55%, var(--background) 92%)",
            filter: "blur(4px)",
          }}
        />

        <div className="relative z-10 flex h-full items-end">
          <div className="mx-auto w-full max-w-[1400px] px-5 pb-28 md:px-10 md:pb-36">
            <h1 className="max-w-2xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.02em] text-white text-balance sm:text-6xl md:text-[4rem]">
              <RevealText text="Premium Makhana," delay={0.15} immediate />
              <RevealText text="from India to the world." delay={0.3} immediate />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75"
            >
              Sourced from the wetlands of Bihar, exported to discerning
              markets across the globe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9"
            >
              <a
                href="#products"
                className="group inline-flex items-center gap-3 border border-white/40 px-7 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#0A0E0A]"
              >
                Explore Products
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}