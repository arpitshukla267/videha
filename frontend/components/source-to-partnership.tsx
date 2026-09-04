"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sprout,
  Filter,
  Flame,
  ShieldCheck,
  PackageCheck,
  Handshake,
  type LucideIcon,
} from "lucide-react";

type TimelineStep = {
  step: string;
  label: string;
  title: string;
  body: string;
};

const ICONS: Record<string, LucideIcon> = {
  Source: Sprout,
  Selection: Filter,
  Processing: Flame,
  Quality: ShieldCheck,
  Export: PackageCheck,
  Partnership: Handshake,
};

// How far down the viewport the "activation line" sits (0 = top, 1 = bottom)
const LINE_POSITION = 0.75;

function useScrollRail(count: number) {
  const railRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [fillHeight, setFillHeight] = useState(0);
  const [passed, setPassed] = useState<boolean[]>(() =>
    Array(count).fill(false),
  );

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      const rail = railRef.current;
      setFillHeight(rail ? rail.getBoundingClientRect().height : 0);
      setPassed(Array(count).fill(true));
      return;
    }

    let ticking = false;

    const update = () => {
      ticking = false;
      const rail = railRef.current;
      if (!rail) return;

      const railRect = rail.getBoundingClientRect();
      const lineY = window.innerHeight * LINE_POSITION;

      const clampedFill = Math.min(
        Math.max(lineY - railRect.top, 0),
        railRect.height,
      );
      setFillHeight(clampedFill);

      setPassed(
        iconRefs.current.map((el) => {
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return rect.top + rect.height / 2 <= lineY;
        }),
      );
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);

  return { railRef, iconRefs, fillHeight, passed };
}

export function SourceToPartnershipSection({
  steps,
}: {
  steps: TimelineStep[];
}) {
  const { railRef, iconRefs, fillHeight, passed } = useScrollRail(steps.length);
  const activeIndex = passed.lastIndexOf(true);

  return (
    <section className="border-b border-border bg-[#f8f6f0] py-12 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="mb-20 max-w-2xl mx-auto text-center">
          <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
            From Source to Partnership
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A seamless, audited supply line built specifically for international
            distribution.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Rail track — only the reached (accent) portion is rendered, nothing beyond it */}
          <div
            ref={railRef}
            className="absolute left-[21px] md:left-1/2 top-2 bottom-2 w-px -translate-x-0 md:-translate-x-1/2"
          >
            <div
              className="w-px bg-accent transition-[height] duration-150 ease-out"
              style={{ height: `${fillHeight}px` }}
            />
          </div>

          <div className="flex flex-col gap-28 md:gap-36 py-16">
            {steps.map((t, idx) => {
              const Icon = ICONS[t.label] ?? Sprout;
              const isPassed = passed[idx];
              const isActive = idx === activeIndex;
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={t.step}
                  className="relative grid grid-cols-[44px_1fr] md:grid-cols-[1fr_56px_1fr] items-center gap-x-6 md:gap-x-10"
                >
                  {/* Left content — desktop only, shown when step is "even" */}
                  <div
                    className={`hidden md:block ${isEven ? "text-right" : ""}`}
                  >
                    {isEven && (
                      <StepContent t={t} isPassed={isPassed} align="right" />
                    )}
                  </div>

                  {/* Icon node, centered on the rail — hidden until reached */}
                  <div
                    ref={(el) => {
                      iconRefs.current[idx] = el;
                    }}
                    className={`relative z-10 flex h-11 w-11 md:h-14 md:w-14 shrink-0 items-center justify-center justify-self-start md:justify-self-center rounded-full border bg-background transition-all duration-500 ${
                      isPassed
                        ? "opacity-100 scale-100 border-accent text-accent"
                        : "opacity-0 scale-75 border-border text-muted-foreground"
                    } ${isActive ? "ring-4 ring-accent/15" : ""}`}
                  >
                    <Icon
                      className="h-4 w-4 md:h-5 md:w-5"
                      strokeWidth={1.75}
                    />
                  </div>

                  {/* Right content — mobile always, desktop only when "odd" */}
                  <div className="md:hidden">
                    <StepContent t={t} isPassed={isPassed} align="left" />
                  </div>
                  <div className="hidden md:block">
                    {!isEven && (
                      <StepContent t={t} isPassed={isPassed} align="left" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepContent({
  t,
  isPassed,
  align,
}: {
  t: TimelineStep;
  isPassed: boolean;
  align: "left" | "right";
}) {
  const isRight = align === "right";

  return (
    <div
      className={`relative transition-all duration-500 ease-out ${
        isRight ? "flex flex-col items-end" : ""
      } ${isPassed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute select-none font-mono text-[56px] font-bold leading-none text-foreground/[0.06] md:text-[72px] ${
          isRight ? "right-0 -top-10" : "left-0  -top-14"
        }`}
      >
        {t.step}
      </span>

      <h3 className="relative mt-4 text-base font-bold text-foreground leading-tight md:text-lg">
        {t.title}
      </h3>
      <p
        className={`relative mt-2 text-[13px] text-muted-foreground leading-relaxed ${
          isRight ? "max-w-md" : "max-w-md"
        }`}
      >
        {t.body}
      </p>
    </div>
  );
}
