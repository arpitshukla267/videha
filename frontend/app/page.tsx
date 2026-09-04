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
import { getBulkContent, getHeroStories, getProducts, mediaUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Videha Overseas — Makhana & Guar Gum Exporter from India",
  description:
    "Makhana exporter from India and food grade guar gum supplier for international buyers. Bulk makhana, private label makhana, and fox nuts supply with export-ready documentation.",
};

export default async function Page() {
  const [products, heroStories, content] = await Promise.all([
    getProducts(),
    getHeroStories(),
    getBulkContent(),
  ]);

  return (
    <main>
      <Hero
        stories={heroStories.map((s) => ({
          id: s.id,
          number: s.number,
          label: s.label,
          heading: s.heading,
          description: s.description,
          image: s.image,
          mobileImage: s.mobileImage,
          alt: s.alt,
          ctaLabel: s.ctaLabel,
          ctaHref: s.ctaHref,
        }))}
      />
      <Intro facts={content.introFacts} />
      <GlobalReach preview />
      <Products
        products={products.map((p) => ({ ...p, image: mediaUrl(p.image) }))}
      />
      <WhyGlobalBuyersChoose />
      <ProcessStory
        steps={content.processSteps.map((s) => ({
          num: s.num,
          label: s.label,
          heading: s.heading,
          copy: s.copy,
          image: s.image,
        }))}
      />
      <Quality preview points={content.qualityPoints} />
      <CompanyCredibilitySection />
      <ExportDocumentation />
      <BrandStatement />
      <Suspense fallback={null}>
        <Contact preview />
      </Suspense>
    </main>
  );
}
