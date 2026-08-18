import { Hero } from "@/components/hero"
import { Intro } from "@/components/intro"
import { Products } from "@/components/products"
import { ProcessStory } from "@/components/process-story"
import { Quality } from "@/components/quality"
import { GlobalReach } from "@/components/global-reach"
import { WhyVideha } from "@/components/why-videha"
import { BrandStatement } from "@/components/brand-statement"
import { Contact } from "@/components/contact"

export default function Page() {
  return (
    <main>
      <Hero />
      <Intro />
      <Products preview />
      <ProcessStory />
      <Quality preview />
      <GlobalReach preview />
      <WhyVideha />
      <BrandStatement />
      <Contact preview />
    </main>
  )
}
