import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Poppins } from "next/font/google"
import {
  ArrowRight,
  ShieldCheck,
  Search,
  MessageCircle,
  Leaf,
  Recycle,
  MapPin,
} from "lucide-react"
import { Lens } from "@/components/ui/lens";
import { ComplianceBadgesGraphic } from "@/components/graphics"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

type PageProps = {
  params: Promise<{ slug: string }>
}

type ProductDetail = {
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

const DETAIL_MAP: Record<string, ProductDetail> = {
  "classic-roasted-makhana": {
    index: "01",
    name: "Classic Roasted Makhana",
    image: "/images/product-classic.png",
    tagline: "Pure, Double-Roasted Crisp Puffs",
    story:
      "Our classic roasted makhana is the golden standard of popping. Sourced directly from local farmer cooperatives in Mithila, Bihar, the raw seeds undergo careful sun-drying before entering controlled-temperature flame roasting. Pop by pop, the seeds expand into light, uniform ivory-white puffs. Free from added oils, chemical bleaches, or artificial seasoning, this product serves as a clean, highly nutritious base perfect for snack packaging or custom flavoring.",
    grade: "Grade AAA (6mm+ Super Jumbo)",
    format: "Plain Dry Roasted (Oil-Free)",
    application: "Retail snack packing, private label flavor coating, industrial food ingredient",
    packaging: "Heavy-gauge nitrogen flushed retail pouching & 10kg bulk woven sacks",
    specs: [
      { label: "Uniform Sizing", value: "6.0mm to 7.0mm+ Super Jumbo sorting" },
      { label: "Moisture Level", value: "Under 4.5% guaranteed at packaging" },
      { label: "Purity Grade", value: "AAA Premium white popped, zero chemical bleaching" },
      { label: "Shell Fragment Rate", value: "Strict limit below 0.5% per batch" },
      { label: "Defective Puffs", value: "Less than 1.5% trace limits" },
    ],
    processingSteps: [
      "Wetland seed collection by Mithila cooperatives",
      "Sieving and grading of raw seeds by diameter",
      "Controlled flame roasting to optimize internal moisture",
      "Thermal shock popping (traditional manual execution)",
      "Optical sorting to remove seed coat fragments and unpopped seeds",
      "Kiln-drying to seal moisture under 4.5%",
    ],
    packingDetails:
      "Nitrogen-flushed retail stand-up pouches (50g, 100g, 150g) with customized printing options, or heavy-duty 10kg double-barrier woven sacks designed for sea transit.",
    applicationsList: [
      "Ready-to-eat clean label healthy snack brands",
      "Ingredient use in breakfast cereals and trail mixes",
      "Private-label packaging operations in destination markets",
      "Wholesale health-food distribution channels",
    ],
    exportSuitability:
      "Highly optimized for long-haul ocean freight. Low moisture content prevents puff softening, and standard sizing allows precise volumetric calculations for container loads.",
  },
  "flavoured-makhana": {
    index: "02",
    name: "Flavoured Makhana",
    image: "/images/product-flavoured.png",
    tagline: "Gourmet Seasoned Puffs for Global Brands",
    story:
      "Designed for premium snack brands, our seasoned makhana range elevates the traditional puff with clean, natural seasoning formulations. We work with expert food technologists to formulate profiles tailored for international palates. The puffs are flame roasted, lightly coated with food-grade binder, and gently tumbled with finely-milled spices. The outcome is a dry, non-greasy snack with rich flavor and zero greasy residues.",
    grade: "Export Grade AAA (5.5mm+)",
    format: "Seasoned & Baked",
    application: "Snack retail brands, airline snack boxes, hospitality and food service",
    packaging: "Matte laminate retail bags, custom jars, and private label boxes",
    specs: [
      { label: "Available Profiles", value: "Himalayan Pink Salt, Peri Peri, White Truffle, Herbs, Sour Cream" },
      { label: "Binder Standard", value: "Premium cold-pressed olive oil or rice bran oil (< 8% dry weight)" },
      { label: "Moisture Content", value: "Under 4.0% dry stable finish" },
      { label: "Shelf Life", value: "12 Months in nitrogen-flushed pouches" },
      { label: "Additives Policy", value: "No MSG, artificial colors, or trans-fats" },
    ],
    processingSteps: [
      "Grade sorting of dry-popped makhana (5.5mm+ lots)",
      "Controlled baking to remove trace moisture",
      "Continuous micro-spraying of premium vegetable binder",
      "Rotary seasoning drum coating with food-tech spices",
      "Secondary dry-air kiln baking",
      "Nitrogen-flushed form-fill-seal packaging",
    ],
    packingDetails:
      "Nitrogen-flushed multi-layer foil pouches (30g to 100g) with high barrier properties, packed in heavy corrugated master cartons.",
    applicationsList: [
      "Private label brands seeking ready-to-sell snack ranges",
      "Premium airline snack programs and train hospitality sets",
      "Natural and organic food store shelves",
      "Custom flavor development programs",
    ],
    exportSuitability:
      "Nitrogen flushing prevents oil oxidation (rancidity) and preserves crunch structure across varied shipping climates.",
  },
  "bulk-raw-export": {
    index: "03",
    name: "Bulk & Raw Export",
    image: "/images/product-bulk.png",
    tagline: "Sieved Raw Seeds & Bulk Unroasted Puffs",
    story:
      "For food manufacturers, milling houses, and regional wholesale packaging units, we supply size-graded raw makhana seeds and unflavoured raw popped lots. Our raw seeds are sorted immediately post-harvest to verify seed coat thickness and kernel weight. Puffed bulk lots are packed under vacuum to protect structural integrity during long-haul transit, ensuring they arrive at your facility ready for processing, flavoring, or packaging.",
    grade: "Size-Graded Raw Lots (5mm to 6mm+)",
    format: "Raw Unpopped Seeds & Unseasoned Popped Lots",
    application: "Industrial processing houses, milling facilities (makhana flour), wholesale repacking",
    packaging: "Bulk woven polypropylene bags & heavy-duty vacuum sacks",
    specs: [
      { label: "Seed Diameter", value: "5.0mm, 5.5mm, 6.0mm+ separate lots" },
      { label: "Moisture in Seeds", value: "Under 12.0% stabilized raw seeds" },
      { label: "Container Load (Seeds)", value: "Up to 20 Metric Tons in 20ft FCL container" },
      { label: "Container Load (Popped)", value: "3.5 to 4.5 Metric Tons in 40ft HC container" },
      { label: "Certifications", value: "Phytosanitary certificate, COO, FSSAI Export License" },
    ],
    processingSteps: [
      "Wetland seed collection and mud removal",
      "Traditional sun drying on controlled clean platforms",
      "Mechanical sizing through rotary sieves",
      "Pre-shipment moisture test & density calculation",
      "Vacuum bag sealing or bulk sacks stitching",
      "Direct container load stuffing at our processing depot",
    ],
    packingDetails:
      "Raw seeds packed in 50kg Jute/PP sacks. Bulk popped makhana packed in 10kg heavy-duty vacuum-sealed polybags inside triple-wall corrugated shipping boxes.",
    applicationsList: [
      "Milling facilities manufacturing high-protein gluten-free flours",
      "Regional popped makhana roasters and seasoning facilities",
      "Large-scale repacking firms serving domestic hypermarkets",
      "Ingredient suppliers in the European and North American wellness spaces",
    ],
    exportSuitability:
      "Highly efficient shipping layout. Raw seeds optimize container weight limits, whereas bulk vacuum-sealed popped lots optimize space utilization without breaking puff integrity.",
  },
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

  // Categories shown under description — reuse existing product fields as tags
  const categoryTags = ["All", product.grade, product.format]

  const badges = [
    { icon: ShieldCheck, label: "Export Grade Quality" },
    { icon: Leaf, label: "Naturally Processed" },
    { icon: Recycle, label: "Sustainably Packed" },
    { icon: MapPin, label: "Origin Traceable" },
  ]

  return (
    <main
      className={`${poppins.variable} font-sans overflow-hidden bg-background`}
    >
      {/* Breadcrumb strip */}
      <div className=" pt-28 md:pt-30 pb-6 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-md font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Product Range
          </Link>
        </div>
      </div>

      {/* PRODUCT HERO — image left, details right */}
      <section className="border-b border-border bg-background py-10 md:py-10">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left: Product Image with Cursor Zoom */}
            <div className="relative aspect-square w-full overflow-hidden border border-border bg-secondary">
              <Lens
                src={product.image}
                alt={product.name}
                zoomFactor={2.2}
                lensSize={180}
                className="h-full w-full"
              />
            </div>

            {/* Right: Title, description, categories, actions */}
            <div className="flex flex-col">
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
                {product.name}
              </h1>
              <p className="mt-3 text-base text-primary font-medium tracking-tight">
                {product.tagline}
              </p>

              <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
                {product.story}
              </p>

              {/* Categories line */}
              <p className="mt-6 text-sm text-foreground">
                <span className="font-medium">Categories: </span>
                {categoryTags.map((tag, i) => (
                  <span key={tag}>
                    <Link
                      href="/products"
                      className="text-primary hover:underline"
                    >
                      {tag}
                    </Link>
                    {i < categoryTags.length - 1 && ", "}
                  </span>
                ))}
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/contact?product=${encodeURIComponent(product.name)}`}
                  className="group inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 text-sm font-medium hover:bg-primary transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Enquiry Now
                </Link>
                <a
                  href="https://wa.me/910000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 border border-border px-8 py-4 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Instant Enquiry?
                </a>
              </div>

              {/* Icon badges row */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {badges.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center gap-2 border border-border p-4"
                  >
                    <Icon className="w-6 h-6 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIFICATIONS — full width, below hero, since list can be long */}
      <section className="py-8 md:py-12 border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-8">
            Technical Grade Standards
          </h2>
          <div className="border border-border bg-background">
            {product.specs.map((spec, i) => (
              <div
                key={spec.label}
                className={`grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4 ${
                  i !== product.specs.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="font-medium text-sm uppercase">
                  {spec.label}
                </span>
                <span className="sm:col-span-2 text-sm">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESSING JOURNEY */}
      <section className="py-8 md:py-12 border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-8">
            Step-by-Step Quality Control
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.processingSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 border border-border p-5 bg-[#f8f6f0]"
              >
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
      </section>

      {/* Compliance & Standards */}
      <section className="border-t border-border py-16 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="text-center mb-8">
            <span className="text-[9px] font-mono uppercase text-muted-foreground">
              Certified Sourcing Compliance
            </span>
          </div>
          <ComplianceBadgesGraphic />
        </div>
      </section>
    </main>
  );
}