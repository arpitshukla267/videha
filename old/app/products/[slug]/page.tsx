import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { OriginSealGraphic, ComplianceBadgesGraphic } from "@/components/graphics"

interface PageProps {
  params: Promise<{ slug: string }>
}

const DETAIL_MAP: Record<
  string,
  {
    index: string
    name: string
    image: string
    tagline: string
    story: string
    grade: string
    format: string
    application: string
    packaging: string
    specs: { label: string; value: string }[]
    processingSteps: string[]
    packingDetails: string
    applicationsList: string[]
    exportSuitability: string
  }
> = {
  "classic-roasted-makhana": {
    index: "01",
    name: "Classic Roasted Makhana",
    image: "/images/product-classic.png",
    tagline: "Pure, Double-Roasted Crisp Puffs",
    story: "Our classic roasted makhana is the golden standard of popping. Sourced directly from local farmer cooperatives in Mithila, Bihar, the raw seeds undergo careful sun-drying before entering controlled-temperature flame roasting. Pop by pop, the seeds expand into light, uniform ivory-white puffs. Free from added oils, chemical bleaches, or artificial seasoning, this product serves as a clean, highly nutritious base perfect for snack packaging or custom flavoring.",
    grade: "Grade AAA (6mm+ Super Jumbo)",
    format: "Plain Dry Roasted (Oil-Free)",
    application: "Retail snack packing, private label flavor coating, industrial food ingredient",
    packaging: "Heavy-gauge nitrogen flushed retail pouching & 10kg bulk woven sacks",
    specs: [
      { label: "Uniform Sizing", value: "6.0mm to 7.0mm+ Super Jumbo sorting" },
      { label: "Moisture Level", value: "Under 4.5% guaranteed at packaging" },
      { label: "Purity Grade", value: "AAA Premium white popped, zero chemical bleaching" },
      { label: "Shell Fragment Rate", value: "Strict limit below 0.5% per batch" },
      { label: "Defective Puffs", value: "Less than 1.5% trace limits" }
    ],
    processingSteps: [
      "Wetland seed collection by Mithila cooperatives",
      "Sieving and grading of raw seeds by diameter",
      "Controlled flame roasting to optimize internal moisture",
      "Thermal shock popping (traditional manual execution)",
      "Optical sorting to remove seed coat fragments and unpopped seeds",
      "Kiln-drying to seal moisture under 4.5%"
    ],
    packingDetails: "Nitrogen-flushed retail stand-up pouches (50g, 100g, 150g) with customized printing options, or heavy-duty 10kg double-barrier woven sacks designed for sea transit.",
    applicationsList: [
      "Ready-to-eat clean label healthy snack brands",
      "Ingredient use in breakfast cereals and trail mixes",
      "Private-label packaging operations in destination markets",
      "Wholesale health-food distribution channels"
    ],
    exportSuitability: "Highly optimized for long-haul ocean freight. Low moisture content prevents puff softening, and standard sizing allows precise volumetric calculations for container loads."
  },
  "flavoured-makhana": {
    index: "02",
    name: "Flavoured Makhana",
    image: "/images/product-flavoured.png",
    tagline: "Gourmet Seasoned Puffs for Global Brands",
    story: "Designed for premium snack brands, our seasoned makhana range elevates the traditional puff with clean, natural seasoning formulations. We work with expert food technologists to formulate profiles tailored for international palates. The puffs are flame roasted, lightly coated with food-grade binder, and gently tumbled with finely-milled spices. The outcome is a dry, non-greasy snack with rich flavor and zero greasy residues.",
    grade: "Export Grade AAA (5.5mm+)",
    format: "Seasoned & Baked",
    application: "Snack retail brands, airline snack boxes, hospitality and food service",
    packaging: "Matte laminate retail bags, custom jars, and private label boxes",
    specs: [
      { label: "Available Profiles", value: "Himalayan Pink Salt, Peri Peri, White Truffle, Herbs, Sour Cream" },
      { label: "Binder Standard", value: "Premium cold-pressed olive oil or rice bran oil (< 8% dry weight)" },
      { label: "Moisture Content", value: "Under 4.0% dry stable finish" },
      { label: "Shelf Life", value: "12 Months in nitrogen-flushed pouches" },
      { label: "Additives Policy", value: "No MSG, artificial colors, or trans-fats" }
    ],
    processingSteps: [
      "Grade sorting of dry-popped makhana (5.5mm+ lots)",
      "Controlled baking to remove trace moisture",
      "Continuous micro-spraying of premium vegetable binder",
      "Rotary seasoning drum coating with food-tech spices",
      "Secondary dry-air kiln baking",
      "Nitrogen-flushed form-fill-seal packaging"
    ],
    packingDetails: "Nitrogen-flushed multi-layer foil pouches (30g to 100g) with high barrier properties, packed in heavy corrugated master cartons.",
    applicationsList: [
      "Private label brands seeking ready-to-sell snack ranges",
      "Premium airline snack programs and train hospitality sets",
      "Natural and organic food store shelves",
      "Custom flavor development programs"
    ],
    exportSuitability: "Nitrogen flushing prevents oil oxidation (rancidity) and preserves crunch structure across varied shipping climates."
  },
  "bulk-raw-export": {
    index: "03",
    name: "Bulk & Raw Export",
    image: "/images/product-bulk.png",
    tagline: "Sieved Raw Seeds & Bulk Unroasted Puffs",
    story: "For food manufacturers, milling houses, and regional wholesale packaging units, we supply size-graded raw makhana seeds and unflavoured raw popped lots. Our raw seeds are sorted immediately post-harvest to verify seed coat thickness and kernel weight. Puffed bulk lots are packed under vacuum to protect structural integrity during long-haul transit, ensuring they arrive at your facility ready for processing, flavoring, or packaging.",
    grade: "Size-Graded Raw Lots (5mm to 6mm+)",
    format: "Raw Unpopped Seeds & Unseasoned Popped Lots",
    application: "Industrial processing houses, milling facilities (makhana flour), wholesale repacking",
    packaging: "Bulk woven polypropylene bags & heavy-duty vacuum sacks",
    specs: [
      { label: "Seed Diameter", value: "5.0mm, 5.5mm, 6.0mm+ separate lots" },
      { label: "Moisture in Seeds", value: "Under 12.0% stabilized raw seeds" },
      { label: "Container Load (Seeds)", value: "Up to 20 Metric Tons in 20ft FCL container" },
      { label: "Container Load (Popped)", value: "3.5 to 4.5 Metric Tons in 40ft HC container" },
      { label: "Certifications", value: "Phytosanitary certificate, COO, FSSAI Export License" }
    ],
    processingSteps: [
      "Wetland seed collection and mud removal",
      "Traditional sun drying on controlled clean platforms",
      "Mechanical sizing through rotary sieves",
      "Pre-shipment moisture test & density calculation",
      "Vacuum bag sealing or bulk sacks stitching",
      "Direct container load stuffing at our processing depot"
    ],
    packingDetails: "Raw seeds packed in 50kg Jute/PP sacks. Bulk popped makhana packed in 10kg heavy-duty vacuum-sealed polybags inside triple-wall corrugated shipping boxes.",
    applicationsList: [
      "Milling facilities manufacturing high-protein gluten-free flours",
      "Regional popped makhana roasters and seasoning facilities",
      "Large-scale repacking firms serving domestic hypermarkets",
      "Ingredient suppliers in the European and North American wellness spaces"
    ],
    exportSuitability: "Highly efficient shipping layout. Raw seeds optimize container weight limits, whereas bulk vacuum-sealed popped lots optimize space utilization without breaking puff integrity."
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = DETAIL_MAP[slug]
  if (!data) return {}
  return {
    title: `${data.name} — Videha Overseas`,
    description: data.tagline,
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = DETAIL_MAP[slug]

  if (!product) {
    notFound()
  }

  return (
    <main className="overflow-hidden bg-background">
      {/* Product Hero */}
      <header className="relative border-b border-border bg-[#f8f6f0] pt-36 md:pt-48 pb-16">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            ← Back to Product Range
          </Link>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <span className="font-mono text-xs font-bold text-accent block mb-2">
                PRODUCT {product.index}
              </span>
              <h1 className="text-[clamp(2.25rem,5.5vw,4.2rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-foreground">
                {product.name}
              </h1>
              <p className="mt-4 text-lg text-primary font-medium tracking-tight">
                {product.tagline}
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase bg-secondary px-3.5 py-1.5 border border-border font-medium text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {product.grade}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Cinematic Main Section */}
      <section className="border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 pb-20 md:px-10 md:pb-28">
          <div className="relative aspect-[21/9] w-full overflow-hidden border border-border bg-secondary">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </section>

      {/* Product Layout Grid with Sticky Rail */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            
            {/* Left Column: Product Information */}
            <div className="lg:col-span-8 flex flex-col gap-16">
              
              {/* Product Story */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent block mb-4">
                  01 · PRODUCT OVERVIEW
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
                  Sourcing & Background Story
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {product.story}
                </p>
              </div>

              {/* Technical Specifications Table */}
              <div className="border-t border-border pt-12">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent block mb-4">
                  02 · SPECIFICATIONS
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
                  Technical Grade Standards
                </h2>
                <div className="border border-border bg-background">
                  {product.specs.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4 text-xs ${
                        i !== product.specs.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="font-mono text-muted-foreground uppercase">{spec.label}</span>
                      <span className="sm:col-span-2 font-medium text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Processing Journey Workflow */}
              <div className="border-t border-border pt-12">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent block mb-4">
                  03 · PROCESSING
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
                  Step-by-Step Quality Control
                </h2>
                <div className="flex flex-col gap-4">
                  {product.processingSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 border border-border p-5 bg-background">
                      <span className="font-mono text-xs font-bold text-accent bg-secondary px-2.5 py-1">
                        0{idx + 1}
                      </span>
                      <p className="text-xs md:text-sm text-foreground font-medium mt-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Packaging & Logistics */}
              <div className="border-t border-border pt-12">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent block mb-4">
                  04 · LOGISTICS & PACKAGING
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
                  Export Sealing Formats
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.packingDetails}
                </p>
                <div className="mt-6 border border-border bg-secondary/10 p-6">
                  <h4 className="text-xs font-mono font-bold text-foreground uppercase mb-2">Transit Durability</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {product.exportSuitability}
                  </p>
                </div>
              </div>

              {/* Target Market Applications */}
              <div className="border-t border-border pt-12">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent block mb-4">
                  05 · APPLICATIONS
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
                  Recommended End Uses
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.applicationsList.map((app, idx) => (
                    <div key={idx} className="flex items-start gap-3 border border-border p-4 bg-background">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-foreground">{app}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Sticky Product Info Rail */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 flex flex-col gap-8">
                
                {/* Core Specs Rail Box */}
                <div className="border border-border p-6 bg-[#f8f6f0]">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-semibold block mb-4 border-b border-border/60 pb-2">
                    EXPORT FACTSHEET
                  </span>
                  
                  <div className="flex flex-col gap-4 text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground text-[9px]">FORMAT</span>
                      <span className="font-semibold text-foreground block mt-0.5">{product.format}</span>
                    </div>
                    <div className="border-t border-border/40 pt-3">
                      <span className="text-muted-foreground text-[9px]">GRADE</span>
                      <span className="font-semibold text-foreground block mt-0.5">{product.grade}</span>
                    </div>
                    <div className="border-t border-border/40 pt-3">
                      <span className="text-muted-foreground text-[9px]">EXPORT CAPACITY</span>
                      <span className="font-semibold text-foreground block mt-0.5">24 Metric Tons / Month</span>
                    </div>
                    <div className="border-t border-border/40 pt-3">
                      <span className="text-muted-foreground text-[9px]">ORIGIN</span>
                      <span className="font-semibold text-foreground block mt-0.5">Mithila, Bihar, India</span>
                    </div>
                  </div>
                </div>

                {/* Quick Enquiry Card */}
                <div className="border border-border p-6 bg-foreground text-background">
                  <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent block mb-2">
                    B2B INQUIRIES
                  </span>
                  <h3 className="text-lg font-semibold text-background">
                    Ready to request container rates?
                  </h3>
                  <p className="text-xs text-background/60 mt-2 leading-relaxed">
                    Send us your volume requirements and target destination ports. We will prepare an EXIM sheet matching your specifications.
                  </p>
                  
                  <Link
                    href={`/contact?product=${slug}`}
                    className="group mt-6 w-full inline-flex justify-center items-center gap-2 bg-background py-3.5 text-xs font-mono uppercase tracking-wider text-foreground hover:bg-primary hover:text-background transition-colors"
                  >
                    Enquire About This Grade
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                {/* Quality Accreditation seal */}
                <div className="border border-border p-6 bg-background flex flex-col items-center text-center">
                  <OriginSealGraphic className="w-20 h-20" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-accent mt-3 block">
                    ORIGIN AUDITED
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    100% Traceable Wetland Lot
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Compliance & Standards */}
      <section className="border-t border-border py-16 bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="text-center mb-8">
            <span className="text-[9px] font-mono uppercase text-muted-foreground">Certified Sourcing Compliance</span>
          </div>
          <ComplianceBadgesGraphic />
        </div>
      </section>
    </main>
  )
}
