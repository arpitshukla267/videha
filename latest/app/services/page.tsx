"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Layers,
  FileText,
  ChevronRight,
  Check,
} from "lucide-react";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { FeatureFilmstrip } from "@/components/ui/feature-filmstrip";

const SERVICES_DATA = [
  {
    num: "01",
    title: "BULK EXPORT SUPPLY",
    tagline: "Reliable Supply for International Buyers",
    copy: "We support international buyers with bulk supply of premium agricultural and food products, with product specifications, quantities, packaging, and supply requirements aligned to individual buyer needs.",
    image: "/images/process-process.webp",
    specs: [
      "Bulk supply options",
      "Buyer-specific product requirements",
      "Flexible packaging solutions",
    ],
  },
  {
    num: "02",
    title: "PRIVATE LABEL",
    tagline: "Your Brand. Our Product. Export Support.",
    copy: "We support private label requirements, especially for Makhana, with product selection, grade or flavour selection, packaging, branding, and export-ready supply based on buyer requirements.",
    image: "/images/product-flavoured.webp",
    specs: [
      "Private label support",
      "Retail and custom packaging",
      "Product and branding requirements",
    ],
  },
  {
    num: "03",
    title: "PRODUCT SOURCING",
    tagline: "Quality-Focused Indian Sourcing",
    copy: "We focus on reliable Indian sourcing and quality-focused procurement across our agricultural and food product range, with attention to product specifications and buyer requirements.",
    image: "/images/process-source.webp",
    specs: [
      "Reliable Indian sourcing",
      "Quality-focused procurement",
      "Buyer-specific requirements",
    ],
  },
  {
    num: "04",
    title: "QUALITY & SPECIFICATIONS",
    tagline: "Focused on Consistent Product Requirements",
    copy: "Product quality parameters, grades, specifications, and buyer requirements are considered throughout the sourcing and supply process. Final technical specifications are provided as applicable to each product.",
    image: "/images/quality-macro.webp",
    specs: [
      "Product grade and size specifications",
      "Quality parameters",
      "Buyer-specific requirements",
    ],
  },
  {
    num: "05",
    title: "EXPORT DOCUMENTATION",
    tagline: "Documentation Based on Destination Requirements",
    copy: "Documentation can be arranged as applicable to the product, destination country, and buyer requirement, supporting a smoother international trade process.",
    image: "/images/process-export.webp",
    specs: [
      "Commercial Invoice",
      "Packing List",
      "Certificate of Origin and COA",
    ],
  },
  {
    num: "06",
    title: "LOGISTICS SUPPORT",
    tagline: "Supporting the Export Process",
    copy: "We coordinate the export process and logistics requirements according to the product, destination, and agreed buyer requirements.",
    image: "/images/process-pack.webp",
    specs: [
      "Export dispatch coordination",
      "Destination-based requirements",
      "Flexible Incoterm options",
    ],
  },
];

const FLOW_STEPS = [
  {
    name: "Requirement",
    desc: "Understanding product, quantity and buyer requirements",
  },
  {
    name: "Sourcing",
    desc: "Product sourcing based on required specifications",
  },
  { name: "Quality", desc: "Quality parameters and buyer requirements" },
  { name: "Packing", desc: "Bulk, retail or customized packaging" },
  { name: "Documentation", desc: "Export documents as applicable" },
  { name: "Dispatch", desc: "Logistics and export coordination" },
];

export default function ServicesPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stickyContainerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stickyContainerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const idx = Math.min(
      SERVICES_DATA.length - 1,
      Math.floor(latest * SERVICES_DATA.length),
    );
    setActiveIndex(idx);
  });

  const scrollToItem = (idx: number) => {
    const container = stickyContainerRef.current;
    if (!container) return;
    const totalHeight = container.offsetHeight;
    const segment = totalHeight / SERVICES_DATA.length;
    const targetY = container.offsetTop + segment * idx + segment / 2;

    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <main className="overflow-x-clip bg-background">
      {/* HERO SECTION */}
      <header className="relative pt-36 md:pt-48 pb-20 md:pb-28 overflow-hidden min-h-[100vh] flex items-center justify-center">
        <Image
          src="/services.jpg"
          alt="Makhana processing facility"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        {/* Overlay — full-bleed, solid tint, no blur on the image itself */}
        <div className="absolute inset-0 bg-[#000000]/50" />

        <div className="relative z-10 px-5 md:px-10 text-center max-w-[90vw] md:max-w-4xl mx-auto">
          <Reveal>
            <div className="flex justify-center">
              <span className="text-md font-mono uppercase tracking-[0.24em] text-white font-semibold">
                OUR SERVICES
              </span>
            </div>
          </Reveal>
          <h1 className="mt-6 text-3xl lg:text-[clamp(2.0rem,6.5vw,5rem)] font-medium lg:leading-[0.95] lg:tracking-[-0.0em] text-white lg:text-balance">
            Built for Buyers Who Think Beyond the Shipment.
          </h1>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-sm md:max-w-2xl mx-auto text-md lg:text-lg leading-relaxed text-white">
              Videha Overseas is a dedicated supply chain partner. We coordinate
              procurement, processing, grading, packaging, and logistics to make
              importing premium Indian makhana reliable and risk-free.
            </p>
          </Reveal>
        </div>
      </header>

      {/* MOBILE INTERACTIVE SERVICE INDEX (FILMSTRIP) */}
      <div className="lg:hidden border-b border-border">
        <FeatureFilmstrip
          className="block"
          title={
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent block mb-1">
                CORE SUPPLY CAPABILITIES
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Interactive Service Index
              </h2>
            </div>
          }
          items={SERVICES_DATA.map((s) => ({
            num: s.num,
            title: s.title,
            tagline: s.tagline,
            description: s.copy,
            image: s.image,
          }))}
        />
      </div>

      {/* DESKTOP INTERACTIVE SERVICE INDEX */}
      <section
        ref={stickyContainerRef}
        className="hidden lg:block relative border-b border-border bg-background"
        style={{ height: `${SERVICES_DATA.length * 80}vh` }}
      >
        <div className="sticky top-10 h-screen flex items-center">
          <div className="mx-auto max-w-[1400px] px-10 w-full">
            <div className="grid grid-cols-12 gap-16 items-stretch max-h-[90vh]">
              {/* Left: Vertical Index List — desktop/laptop only */}
              <div className="col-span-6 h-full flex flex-col gap-1 overflow-y-auto pr-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent block mb-4">
                  CORE SUPPLY CAPABILITIES
                </span>
                {SERVICES_DATA.map((service, idx) => (
                  <button
                    key={service.num}
                    onClick={() => scrollToItem(idx)}
                    className={`text-left border-b border-border/60 py-6 pr-4 flex items-start gap-4 transition-all duration-300 shrink-0 ${
                      activeIndex === idx
                        ? "border-primary pl-4 bg-[#f8f6f0]/60"
                        : "opacity-50 hover:opacity-90 hover:pl-2"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-accent mt-1">
                      {service.num}
                    </span>
                    <div className="flex-1">
                      <h3
                        className={`text-lg md:text-xl font-medium tracking-tight transition-colors ${
                          activeIndex === idx
                            ? "text-primary font-semibold"
                            : "text-foreground"
                        }`}
                      >
                        {service.title}
                      </h3>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-1 block">
                        {service.tagline}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 mt-1 transition-transform ${
                        activeIndex === idx
                          ? "text-primary translate-x-1"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Right: Preview Pane */}
              <div className="col-span-6 h-full overflow-y-auto border border-border bg-background p-7 shadow-xs">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="flex flex-col gap-4"
                  >
                    <h3 className="text-xl font-semibold tracking-tight text-primary">
                      {SERVICES_DATA[activeIndex].title}
                    </h3>

                    <div className="relative max-h-[35vh] aspect-[16/10] w-full overflow-hidden border border-border bg-secondary">
                      <Image
                        src={SERVICES_DATA[activeIndex].image}
                        alt={SERVICES_DATA[activeIndex].title}
                        fill
                        className="object-cover"
                        sizes="40vw"
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-mono uppercase text-accent tracking-widest">
                        {SERVICES_DATA[activeIndex].tagline}
                      </h4>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {SERVICES_DATA[activeIndex].copy}
                      </p>
                    </div>

                    <div className="border-t border-border pt-4">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block mb-3">
                        KEY DELIVERABLES & PARAMETERS:
                      </span>
                      <ul className="space-y-1.5">
                        {SERVICES_DATA[activeIndex].specs.map((spec, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-foreground font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href={`/contact?service=${encodeURIComponent(SERVICES_DATA[activeIndex].title)}&additionalRequirement=${encodeURIComponent(`Enquiry for ${SERVICES_DATA[activeIndex].title} service`)}`}
                      className="group inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-primary hover:gap-3 transition-all w-fit border-2 border-foreground/25 px-5 py-2.5"
                    >
                      Request Quotation
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM FLOWCHART: HOW WE SUPPORT BUYERS */}
      <section className="py-24 md:py-32 bg-[#f8f6f0] border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              B2B OPERATIONS FLOW
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              How We Support Buyers
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A structured operational timeline designed to eliminate friction
              in procurement.
            </p>
          </div>

          {/* SVG Custom Connecting Nodes */}
          <div className="relative">
            {/* Desktop Connective Line */}
            <div className="hidden lg:block absolute left-10 right-10 top-1/2 -translate-y-1/2 h-0.5 bg-border z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
              {FLOW_STEPS.map((step, idx) => (
                <div
                  key={step.name}
                  className="bg-background border border-border p-6 flex flex-col justify-between h-full group hover:border-primary transition-all duration-300"
                >
                  <div>
                    <div className="w-10 h-10 rounded-full bg-[#f8f6f0] border border-border flex items-center justify-center font-mono text-xs font-bold text-primary mb-4 group-hover:bg-primary group-hover:text-background transition-colors">
                      0{idx + 1}
                    </div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">
                      {step.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* <div className="mt-4 pt-3 border-t border-border/40 text-[9px] font-mono text-accent uppercase tracking-widest">
                    Phase 0{idx + 1}
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* B2B SERVICE GUARANTEES */}
      {/* <section className="py-24 md:py-32 bg-background border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-8 border border-border bg-background">
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-bold text-foreground">
                Moisture Content Guarantee
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                If the moisture content in popped shipments exceeds the
                contracted 4.5% limit upon container departure, we offer
                replacement lots immediately.
              </p>
            </div>

            <div className="p-8 border border-border bg-background">
              <Layers className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-bold text-foreground">
                Custom Packaging Adaptability
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We format retail prints, box sizing, nitrogen levels, and outer
                export carton densities to match exact regulations of the target
                port.
              </p>
            </div>

            <div className="p-8 border border-border bg-background">
              <FileText className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-bold text-foreground">
                In-House Export Bureau
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We handle land freight, customs inspections, and global sea
                lines to deliver complete door-to-port or door-to-door transit
                logistics.
              </p>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA SECTION */}
      <section className="py-20 md:py-28 bg-foreground text-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                  FOREIGN BUYER DESK
                </span>
                <h2 className="text-3xl md:text-4xl font-semibold text-background mt-2 text-balance">
                  Ready to Source Export-Grade Makhana?
                </h2>
                <p className="text-sm text-background/70 mt-2 max-w-xl">
                  Contact our export team for sample requests, specifications
                  sheets, and container pricing.
                </p>
              </div>

              <Link
                href={`/contact?service=${encodeURIComponent("Bulk Export Supply")}&additionalRequirement=${encodeURIComponent("Service Quotation Request for Videha Overseas Services")}`}
                className="group inline-flex items-center gap-3 border border-background/40 px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"
              >
                Request Quotation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
