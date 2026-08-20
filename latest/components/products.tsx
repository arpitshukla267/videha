import Image from "next/image";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PRODUCTS = [
  {
    index: "01",
    name: "Classic Roasted Makhana",
    image: "/images/product-classic.png",
    copy: "Pure, plain-roasted fox nuts with a delicate crunch and clean flavour — the versatile foundation of the range, ideal for retail and private label.",
  },
  {
    index: "02",
    name: "Flavoured Makhana",
    image: "/images/product-flavoured.png",
    copy: "Lightly seasoned varieties developed for modern snacking — measured spice, natural ingredients and a finish tuned to international palates.",
  },
  {
    index: "03",
    name: "Bulk & Raw Export",
    image: "/images/product-bulk.png",
    copy: "Graded raw and semi-processed fox nuts supplied in export volumes, sorted by size and packed to preserve integrity across long-haul shipping.",
  },
  {
    index: "04",
    name: "Makhana Powder",
    image: "/images/product-powder.png",
    copy: "Premium makhana powder processed for food manufacturers, wellness brands and private-label applications with consistent quality.",
  },
];

// Generate slugs based on product name
const getSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export function Products() {
  return (
    <section id="products" className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-[1680px] px-3 py-12 md:py-24 sm:px-8 md:px-10 lg:py-32 xl:px-12">
        {/* Header */}
        <div className="mb-14 md:mb-16">
          <Reveal>
            <SectionLabel>Our Products</SectionLabel>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="mt-5 max-w-3xl text-xl font-medium leading-[1.02] tracking-[-0.04em] text-foreground sm:text-2xl lg:text-3xl">
              Our Best Makhana, Curated for the World{" "}
            </h2>
          </Reveal>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product, index) => (
            <Reveal key={product.name} delay={index * 0.06} className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-[5px] border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                {/* Image */}
                <div className="relative aspect-[5/5] md:aspect-[1.18/1] w-full overflow-hidden bg-secondary">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="
                      (max-width: 640px) 100vw,
                      (max-width: 1024px) 50vw,
                      25vw
                    "
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-3 md:p-5">
                  <h3 className="text-lg md:text-xl font-medium leading-[1.15] tracking-[-0.03em] text-foreground">
                    {product.name}
                  </h3>

                  <p className="mt-2.5 line-clamp-2 text-[15px] leading-[1.55] text-muted-foreground">
                    {product.copy}
                  </p>

                  {/* Buttons */}
                  <div className="mt-auto pt-5 grid grid-cols-1 gap-2">
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
  );
}
