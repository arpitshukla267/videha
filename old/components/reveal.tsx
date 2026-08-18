"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: "div" | "span" | "li" | "p" | "h2" | "figure"
}

export function Reveal({ children, className, delay = 0, y = 24, as = "div" }: RevealProps) {
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}

/* Reveals text word-by-word with a subtle stagger.
   Use `immediate` for above-the-fold text so it animates on mount
   rather than waiting for an intersection trigger. */
export function RevealText({
  text,
  className,
  delay = 0,
  immediate = false,
}: {
  text: string
  className?: string
  delay?: number
  immediate?: boolean
}) {
  const words = text.split(" ")
  const trigger = immediate
    ? { animate: { y: "0%" } }
    : { whileInView: { y: "0%" }, viewport: { once: true, margin: "-60px" } }
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            {...trigger}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.045,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
