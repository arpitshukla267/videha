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
  title?: ReactNode;
  vhPerCard?: number;
  className?: string;
};

export function FeatureFilmstrip({
  items,
  title,
  vhPerCard = 75,
  className = "md:hidden",
}: FeatureFilmstripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /*
    Mobile pe stiffness thoda kam + damping thoda zyada kar diya —
    isse spring har frame pe utna hard "chase" nahi karta, jo
    low-end phones pe jaake smoother feel deta hai.
    mass bhi thoda kam kiya taaki response lag na lage.
  */
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 32,
    mass: 0.4,
    restDelta: 0.001,
  });

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
        FIX: dvh -> svh
        dvh mobile browser ke address bar show/hide hone par recalc hota
        hai scroll ke dauraan hi, jo layout thrashing/jank create karta
        hai. svh stable rehta hai (chhota, fixed viewport), isse scroll
        ke time koi reflow trigger nahi hota — yahi sabse bada fix hai.
      */}
      <div
        className="sticky top-0 h-[100svh] flex flex-col justify-between px-5 pt-20 pb-6 bg-background"
        style={{ contain: "layout paint" }}
      >
        {title && <div className="shrink-0 mb-1">{title}</div>}

        <div className="flex-1 min-h-0 flex items-center overflow-hidden -mx-5">
          <motion.div
            style={{
              x: trackX,
              translateZ: 0,
              backfaceVisibility: "hidden",
            }}
            className="flex will-change-transform"
          >
            {items.map((item, i) => (
              <div
                key={item.num}
                className="w-screen shrink-0 px-5 flex items-center justify-center"
              >
                <div className="w-full max-w-sm h-[470px] sm:h-[480px] flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-[0_14px_36px_-6px_rgba(0,0,0,0.08)]">
                  <div className="relative h-[220px] sm:h-[200px] w-full shrink-0 overflow-hidden bg-secondary">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 90vw, 400px"
                      // FIX: pehle 1-2 image eager/priority, baaki lazy —
                      // isse initial scroll ke time network/decode load kam hota hai
                      loading={i < 2 ? "eager" : "lazy"}
                      priority={i === 0}
                    />
                  </div>

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
