"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { RevealText } from "@/components/reveal"

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 md:pt-40">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 md:grid-cols-12 md:gap-8 md:px-10">
        {/* Copy — left, asymmetric */}
        <div className="flex flex-col justify-center md:col-span-5 md:pb-24">
          {/* <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionLabel>Indian Origin · Global Reach</SectionLabel>
          </motion.div> */}

          <h1 className="mt-7 text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.02em] text-foreground text-balance sm:text-6xl md:text-[4.1rem]">
            <RevealText text="Premium Makhana," delay={0.1} immediate />
            <span className="mt-1 block text-primary">
              <RevealText text="From India to the World." delay={0.25} immediate />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-md text-[15px] leading-relaxed text-muted-foreground"
          >
            We source, process and export fox nuts of an uncompromising standard —
            connecting India&apos;s finest harvests to discerning markets across the globe.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#products"
              className="group inline-flex items-center gap-3 bg-foreground px-7 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary"
            >
              Explore Products
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-foreground underline-offset-8 hover:underline"
            >
              Talk to Us
            </a>
          </motion.div>
        </div>

        {/* Image — right, dominant */}
        <motion.figure
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative md:col-span-7"
        >
          <div className="relative max-h-[500px] aspect-[4/5] w-full overflow-hidden sm:aspect-[16/11] md:aspect-[4/5]">
            <Image
              src="/images/hero-makhana.png"
              alt="Premium ivory-white makhana spilling from a linen cloth"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
          {/* <figcaption className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <span>Phool Makhana · Grade AAA</span>
            <span>Est. Bihar, India</span>
          </figcaption> */}
        </motion.figure>
      </div>
    </section>
  )
}
