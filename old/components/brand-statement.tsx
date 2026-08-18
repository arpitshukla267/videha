"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export function BrandStatement() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
      <Image
        src="/images/brand-statement.png"
        alt="Indian lotus wetlands at dawn"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-foreground/55" />

      <div className="relative z-10 px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-light leading-[1.15] tracking-[-0.01em] text-background text-balance sm:text-5xl md:text-6xl"
        >
          Rooted in India.
          <br />
          <span className="font-semibold">Ready for the World.</span>
        </motion.h2>
      </div>
    </section>
  )
}
