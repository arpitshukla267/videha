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
    "Explore our premium export-ready makhana range. Size-graded classic roasted, seasoned gourmet, and bulk raw fox nuts.",
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
        <div className="mx-auto max-w-[1680px] px-5 py-24 sm:px-8 md:px-10 lg:py-32 xl:px-12">
          <div className="mb-14 md:mb-16">
            <Reveal delay={0.05}>
              <h2 className="mt-5 max-w-3xl text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl">
                Every Grade, Every Format, Export Ready.
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product, index) => (
              <Reveal
                key={product.name}
                delay={index * 0.06}
                className="h-full"
              >
                <article className="group flex h-full flex-col overflow-hidden border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                  {/* Image */}
                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-secondary">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                    />
                    <div className="absolute top-4 left-4 bg-background/90 px-3 py-1.5 border border-border text-[10px] font-mono uppercase text-foreground">
                      {product.format}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <span className="font-mono text-[10px] font-bold text-accent">
                      PRODUCT {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
                      {product.name}
                    </h3>
                    <p className="mt-2.5 line-clamp-3 text-sm leading-[1.55] text-muted-foreground">
                      {product.copy}
                    </p>

                    {/* Specs */}
                    <div className="mt-5 pt-5 border-t border-border/60 grid grid-cols-2 gap-3 text-[11px] font-mono">
                      <div>
                        <span className="text-muted-foreground uppercase text-[9px] tracking-wider block">
                          Grade
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {product.grade}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase text-[9px] tracking-wider block">
                          Packaging
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {product.packaging}
                        </span>
                      </div>
                    </div>

                    {/* Button */}
                    <div className="mt-auto pt-6">
                      <Link
                        href={`/products/${getSlug(product.name)}`}
                        className="group/btn flex h-11 w-full items-center justify-center gap-2 border border-foreground/80 text-[13px] font-medium uppercase tracking-wide text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
                      >
                        View Specifications
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TAILORED SPECIFICATION CTA */}
      <section className="py-24 md:py-32 bg-[#f8f6f0]">
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
              href="/contact"
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
