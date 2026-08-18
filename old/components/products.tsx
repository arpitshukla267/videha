import Image from "next/image"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"

const PRODUCTS = [
  {
    index: "01",
    name: "Classic Roasted Makhana",
    image: "/images/product-classic.png",
    copy: "Pure, plain-roasted fox nuts with a delicate crunch and clean flavour — the versatile foundation of the range, ideal for retail and private label.",
    meta: ["Plain Roasted", "Retail & Bulk", "Grade AAA"],
  },
  {
    index: "02",
    name: "Flavoured Makhana",
    image: "/images/product-flavoured.png",
    copy: "Lightly seasoned varieties developed for modern snacking — measured spice, natural ingredients and a finish tuned to international palates.",
    meta: ["Seasoned", "Snack-Ready", "Custom Blends"],
  },
  {
    index: "03",
    name: "Bulk & Raw Export",
    image: "/images/product-bulk.png",
    copy: "Graded raw and semi-processed fox nuts supplied in export volumes, sorted by size and packed to preserve integrity across long-haul shipping.",
    meta: ["Size Graded", "Bulk Sacks", "Wholesale"],
  },
]

export function Products() {
  return (
    <section id="products" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-40">
        <div className="max-w-2xl">
          <Reveal>
            <SectionLabel>Our Products</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground text-balance md:text-5xl">
              A Better Standard of Makhana
            </h2>
          </Reveal>
        </div>

        <div className="mt-20 flex flex-col gap-24 md:mt-28 md:gap-36">
          {PRODUCTS.map((p, i) => {
            const reversed = i % 2 === 1
            return (
              <div
                key={p.name}
                className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-14"
              >
                <Reveal
                  as="figure"
                  className={`md:col-span-7 ${reversed ? "md:order-2" : ""}`}
                >
                  <div className="relative aspect-[16/11] w-full overflow-hidden">
                    <Image
                      src={p.image || "/placeholder.svg"}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 58vw"
                      className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.04]"
                    />
                  </div>
                </Reveal>

                <div
                  className={`md:col-span-5 ${reversed ? "md:order-1 md:pr-6" : "md:pl-6"}`}
                >
                  <Reveal>
                    <span className="text-[13px] font-medium tracking-[0.2em] text-accent">
                      {p.index}
                    </span>
                  </Reveal>
                  <Reveal delay={0.05}>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                      {p.name}
                    </h3>
                  </Reveal>
                  <Reveal delay={0.1}>
                    <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                      {p.copy}
                    </p>
                  </Reveal>
                  <Reveal delay={0.15}>
                    <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
                      {p.meta.map((m) => (
                        <li
                          key={m}
                          className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/60"
                        >
                          {m}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
