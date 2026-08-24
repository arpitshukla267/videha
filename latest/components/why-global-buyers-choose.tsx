"use client";

import {
  Globe,
  ShieldCheck,
  FileCheck,
  Boxes,
  Tag,
  Coins,
  MessageSquare,
  Sliders,
  Handshake,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

const WHY_BUYERS_CHOOSE = [
  {
    icon: Globe,
    title: "Reliable Indian Sourcing",
    desc: "Sourcing can be arranged through approved processing and supply partners in India.",
  },
  {
    icon: ShieldCheck,
    title: "Quality-Focused Procurement",
    desc: "Strict multi-stage moisture audits, mechanical sieving, and defect calibration.",
  },
  {
    icon: FileCheck,
    title: "Export-Ready Documentation",
    desc: "Compliant phytosanitary certs, Certificate of Origin (COO), and batch-specific COAs.",
  },
  {
    icon: Boxes,
    title: "Flexible Bulk Packaging",
    desc: "From 25kg multi-wall paper sacks and vacuum bags to bulk jumbo FIBC bags.",
  },
  {
    icon: Tag,
    title: "Private Label Support",
    desc: "Complete OEM brand development, layout design, and customized retail packing.",
  },
  {
    icon: Coins,
    title: "Competitive Export Pricing",
    desc: "Seasonal sourcing can be arranged subject to product availability and buyer requirements.",
  },
  {
    icon: MessageSquare,
    title: "Responsive Customer Support",
    desc: "Our export team supports buyer enquiries and coordinates requirements throughout the order process.",
  },
  {
    icon: Sliders,
    title: "Customized Buyer Requirements",
    desc: "Bespoke sizing parameters, seasoning blends, and tailored chemical specifications.",
  },
  {
    icon: Handshake,
    title: "Long-Term Supply Partnership",
    desc: "Annual supply volumes can be discussed and planned based on buyer requirements and availability.",
  },
];

export function WhyGlobalBuyersChoose() {
  return (
    <section className="py-24 md:py-32 border-t border-b border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="max-w-3xl mb-16 md:mb-20">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
            GLOBAL PARTNERSHIP VALUES
          </span>
          <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
            Why Global Buyers Choose Videha Overseas
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We streamline international trade by replacing regional agricultural volatility with consistent, reliable, and customer-centric supply lines.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 md:gap-y-16">
          {WHY_BUYERS_CHOOSE.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={idx * 0.04}>
                <div className="flex flex-col md:flex-row gap-4 items-start group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-[#f8f6f0] text-accent transition-colors group-hover:bg-accent group-hover:text-white rounded-[4px]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
