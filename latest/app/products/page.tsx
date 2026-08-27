import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { PRODUCTS } from "@/lib/content";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Products — Videha Overseas",
  description:
    "Explore our export-ready makhana range — bulk makhana supplier and fox nuts supplier from India, with private label makhana and food grade guar gum options.",
};

// Generate slugs based on product name
const getSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export default function ProductsPage() {
  return (
    <main
      className={`${poppins.variable} font-sans overflow-hidden bg-background`}
    >
      {/* PRODUCT CARD GRID */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-full md:max-w-[1680px] px-3 py-24 sm:px-8 md:px-10 lg:py-32 xl:px-12">
          <div className="mb-14 md:mb-16">
            <Reveal delay={0.05}>
              <h2 className="mt-5 max-w-3xl text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl">
                Every Grade, Every Format, Export Ready.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
                From bulk makhana and private label makhana to peri peri and
                cream & onion flavoured makhana and food grade guar gum, our
                product range is built for international distributors, food
                brands, and wholesale buyers sourcing from India.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-4 md:gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {PRODUCTS.map((product, index) => (
              <Reveal
                key={product.name}
                delay={index * 0.06}
                className="h-full"
              >
                <article className="group flex h-full flex-col overflow-hidden border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                  {/* Image */}
                  <div className="relative aspect-[5/5] md:aspect-[10/8] w-full overflow-hidden bg-secondary">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-3 md:p-6">
                    <h3 className="md:mt-2 text-lg md:text-xl font-medium md:font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
                      {product.name}
                    </h3>
                    <p className="mt-2.5 line-clamp-3 text-sm leading-[1.55] text-muted-foreground">
                      {product.copy}
                    </p>


                    {/* Buttons */}
                    <div className="mt-auto pt-6 grid grid-cols-1 gap-2">
                      <Link
                        href={`/products/${getSlug(product.name)}`}
                        className="group/btn flex h-10 w-full items-center justify-center border border-foreground/60 text-[11px] font-medium uppercase tracking-wide text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
                      >
                        Details
                      </Link>
                      {/* <Link
                        href={`/contact?product=${encodeURIComponent(product.name)}`}
                        className="group/btn flex h-10 w-full items-center justify-center gap-1 bg-foreground text-[11px] font-medium uppercase tracking-wide text-background transition-all duration-300 hover:bg-primary"
                      >
                        Enquire
                        <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                      </Link> */}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GUAR GUM LINK BANNER */}
      <section className="border-t border-border bg-[#f8f6f0] py-20">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-center border border-border bg-background p-8 md:p-12 rounded-[5px]">
            <div className="md:col-span-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
                TECHNICAL B2B HYDROCOLLOIDS
              </span>
              <h2 className="mt-3 text-2xl font-semibold text-foreground md:text-3xl">
                Food Grade Guar Gum Powder (E412)
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-2xl">
                Looking for our industrial food stabilizer and thickening agent? We supply premium Indian-origin Guar Gum Powder with standardized viscosity grades (up to 5,500 cps) and fine mesh calibration, tailored for global food manufacturing.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <Link
                href="/guar-gum"
                className="group inline-flex items-center gap-3 bg-foreground px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-all hover:bg-primary"
              >
                View Technical Specs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TAILORED SPECIFICATION CTA */}
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 text-center max-w-3xl">
          <Reveal>
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              CUSTOM SPECIFICATIONS
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl">
              Need a specification tailored to your market?
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground max-w-xl mx-auto">
              We work closely with distributors and food brands to accommodate
              customized sizing, bespoke seasoning profiles, and custom bulk or
              retail packaging requirements.
            </p>
            <Link
              href="/contact?subject=Custom+Market+Specifications"
              className="mt-8 inline-flex items-center gap-3 bg-foreground px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary"
            >
              Enquire Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
