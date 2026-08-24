"use client";

import { useRef } from "react";
import Image from "next/image";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PRODUCTS } from "@/lib/content";

const getSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export function Products() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollProducts = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "right" ? 320 : -320,
      behavior: "smooth",
    });
  };

  // touch-action must land on a real DOM element in the ancestor chain
  // from the touch's origin up to the scrollable container. Any element
  // in that chain that doesn't carry this and defaults to `auto` can
  // break the vertical-pan restriction.
  const panXStyle: React.CSSProperties = {
    touchAction: "pan-x",
    overscrollBehaviorX: "contain",
  };

  return (
    <section id="products" className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-[1680px] px-3 py-12 sm:px-8 md:px-10 md:py-8 lg:py-12 xl:px-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between md:mb-12">
          <div>
            <Reveal>
              <SectionLabel>Our Products</SectionLabel>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="mt-5 max-w-3xl text-xl font-medium leading-[1.02] tracking-[-0.04em] text-foreground sm:text-2xl lg:text-3xl">
                Our Best Makhana, Curated for the World
              </h2>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Premium makhana and fox nuts for global markets — from bulk
                supply to private label formats.
              </p>
            </Reveal>
          </div>

          {/* View All */}
          <Reveal delay={0.1}>
            <Link
              href="/products"
              className="group inline-flex w-fit shrink-0 items-center justify-center gap-2 self-start whitespace-nowrap border border-foreground/40 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:bg-foreground hover:text-background sm:self-auto sm:px-5 sm:text-[11px] sm:tracking-[0.14em]"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        {/* Product Rail */}
        <div className="relative">
          {/* Edge fade hints on mobile */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-secondary/30 to-transparent md:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-secondary/30 to-transparent md:hidden" />

          <div
            ref={scrollRef}
            style={panXStyle}
            className="flex gap-3 overflow-x-auto overflow-y-clip pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-5"
          >
            {PRODUCTS.map((product, index) => (
              // FIX: plain <div> now owns snap-start, shrink-0, AND
              // touch-action — this is a real DOM node guaranteed to sit
              // directly between the scroll container and whatever
              // Reveal renders internally, so the touch-action chain
              // can't be broken by Reveal silently dropping the style
              // prop. Reveal itself is now used ONLY for the fade/slide
              // animation, nothing structural depends on it anymore.
              <div
                key={product.name}
                style={panXStyle}
                className="h-full shrink-0 snap-start"
              >
                <Reveal delay={index * 0.04} className="h-full">
                  <article
                    style={panXStyle}
                    className="group flex h-full w-[68vw] md:w-[78vw] md:max-w-[330px] flex-col overflow-hidden rounded-[5px] border border-border bg-background transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)] sm:w-[46vw] md:w-[310px] lg:w-[320px]"
                  >
                    {/* Image */}
                    <div className="relative aspect-[1.18/1] w-full overflow-hidden bg-secondary">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 68vw, 320px"
                        className="object-contain transition-transform duration-700 ease-out md:group-hover:scale-[1.045]"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4 md:p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                          {product.index}
                        </span>
                      </div>

                      <h3 className="text-lg font-medium leading-[1.15] tracking-[-0.03em] text-foreground md:text-xl">
                        {product.name}
                      </h3>

                      <p className="mt-2.5 line-clamp-2 text-[14px] leading-[1.55] text-muted-foreground">
                        {product.copy}
                      </p>

                      {/* Details */}
                      <div className="mt-auto pt-5">
                        <Link
                          href={`/products/${getSlug(product.name)}`}
                          className="group/btn flex h-10 w-full items-center justify-center gap-2 border border-foreground/60 text-[11px] font-medium uppercase tracking-wide text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
                        >
                          Details
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              </div>
            ))}
          </div>

          {/* Scroll Controls */}
          <button
            type="button"
            onClick={() => scrollProducts("left")}
            aria-label="Previous products"
            className="absolute left-1 top-[38%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-all duration-300 hover:cursor-pointer hover:bg-foreground hover:text-background md:left-3 md:h-11 md:w-11"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollProducts("right")}
            aria-label="Next products"
            className="absolute right-1 top-[38%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-all duration-300 hover:cursor-pointer hover:bg-foreground hover:text-background md:right-3 md:h-11 md:w-11"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
