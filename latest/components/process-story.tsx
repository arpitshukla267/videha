"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { FeatureFilmstrip } from "@/components/ui/feature-filmstrip"
import { PROCESS_STEPS as STEPS } from "@/lib/content"

export function ProcessStory() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const imageRefs = useRef<Array<HTMLDivElement | null>>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(max-width: 767px)").matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const imgs = imageRefs.current.filter(Boolean) as HTMLDivElement[]

      // Initial frame states: first visible, rest revealed from top with a slight scale-up
      gsap.set(imgs[0], { clipPath: "inset(0% 0% 0% 0%)", scale: 1, opacity: 1 })
      imgs.slice(1).forEach((el) => {
        gsap.set(el, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.18, opacity: 1 })
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * STEPS.length,
          scrub: 1,
          pin: pinRef.current,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              STEPS.length - 1,
              Math.floor(self.progress * STEPS.length),
            )
            setActive(idx)
          },
        },
      })

      for (let i = 1; i < imgs.length; i++) {
        tl.to(
          imgs[i - 1],
          { scale: 1.08, duration: 1, ease: "none" },
          i - 1 + 0.4,
        )
        tl.to(
          imgs[i],
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            duration: 1,
            ease: "power2.inOut",
          },
          i - 1 + 0.4,
        )
        // hold
        tl.to({}, { duration: 0.6 })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="process"
      className="relative border-t border-border bg-secondary/30">
      {/* ===== Desktop: pinned cinematic story ===== */}
      <div ref={sectionRef} className="hidden md:block py-6">
        <div ref={pinRef} className="relative h-screen w-full overflow-hidden">
          <div className="mx-auto grid h-full max-w-[1400px] grid-cols-12 items-stretch gap-0 px-10">
            {/* Left — text */}
            <div className="col-span-5 flex flex-col justify-around pt-28 pb-20 pr-10 h-full">
              <h2 className="flex flex-col text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground md:text-5xl">
                <SectionLabel className="mb-4">Our Process</SectionLabel>
                <span className="text-foreground">
                  From Source to Global Markets
                </span>
              </h2>

              <div className="relative mt-22 h-[220px] my-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="text-5xl font-semibold tracking-tight text-primary/50">
                        {STEPS[active].num}
                      </span>
                      <span className="text-md font-medium uppercase tracking-[0.28em] text-accent">
                        {STEPS[active].label}
                      </span>
                    </div>
                    <h3 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
                      {STEPS[active].heading}
                    </h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
                      {STEPS[active].copy}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right — stacked frames */}
            <div className="col-span-7 flex items-center py-16">
              <div className="relative aspect-[4/5] h-full max-h-[78vh] w-full overflow-hidden">
                {STEPS.map((s, i) => (
                  <div
                    key={s.num}
                    ref={(el) => {
                      imageRefs.current[i] = el;
                    }}
                    className="absolute inset-0 will-change-[clip-path,transform]"
                    style={{ zIndex: i + 1 }}
                  >
                    <Image
                      src={s.image || "/placeholder.svg"}
                      alt={`${s.label} — ${s.heading}`}
                      fill
                      sizes="58vw"
                      className="object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-foreground/40 to-transparent" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mobile: pinned horizontal filmstrip with unified heading & dots ===== */}
      <FeatureFilmstrip
        title={
          <div>
            <SectionLabel className="mb-2">Our Process</SectionLabel>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
              From Source to Global Markets
            </h2>
          </div>
        }
        items={STEPS.map((s) => ({
          num: s.num,
          title: s.heading,
          tagline: s.label,
          description: s.copy,
          image: s.image || "/placeholder.svg",
        }))}
      />
    </section>
  );
}
