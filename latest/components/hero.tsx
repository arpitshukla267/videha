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

/* ------------------------------------------------------------------ */
/*  Storyline data                                                     */
/* ------------------------------------------------------------------ */
/*
  NOTE ON ASSETS
  ----------------------------------------------------------------------
  The original Hero only shipped three images (hero.webp, process-export.png,
  brand-statement.png). The four-part storyline needs a dedicated
  Shipment / Global Logistics visual that doesn't exist yet in the repo.
  I've reused the two images that map cleanly (source + destination/brand)
  and pointed "shipment" at a new path — /images/global-shipment.png —
  which needs to be added to /public/images. Everything else (copy,
  layout, motion) is fully wired and will work the moment that file exists;
  until then Next/Image will just 404 on that one story.
  ----------------------------------------------------------------------
*/
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
    id: "farming",
    number: "01",
    label: "Source",
    heading: ["Hand-Harvested,", "at the Water's Edge."],
    description:
      "Every seed is gathered by hand from the lotus wetlands of Bihar, where generations of farmers have perfected the harvest.",
    image: "/hero.webp",
    mobileImage: "/hero-mobile.webp",
    alt: "Lotus wetlands at dawn in Bihar, India",
  },
  {
    id: "processing",
    number: "02",
    label: "Process",
    heading: ["Cleaned, Graded", "and Perfected."],
    description:
      "Each batch is cleaned, roasted and graded under strict quality control before it earns the Videha name.",
    image: "/services.jpg",
    alt: "Makhana processing and quality grading facility",
  },
  {
    id: "shipment",
    number: "03",
    label: "Ship",
    heading: ["Packed and Exported", "Across the Globe."],
    description:
      "Sealed, packed and containerised for export — moving from Bihar to ports and pantries around the world.",
    image: "/images/process-export.webp",
    alt: "Export containers and global shipping logistics",
  },
  {
    id: "destination",
    number: "04",
    label: "Arrive",
    heading: ["Premium Makhana,", "from India to the World."],
    description:
      "From wetlands to your table — Videha Makhana reaches discerning kitchens and markets across the globe.",
    image: "/images/process-pack.webp",
    alt: "Videha Makhana, the final product ready for the global table",
  },
];

const SEGMENTS = STORIES.length - 1; // 3 transitions across 4 stories

/* ------------------------------------------------------------------ */
/*  Thumbnail slot geometry (in % of the hero frame)                   */
/* ------------------------------------------------------------------ */
/*
  Three horizontal positions, evenly spaced by (THUMB_W + GAP), anchored
  to the bottom-right of the frame — exactly as before:

    NEAR_LEFT  -> the rail slot closest to the main frame (slot 1)
    FAR_LEFT   -> the rail slot furthest out (slot 2)
    ENTER_LEFT -> fully off-screen, one more step to the right of FAR_LEFT.
                  This is only ever used as a starting position for the
                  entering thumbnail — it's never a resting slot.
*/
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

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    console.log("scrollYProgress:", v.toFixed(3));
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
  // Incoming content is no longer an independent fade — it rides the same
  // `t` value as the growing image, so it fades in exactly as fast as the
  // image expands (see `contentOpacity` below and the growLeft/growTop/
  // growWidth/growHeight-driven wrapper in the JSX).
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

  // the story currently filling the whole frame
  const mainStory = STORIES[segment % STORIES.length];
  // the "next" thumbnail — grows out of the NEAR slot into the full frame
  const growingStory = STORIES[(segment + 1) % STORIES.length];
  // sits in the FAR slot, slides FAR -> NEAR as growingStory leaves NEAR
  const movingStory = STORIES[(segment + 2) % STORIES.length];
  // travels in from fully off-screen (ENTER) into the vacated FAR slot
  const enteringStory = STORIES[(segment + 3) % STORIES.length];

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

  const story = STORIES[activeIndex];

  return (
    <div
      ref={wrapperRef}
      className="relative hidden md:block"
      style={{ height: `${(SEGMENTS + 1) * 100}vh` }}
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

        {/* Entering thumbnail — travels from completely off-screen (right)
            into the FAR slot, physically, tied to scroll progress */}
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

        {/* Moving thumbnail — slides from the FAR slot into the NEAR slot,
            in lockstep with the growing thumbnail vacating NEAR */}
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

        {/* Incoming content — anchored to the growing image's TOP-LEFT corner.
            It reuses the exact same left/top/width/height transforms as the
            growing thumbnail above, so the text and the image read as one
            composition expanding together: small + faint at the thumbnail,
            settling into the normal content position as the image fills the
            frame. This is intentionally a sibling of the growing image (not
            nested inside it) so its z-index can sit above the legibility
            overlay while still tracking the image's geometry 1:1. */}
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

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
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

function ContentBlock({ story }: { story: Story }) {
  return (
    <>
      <span className="mb-4 block text-[11px] font-medium uppercase tracking-[0.3em] text-white/70">
        {story.number} — {story.label}
      </span>
      <h1 className="max-w-2xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.02em] text-white text-balance sm:text-6xl md:text-[4rem]">
        <RevealText text={story.heading[0]} delay={0.1} immediate />
        <RevealText text={story.heading[1]} delay={0.22} immediate />
      </h1>
      <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/85">
        {story.description}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile: original Hero, unchanged behaviour                         */
/* ------------------------------------------------------------------ */
const MOBILE_BANNERS = [
  { image: "/hero-mobile.webp", alt: "Lotus wetlands at dawn in Bihar, India" },
  {
    image: "/images/process-export.png",
    alt: "Makhana export shipment ready for global markets",
  },
  { image: "/brand-statement.png", alt: "Indian lotus wetlands at dawn" },
];

const SLIDE_DURATION = 5000;

function MobileHero() {
  const [active, setActive] = useState(0);

  // identical autoplay timing/behaviour to the original Hero implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setActive((i) => (i + 1) % MOBILE_BANNERS.length);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [active]);

  const banner = MOBILE_BANNERS[active];

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

        <div className="relative z-10 flex w-full items-center pt-24 pb-16">
          <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
            <h1 className="max-w-2xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.02em] text-white text-balance sm:text-6xl md:text-[4rem]">
              <RevealText text="Premium Makhana," delay={0.15} immediate />
              <RevealText
                text="from India to the world."
                delay={0.3}
                immediate
              />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-white/85"
            >
              Sourced from the wetlands of Bihar, exported to discerning markets
              across the globe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
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
                    transition={{
                      duration: SLIDE_DURATION / 1000,
                      ease: "linear",
                    }}
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
