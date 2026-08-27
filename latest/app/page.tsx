import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/hero"
import { Intro } from "@/components/intro"
import { Products } from "@/components/products"
import { ProcessStory } from "@/components/process-story"
import { Quality } from "@/components/quality"
import { GlobalReach } from "@/components/global-reach"
import { BrandStatement } from "@/components/brand-statement"
import { Contact } from "@/components/contact"
import { WhyGlobalBuyersChoose } from "@/components/why-global-buyers-choose"
import { CompanyCredibilitySection } from "@/components/company-credibility-section";
import { ExportDocumentation } from "@/components/exportDocumentation"

export const metadata: Metadata = {
  title: "Videha Overseas — Makhana & Guar Gum Exporter from India",
  description:
    "Makhana exporter from India and food grade guar gum supplier for international buyers. Bulk makhana, private label makhana, and fox nuts supply with export-ready documentation.",
};

export default function Page() {
  return (
    <main>
      <Hero />
      <Intro />
      <GlobalReach preview />
      <Products />
      <WhyGlobalBuyersChoose />
      <ProcessStory />
      <Quality preview />
      <CompanyCredibilitySection />
      <ExportDocumentation />
      <BrandStatement />
      <Suspense fallback={null}>
        <Contact preview />
      </Suspense>
    </main>
  );
}
