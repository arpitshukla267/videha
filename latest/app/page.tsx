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
      <Contact preview />
    </main>
  );
}
