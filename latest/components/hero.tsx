"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { RevealText } from "@/components/reveal";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Storyline data                                                     */
/* ------------------------------------------------------------------ */
type Story = {
  id: string;
  number: string;
  label: string;
  heading: [string, string];
  description: string;
  image: string;
  mobileImage?: string;
  alt: string;
};

const STORIES: Story[] = [
  {
    id: "makhana",
    number: "01",
    label: "Premium Makhana",
    heading: ["Premium Makhana,", "Sourced from India."],
    description:
      "Premium Indian makhana carefully sourced and selected for quality, consistency and international markets.",
    image: "/images/makhana-hero.webp",
    mobileImage: "/images/makhana-hero.webp",
    alt: "Premium Indian makhana sourced from Bihar",
  },
  {
    id: "guar-gum",
    number: "02",
    label: "Food Grade Guar Gum",
    heading: ["Food Grade Guar Gum,", "Built for Global Supply."],
    description:
      "High-quality food grade guar gum for international buyers seeking reliable sourcing, consistent quality and dependable supply.",
    image: "/images/gaur-gum.webp",
    mobileImage: "/images/gaur-gum-mobile.webp",
    alt: "Food grade guar gum for international supply",
  },
  {
    id: "bulk-supply",
    number: "03",
    label: "Bulk Supply",
    heading: ["Reliable Bulk Supply,", "Built for Growing Markets."],
    description:
      "Consistent product sourcing and dependable bulk supply for importers, distributors and businesses with large-volume requirements.",
    image: "/images/bulk-supply.webp",
    alt: "Bulk supply of Indian agricultural products",
  },
  {
    id: "private-label",
    number: "04",
    label: "Private Label",
    heading: ["Private Label Solutions,", "Tailored to Your Brand."],
    description:
      "Flexible private label solutions designed to help businesses bring quality Indian food ingredients and agricultural products to their markets.",
    image: "/images/process-pack.webp",
    alt: "Private label food products prepared for export",
  },
  {
    id: "global-export",
    number: "05",
    label: "Global Export",
    heading: ["From India,", "To Global Markets."],
    description:
      "Connecting trusted Indian agricultural sourcing with international markets through quality, reliable supply and professional export support.",
    image: "/images/global-export.webp",
    alt: "Indian agricultural products prepared for global export",
  },
];

const SEGMENTS = STORIES.length - 1; // 3 transitions across 4 stories

/* ------------------------------------------------------------------ */
/*  Thumbnail slot geometry (in % of the hero frame)                   */
/* ------------------------------------------------------------------ */
const PAD_RIGHT = 0;
const PAD_BOTTOM = 7;
const THUMB_W = 19;
const THUMB_H = 25;
const GAP = 1.6;
const STEP = THUMB_W + GAP;

const FAR_LEFT = 115 - PAD_RIGHT - THUMB_W;
const NEAR_LEFT = FAR_LEFT - STEP;
const ENTER_LEFT = FAR_LEFT + STEP;
const SLOT_TOP = 100 - PAD_BOTTOM - THUMB_H;

/* ------------------------------------------------------------------ */
/*  Desktop: cinematic scroll-driven storyline                         */
/* ------------------------------------------------------------------ */
function DesktopHero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [segment, setSegment] = useState(0); // 0..SEGMENTS-1, which transition we're in
  const [activeIndex, setActiveIndex] = useState(0); // 0..STORIES.length-1, for text content

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  // 0 -> SEGMENTS across the whole pin range
  const rawProgress = useTransform(scrollYProgress, (v) => v * SEGMENTS);

  useMotionValueEvent(rawProgress, "change", (v) => {
    const idx = Math.min(SEGMENTS - 1, Math.max(0, Math.floor(v)));
    setSegment((prev) => (prev === idx ? prev : idx));
  });

  // progress within the current segment (0 -> 1), clamped at the edges
  const t = useTransform(
    scrollYProgress,
    [segment / SEGMENTS, (segment + 1) / SEGMENTS],
    [0, 1],
    { clamp: true },
  );

  // content crossfade — synced directly to scroll, no timers
  const outOpacity = useTransform(t, [0, 0.4], [1, 0]);
  const outY = useTransform(t, [0, 0.4], [0, -14]);
  const contentOpacity = useTransform(t, [0.5, 1], [0, 0.9]);

  useMotionValueEvent(t, "change", (v) => {
    const target =
      v >= 0.5 ? (segment + 1) % STORIES.length : segment % STORIES.length;
    setActiveIndex((prev) => (prev === target ? prev : target));
  });

  const pct = (from: number, to: number) =>
    useTransform(t, (v) => `${from + (to - from) * v}%`);
  const px = (from: number, to: number) =>
    useTransform(t, (v) => `${from + (to - from) * v}px`);

  /*
    IMPORTANT: indices below are NOT wrapped with `% STORIES.length` anymore.
    A story that has already played as the `mainStory` at an earlier segment
    must never come back into the rail (entering/moving slots). Since
    `segment` only ever increases (0..SEGMENTS-1) and each story is "used up"
    the moment it becomes `mainStory`, plain (unwrapped) indices guarantee
    every story appears exactly once — either as the current main frame or
    waiting in the rail — and never twice. Once an index runs past the end
    of STORIES, that rail slot is simply hidden instead of looping back to a
    story that's already been shown.
  */
  const mainIndex = segment;
  const growingIndex = segment + 1;
  const movingIndex = segment + 2;
  const enteringIndex = segment + 3;

  const showMoving = movingIndex < STORIES.length;
  const showEntering = enteringIndex < STORIES.length;

  const mainStory = STORIES[mainIndex];
  const growingStory = STORIES[growingIndex];
  const movingStory = showMoving ? STORIES[movingIndex] : undefined;
  const enteringStory = showEntering ? STORIES[enteringIndex] : undefined;

  const outgoingStory = mainStory;
  const incomingStory = growingStory;

  // growing thumbnail: NEAR slot -> full frame
  const growLeft = pct(NEAR_LEFT, 0);
  const growTop = pct(SLOT_TOP, 0);
  const growWidth = pct(THUMB_W, 100);
  const growHeight = pct(THUMB_H, 100);
  const growRadius = px(20, 0);

  // moving thumbnail: FAR slot -> NEAR slot (takes over the vacated spot)
  const moveLeft = pct(FAR_LEFT, NEAR_LEFT);

  // entering thumbnail: fully off-screen -> FAR slot (conveyor refill)
  const enterLeft = pct(ENTER_LEFT, FAR_LEFT);

  return (
    <div
      ref={wrapperRef}
      className="relative hidden md:block"
      style={{ height: `${(SEGMENTS + 1) * 100}vh` }}
      id="hero"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        {/* Main / active background image */}
        <div className="absolute inset-0 z-10">
          <Image
            src={mainStory.image}
            alt={mainStory.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Entering thumbnail — only rendered while there's still an unseen
            story left to bring in from off-screen. Once every story has
            been used, this slot disappears instead of recycling one. */}
        {showEntering && enteringStory && (
          <motion.div
            className="absolute z-[100] overflow-hidden rounded-2xl border border-white/25 shadow-2xl"
            style={{
              left: enterLeft,
              top: `${SLOT_TOP}%`,
              width: `${THUMB_W}%`,
              height: `${THUMB_H}%`,
            }}
          >
            <Image
              src={enteringStory.image}
              alt={enteringStory.alt}
              fill
              sizes="20vw"
              className="object-cover object-center"
            />
            <ThumbLabel story={enteringStory} />
          </motion.div>
        )}

        {/* Moving thumbnail — only rendered while there's still an unseen
            story queued behind the growing one. */}
        {showMoving && movingStory && (
          <motion.div
            className="absolute z-[100] overflow-hidden rounded-2xl border border-white/25 shadow-2xl"
            style={{
              left: moveLeft,
              top: `${SLOT_TOP}%`,
              width: `${THUMB_W}%`,
              height: `${THUMB_H}%`,
            }}
          >
            <Image
              src={movingStory.image}
              alt={movingStory.alt}
              fill
              sizes="20vw"
              className="object-cover object-center"
            />
            <ThumbLabel story={movingStory} />
          </motion.div>
        )}

        {/* Growing thumbnail — expands from the NEAR slot into the full frame */}
        <motion.div
          className="absolute z-30 overflow-hidden border border-white/25 shadow-2xl"
          style={{
            left: growLeft,
            top: growTop,
            width: growWidth,
            height: growHeight,
            borderRadius: growRadius,
          }}
        >
          <Image
            src={growingStory.image}
            alt={growingStory.alt}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>

        {/* Legibility overlay */}
        <div className="pointer-events-none absolute inset-0 z-40 bg-black/35 bg-gradient-to-r from-black/45 via-black/25 to-black/5" />

        {/* Incoming content — anchored to the growing image's TOP-LEFT corner,
            reusing the exact same left/top/width/height transforms as the
            growing thumbnail. The button lives inside ContentBlock now, so
            it grows/moves in lockstep with the image and fades in with the
            rest of the incoming text. */}
        <motion.div
          className="absolute z-50 flex items-center overflow-visible pt-24 pb-16"
          style={{
            left: growLeft,
            top: growTop,
            width: growWidth,
            height: growHeight,
            opacity: contentOpacity,
          }}
        >
          <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
            <ContentBlock story={incomingStory} />
          </div>
        </motion.div>

        {/* Content */}
        <div className="relative z-50 flex h-full w-full items-center pt-24 pb-16">
          <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
            <motion.div style={{ opacity: outOpacity, y: outY }}>
              <ContentBlock story={outgoingStory} />
            </motion.div>
          </div>
        </div>

        {/* Storyline indicator, integrated into the image */}
        <div className="absolute bottom-8 left-5 z-50 flex items-center gap-2 md:left-10">
          {STORIES.map((s, i) => (
            <span
              key={s.id}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                i === activeIndex ? "w-7 bg-white" : "w-3 bg-white/35"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThumbLabel({ story }: { story: Story }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/90">
        {story.number} {story.label}
      </span>
    </div>
  );
}

/*
  ContentBlock now owns the "Explore Products" button too. Both the
  outgoing and incoming content wrappers in DesktopHero already animate
  opacity/position for whatever they contain (outOpacity/outY for the
  outgoing block, contentOpacity + growLeft/growTop/growWidth/growHeight
  for the incoming block) — so by rendering the button *inside* this
  component, it automatically inherits the same fade-out-with-outgoing /
  grow-and-fade-in-with-incoming behaviour as the heading and description,
  instead of sitting static and disconnected from the transition.
*/
function ContentBlock({ story }: { story: Story }) {
  return (
    <>
      {/* <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.3em] text-white/70">
        {story.number} — {story.label}
      </span> */}
      <h1 className="max-w-2xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.02em] text-white text-balance sm:text-6xl md:text-[4rem]">
        <RevealText text={story.heading[0]} delay={0.1} immediate />
        <RevealText text={story.heading[1]} delay={0.22} immediate />
      </h1>
      <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/85">
        {story.description}
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <a
          href={`/contact?${
            story.id === "makhana"
              ? "product=Premium%20Makhana"
              : story.id === "guar-gum"
                ? "product=Food%20Grade%20Guar%20Gum"
                : story.id === "bulk-supply"
                  ? "service=Bulk%20Export%20Supply"
                  : story.id === "private-label"
                    ? "service=Private%20Label"
                    : "service=Export%20%26%20Logistics"
          }`}
          className="group inline-flex items-center gap-3 border border-white/40 px-7 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#0A0E0A]"
        >
          Request Quotation
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>

        {story.id === "makhana" && (
          <a
            href="/products"
            className="group inline-flex items-center gap-3 border border-white/30 px-7 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white/80 transition-colors hover:border-white hover:bg-white/10 hover:text-white"
          >
            Explore Products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        )}

        {story.id === "guar-gum" && (
          <a
            href="/guar-gum"
            className="group inline-flex items-center gap-3 border border-white/30 px-7 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white/80 transition-colors hover:border-white hover:bg-white/10 hover:text-white"
          >
            Explore Products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile: same STORIES content as desktop, just no scroll-driven      */
/*  cinematic transitions — a plain autoplaying image + text slide.     */
/*  Each banner pulls its image/heading/description straight from       */
/*  STORIES (by index) so mobile always shows the same story content    */
/*  as desktop; only the background image crossfades (kept from the     */
/*  original), the text itself just swaps instantly with no added       */
/*  animation.                                                           */
/* ------------------------------------------------------------------ */
const MOBILE_BANNERS = STORIES.map((story) => ({
  image: story.mobileImage ?? story.image,
  alt: story.alt,
  story,
}));

const SLIDE_DURATION = 5000;

function MobileHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive((i) => (i + 1) % MOBILE_BANNERS.length);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [active]);

  const banner = MOBILE_BANNERS[active];
  const story = banner.story;

  return (
    <section className="relative block w-full overflow-hidden bg-background md:hidden">
      <div className="relative flex min-h-[100vh] w-full items-center overflow-hidden">
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
                className="object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/35 bg-gradient-to-r from-black/45 via-black/25 to-black/5" />
        </div>

        {/* NEW: text + CTA block, synced to the active banner via AnimatePresence */}
        <div className="relative z-10 w-full px-5 pb-24 pt-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="max-w-xl text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.02em] text-white text-balance sm:text-5xl">
                <span className="block">{story.heading[0]}</span>
                <span className="block">{story.heading[1]}</span>
              </h1>
              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/85">
                {story.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`/contact?${
                    story.id === "makhana"
                      ? "product=Premium%20Makhana"
                      : story.id === "guar-gum"
                        ? "product=Food%20Grade%20Guar%20Gum"
                        : story.id === "bulk-supply"
                          ? "service=Bulk%20Export%20Supply"
                          : story.id === "private-label"
                            ? "service=Private%20Label"
                            : "service=Export%20%26%20Logistics"
                  }`}
                  className="group inline-flex items-center gap-3 border border-white/40 px-7 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#0A0E0A]"
                >
                  Request Quotation
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>

                {(story.id === "makhana" || story.id === "guar-gum") && (
                  <Link
                    href={story.id === "makhana" ? "/products" : "/guar-gum"}
                    className="group inline-flex items-center gap-3 border border-white/30 px-7 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-white/80 transition-colors hover:border-white hover:bg-white/10 hover:text-white"
                  >
                    Explore Products
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0 md:bottom-10">
          {MOBILE_BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(() => i)}
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
  );
}

/* ------------------------------------------------------------------ */
/*  Public component                                                   */
/* ------------------------------------------------------------------ */
export function Hero() {
  return (
    <section id="top" className="relative w-full bg-background">
      <DesktopHero />
      <MobileHero />
    </section>
  );
}
