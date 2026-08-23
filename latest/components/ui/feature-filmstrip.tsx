"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

export type FeatureItem = {
  num: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
};

type FeatureFilmstripProps = {
  items: FeatureItem[];
  /** Rendered inside the SAME sticky block, above the cards — so it stays pinned together */
  title?: ReactNode;
  /** vh of scroll distance per card */
  vhPerCard?: number;
  /** Custom responsive or styling classes (defaults to md:hidden) */
  className?: string;
};

export function FeatureFilmstrip({
  items,
  title,
  vhPerCard = 75,
  className = "md:hidden",
}: FeatureFilmstripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Track scroll progress across the container runway.
     "start start" = top of container aligns with top of viewport (pin starts)
     "end end"     = bottom of container aligns with bottom of viewport (pin ends) */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /*
    Smooth the raw scroll progress with a spring so the filmstrip glides
    instead of snapping 1:1 to scroll events. Tuned for a fluid, slightly
    weighted feel — high-ish stiffness keeps it responsive, damping kills
    any bounce/overshoot.
  */
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 38,
    mass: 0.6,
    restDelta: 0.0005,
  });

  /* 
    CRITICAL CSS TRANSFORM MATH:
    The motion.div track has width = items.length * 100vw (e.g. 400vw for 4 items, 600vw for 6 items).
    In CSS translateX(percentage), 100% means the width of the motion.div itself.
    To slide by 1 card (100vw), we need to shift by 100% / items.length.
    To slide across all (items.length - 1) cards, the maximum shift is:
    ((items.length - 1) / items.length) * 100%.
  */
  const maxShiftPercent =
    items.length > 1 ? ((items.length - 1) / items.length) * 100 : 0;

  const trackX = useTransform(
    smoothProgress,
    [0, 1],
    ["0%", `-${maxShiftPercent}%`],
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ height: `${items.length * vhPerCard}vh` }}
    >
      {/* 
        Single sticky block: holds title + horizontal card filmstrip + dots together.
        Uses 100dvh so it dynamically fits mobile browsers with collapsing address bars.
      */}
      <div className="sticky top-0 h-[100dvh] flex flex-col justify-between px-5 pt-20 pb-6 bg-background">
        {/* Pinned Title */}
        {title && <div className="shrink-0 mb-1">{title}</div>}

        {/* Card Filmstrip Viewport */}
        <div className="flex-1 min-h-0 flex items-center overflow-hidden -mx-5">
          <motion.div
            style={{ x: trackX, translateZ: 0 }}
            className="flex will-change-transform"
          >
            {items.map((item) => (
              <div
                key={item.num}
                className="w-screen shrink-0 px-5 flex items-center justify-center"
              >
                {/* 
                  Uniform matching height across all cards.
                  Full text shown without any line-clamp.
                */}
                <div className="w-full max-w-sm h-[470px] sm:h-[480px] flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-[0_14px_36px_-6px_rgba(0,0,0,0.08)]">
                  {/* Card Image */}
                  <div className="relative h-[220px] sm:h-[200px] w-full shrink-0 overflow-hidden bg-secondary">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 90vw, 400px"
                    />
                  </div>

                  {/* Card Content with matched structure and NO line-clamp */}
                  <div className="flex-1 flex flex-col p-5 sm:p-6 min-h-0 overflow-hidden justify-between bg-card">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-accent">
                          {item.num}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          {item.tagline}
                        </span>
                      </div>

                      <h3 className="mt-2 text-lg font-semibold text-foreground tracking-tight">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3">
                      <Link
                        href={`/contact?service=${encodeURIComponent(item.title)}&additionalRequirement=${encodeURIComponent(`Enquiry for ${item.title} service`)}`}
                        className="group/btn inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-primary transition-colors"
                      >
                        Request Quotation
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Progress Dots / Pills */}
        <div className="flex justify-center items-center gap-2 shrink-0 mt-2">
          {items.map((item, i) => (
            <Dot
              key={item.num}
              index={i}
              total={items.length}
              progress={smoothProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Dot({
  index,
  total,
  progress,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const count = total > 1 ? total - 1 : 1;
  const center = index / count;
  const step = 1 / count;

  let inputRanges: number[];
  let opacityOutputs: number[];
  let widthOutputs: number[];

  if (index === 0) {
    inputRanges = [0, step * 0.5, step];
    opacityOutputs = [1, 0.3, 0.3];
    widthOutputs = [20, 6, 6];
  } else if (index === total - 1) {
    inputRanges = [1 - step, 1 - step * 0.5, 1];
    opacityOutputs = [0.3, 0.3, 1];
    widthOutputs = [6, 6, 20];
  } else {
    inputRanges = [
      Math.max(0, center - step * 0.6),
      center,
      Math.min(1, center + step * 0.6),
    ];
    opacityOutputs = [0.3, 1, 0.3];
    widthOutputs = [6, 20, 6];
  }

  const opacity = useTransform(progress, inputRanges, opacityOutputs);
  const width = useTransform(progress, inputRanges, widthOutputs);

  return (
    <motion.span
      style={{ opacity, width }}
      className="h-1.5 rounded-full bg-accent inline-block"
    />
  );
}
