"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { RevealText } from "@/components/reveal"

const BANNERS = [
  { image: "/hero.webp", mobileImage: "/hero-mobile.webp", alt: "Lotus wetlands at dawn in Bihar, India" },
  { image: "/images/process-export.png", mobileImage: "/images/process-export.png", alt: "Makhana export shipment ready for global markets" },
  { image: "/brand-statement.png", mobileImage: "/brand-statement.png", alt: "Indian lotus wetlands at dawn" },
]

const SLIDE_DURATION = 5000

export function Hero() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setActive((i) => (i + 1) % BANNERS.length)
    }, SLIDE_DURATION)
    return () => clearTimeout(t)
  }, [active])

  const banner = BANNERS[active]

  return (
    <section id="top" className="relative w-full bg-background overflow-hidden">
      <div className="relative flex items-center min-h-[100vh] w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={banner.image}
                alt={banner.alt}
                fill
                priority
                sizes="100vw"
                className="hidden md:block object-cover object-center"
              />
              <Image
                src={banner.mobileImage}
                alt={banner.alt}
                fill
                priority
                sizes="100vw"
                className=" md:hidden object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Soft black overlay like in about section for legibility without hiding the image */}
          <div className="absolute inset-0 bg-black/35 bg-gradient-to-r from-black/45 via-black/25 to-black/5" />
        </div>

        {/* Content Centered on Y-axis */}
        <div className="relative z-10 flex w-full items-center pt-24 pb-16">
          <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
            <h1 className="max-w-2xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.02em] text-white text-balance sm:text-6xl md:text-[4rem]">
              <RevealText text="Premium Makhana," delay={0.15} immediate />
              <RevealText text="from India to the world." delay={0.3} immediate />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-white/85"
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

        {/* Dot indicators */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0 md:bottom-10">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to banner ${i + 1}`}
              className="group p-1.5"
            >
              {i === active ? (
                <span className="relative block h-1 w-7 overflow-hidden rounded-full bg-white/25">
                  <motion.span
                    key={active}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                    className="absolute inset-0 origin-left rounded-full bg-white"
                  />
                </span>
              ) : (
                <span className="block h-1.5 w-1.5 rounded-full bg-white/40 transition-colors duration-300 group-hover:bg-white/70" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}