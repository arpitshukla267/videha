import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Poppins } from "next/font/google";
import {
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  Leaf,
  Recycle,
  MapPin,
  MessageCircle,
  Boxes,
  ShoppingBag,
  Tag,
  SlidersHorizontal,
  PackageCheck,
  Settings2,
  Palette,
  Package,
  Factory,
  Ship,
} from "lucide-react";
import { Lens } from "@/components/ui/lens";
import { ComplianceBadgesGraphic } from "@/components/graphics";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ProductDetail = {
  index: string;
  name: string;
  image: string;
  tagline: string;
  description: string;

  origin: string;
  gradeSize: string;
  appearance: string;
  moisture: string;
  qualityParameters: { label: string; value: string }[];

  packagingOptions: string;
  moq: string;
  shelfLife: string;
  privateLabel: string;
  bulkSupply: string;
  exportMarkets: string;
  sampleAvailability: string;

  processingSteps: string[];
};

// Slugs below are generated the same way as on the /products listing page:
// name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
const DETAIL_MAP: Record<string, ProductDetail> = {
  "raw-plain-makhana": {
    index: "01",
    name: "Raw / Plain Makhana",
    image: "/images/product-raw.webp",
    tagline: "Clean, Graded Fox Nuts for Bulk & Processing",

    description:
      "Our raw and plain makhana is sourced directly from farmer cooperatives in Mithila, Bihar, and supplied in carefully graded, unroasted formats. It is suited to bulk buyers, food manufacturers, and businesses carrying out their own roasting, seasoning, or repacking.",

    origin: "Mithila, Bihar, India",

    gradeSize:
      "To be confirmed — final grade and size specifications will be provided separately.",

    appearance:
      "Clean, unroasted makhana seeds, uniformly graded with minimal foreign matter. Final appearance parameters to be confirmed.",

    moisture:
      "To be confirmed — final moisture specification will be provided separately.",

    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Defect Tolerance", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],

    packagingOptions:
      "Bulk sacks and custom packaging formats available. Final pack sizes, materials and specifications to be confirmed.",

    moq: "To be confirmed based on product, packaging and destination market.",

    shelfLife:
      "To be confirmed based on final product specification and packaging format.",

    privateLabel:
      "Available for buyers processing the product further under their own brand. Requirements can be discussed with the export team.",

    bulkSupply:
      "Core offering for wholesalers, food manufacturers and processors requiring large volumes.",

    exportMarkets:
      "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",

    sampleAvailability:
      "Samples available on request, subject to product and destination requirements.",

    processingSteps: [
      "Raw seed sourcing",
      "Cleaning and foreign matter removal",
      "Size grading and sorting",
      "Quality inspection",
      "Final packing and export preparation",
    ],
  },

  "premium-makhana": {
    index: "02",
    name: "Premium Makhana",
    image: "/images/premium-makhana.jpeg",
    tagline: "Consistent, Export-Grade Fox Nuts",

    description:
      "Premium Makhana is selected for consistent quality, clean appearance and reliable supply across international markets. It is suited to retail brands, wholesale buyers and private label programs seeking a dependable premium-grade product.",

    origin: "Mithila, Bihar, India",

    gradeSize:
      "To be confirmed — final grade and size specifications will be provided separately.",

    appearance:
      "Premium ivory-white makhana with a clean, uniform appearance. Final appearance parameters to be confirmed.",

    moisture:
      "To be confirmed — final moisture specification will be provided separately.",

    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Defect Tolerance", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],

    packagingOptions:
      "Retail packs, bulk sacks and custom formats available. Final pack sizes, materials and specifications to be confirmed.",

    moq: "To be confirmed based on product, packaging and destination market.",

    shelfLife:
      "To be confirmed based on final product specification and packaging format.",

    privateLabel:
      "Available. Private label packaging and customized retail formats can be discussed based on buyer requirements.",

    bulkSupply:
      "Available for international distributors, wholesalers, food brands and other large-volume buyers.",

    exportMarkets:
      "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",

    sampleAvailability:
      "Samples available on request, subject to product and destination requirements.",

    processingSteps: [
      "Raw seed sourcing",
      "Cleaning and grading",
      "Premium quality selection",
      "Quality inspection",
      "Final packing and export preparation",
    ],
  },

  "jumbo-makhana": {
    index: "03",
    name: "Jumbo Makhana",
    image: "/images/product-jumbo.webp",
    tagline: "Large-Size Fox Nuts for Premium Presentation",

    description:
      "Jumbo Makhana is selected for buyers seeking premium presentation, uniform large-size grading and high-quality export supply. It is well suited to premium retail, wholesale and private label programs where size consistency matters.",

    origin: "Mithila, Bihar, India",

    gradeSize:
      "Jumbo size grading. Final size specifications will be provided separately.",

    appearance:
      "Large, uniform, ivory-white makhana with a clean premium appearance. Final appearance parameters to be confirmed.",

    moisture:
      "To be confirmed — final moisture specification will be provided separately.",

    qualityParameters: [
      { label: "Grade", value: "Jumbo / Premium" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Defect Tolerance", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],

    packagingOptions:
      "Retail packs, bulk sacks and custom formats available. Final pack sizes, materials and specifications to be confirmed.",

    moq: "To be confirmed based on product, packaging and destination market.",

    shelfLife:
      "To be confirmed based on final product specification and packaging format.",

    privateLabel:
      "Available. Private label packaging and customized retail formats can be discussed based on buyer requirements.",

    bulkSupply:
      "Available for international distributors, wholesalers, premium food brands and other large-volume buyers.",

    exportMarkets:
      "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",

    sampleAvailability:
      "Samples available on request, subject to product and destination requirements.",

    processingSteps: [
      "Raw seed sourcing",
      "Cleaning and size grading",
      "Jumbo size selection",
      "Quality inspection",
      "Final packing and export preparation",
    ],
  },

  "roasted-makhana": {
    index: "04",
    name: "Roasted Makhana",
    image: "/images/classic-roasted-salt.jpeg",
    tagline: "Light, Crisp, Plain-Roasted Puffs",

    description:
      "Our roasted makhana is carefully roasted to a light, crisp texture with a clean flavour, suitable for retail snack brands, food service and private label programs. The raw seeds are dried, graded and roasted under controlled conditions to keep texture and taste consistent.",

    origin: "Mithila, Bihar, India",

    gradeSize:
      "To be confirmed — final grade and size specifications will be provided separately.",

    appearance:
      "Ivory-white roasted makhana with a clean, crisp and uniform appearance. Final appearance parameters to be confirmed.",

    moisture:
      "To be confirmed — final moisture specification will be provided separately.",

    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Defect Tolerance", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],

    packagingOptions:
      "Retail packs, bulk sacks and custom formats available. Final pack sizes, materials and specifications to be confirmed.",

    moq: "To be confirmed based on product, packaging and destination market.",

    shelfLife:
      "To be confirmed based on final product specification and packaging format.",

    privateLabel:
      "Available. Private label packaging and customized retail formats can be discussed based on buyer requirements.",

    bulkSupply:
      "Available for international distributors, wholesalers, food brands and other large-volume buyers.",

    exportMarkets:
      "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",

    sampleAvailability:
      "Samples available on request, subject to product and destination requirements.",

    processingSteps: [
      "Raw seed sourcing",
      "Cleaning and grading",
      "Controlled roasting",
      "Quality inspection",
      "Final packing and export preparation",
    ],
  },

  "flavoured-makhana": {
    index: "05",
    name: "Flavoured Makhana",
    image: "/images/flavoured.jpeg",
    tagline: "Gourmet Seasoned Puffs for Global Brands",

    description:
      "Our flavoured makhana range is designed for snack brands and international buyers looking for ready-to-sell seasoned makhana products. Flavour profiles and formulations can be adapted according to market requirements, brand positioning and customer specifications.",

    origin: "India — final sourcing origin to be confirmed per product lot.",

    gradeSize:
      "To be confirmed — final grade and size specifications will be provided separately.",

    appearance:
      "Crisp roasted makhana with an even seasoning and clean finished appearance. Final appearance and coating parameters to be confirmed.",

    moisture:
      "To be confirmed — final moisture specification will be provided separately.",

    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      {
        label: "Flavour Profile",
        value: "To be confirmed based on selected formulation",
      },
      { label: "Seasoning Uniformity", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],

    packagingOptions:
      "Retail pouches, customized private label packaging, jars and other retail-ready formats may be available depending on requirements.",

    moq: "To be confirmed based on flavour, packaging format and order requirements.",

    shelfLife:
      "To be confirmed based on final formulation, packaging and storage conditions.",

    privateLabel:
      "Available. Custom flavour profiles, packaging and private label formats can be developed according to buyer requirements.",

    bulkSupply:
      "Available for snack brands, distributors, food-service buyers and international retail programs.",

    exportMarkets:
      "International markets. Destination-specific requirements can be discussed during quotation.",

    sampleAvailability:
      "Samples available on request. Flavour samples can be discussed based on buyer requirements.",

    processingSteps: [
      "Grade selection",
      "Controlled roasting",
      "Flavour and seasoning application",
      "Quality inspection",
      "Final packaging and export preparation",
    ],
  },

  "bulk-makhana": {
    index: "06",
    name: "Bulk Makhana",
    image: "/images/product-bulk.webp",
    tagline: "Export-Volume Supply for Importers & Distributors",

    description:
      "Bulk Makhana is supplied in export volumes for importers, distributors, manufacturers and businesses with large-volume requirements. Products can be supplied raw, roasted or flavoured according to required grade, size, volume and intended application, subject to final buyer specifications.",

    origin: "Mithila, Bihar, India",

    gradeSize:
      "Multiple grades and sizes may be available. Final grade and size specifications to be confirmed separately.",

    appearance:
      "Clean, graded makhana supplied in bulk format suitable for wholesale, re-export or further processing. Final appearance parameters to be confirmed.",

    moisture:
      "To be confirmed according to the final product specification and whether the product is supplied raw or roasted.",

    qualityParameters: [
      { label: "Product Format", value: "Raw / roasted bulk lots" },
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      {
        label: "Container Load",
        value: "To be confirmed based on product format and packing",
      },
    ],

    packagingOptions:
      "Bulk sacks, heavy-duty packaging and container-load formats depending on product requirements.",

    moq: "To be confirmed based on product format, packaging and destination.",

    shelfLife:
      "To be confirmed based on raw material, processing status, packaging and storage conditions.",

    privateLabel:
      "Available where applicable for finished or processed products. Requirements can be discussed with the export team.",

    bulkSupply:
      "Yes. Bulk supply is a core offering for importers, distributors, manufacturers and wholesale buyers.",

    exportMarkets:
      "Suitable for international bulk buyers. Destination-specific compliance and documentation to be confirmed.",

    sampleAvailability:
      "Bulk product samples available on request, subject to product availability and shipping requirements.",

    processingSteps: [
      "Raw material sourcing",
      "Cleaning and removal of foreign material",
      "Size grading and sorting",
      "Quality inspection",
      "Bulk packing and container preparation",
    ],
  },

  "private-label-makhana": {
    index: "07",
    name: "Private Label Makhana",
    image: "/images/product-private-label.webp",
    tagline: "Your Brand. Our Product. Reliable Export Support.",

    description:
      "Flexible private-label makhana solutions with customized product formats, flavours and packaging tailored to your brand requirements. We support retail brands, distributors and importers from product selection through to branded, export-ready packaging.",

    origin: "Mithila, Bihar, India",

    gradeSize:
      "To be confirmed based on selected product format (raw, roasted or flavoured) and buyer specification.",

    appearance:
      "Appearance depends on the selected product format and finish. Final appearance parameters to be confirmed with the buyer.",

    moisture:
      "To be confirmed based on the selected product format and final specification.",

    qualityParameters: [
      { label: "Product Format", value: "Customized to buyer requirement" },
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Flavour / Seasoning", value: "To be confirmed, if applicable" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],

    packagingOptions:
      "Custom retail packs and bulk formats produced under the buyer's own brand, artwork and pack copy.",

    moq: "To be confirmed based on product format, packaging and branding requirements.",

    shelfLife:
      "To be confirmed based on final product specification and packaging format.",

    privateLabel:
      "Core offering. Full private label program covering product, flavour, packaging and branding selection.",

    bulkSupply:
      "Available for retail brands, distributors and importers requiring branded bulk or retail-ready volumes.",

    exportMarkets:
      "International markets. Destination-specific requirements can be discussed during quotation.",

    sampleAvailability:
      "Samples available on request, including branded packaging mock-ups where applicable.",

    processingSteps: [
      "Product and flavour/grade selection",
      "Packaging format selection",
      "Label and branding application",
      "Production and packing",
      "Export preparation and dispatch",
    ],
  },

  "makhana-powder": {
    index: "08",
    name: "Makhana Powder",
    image: "/images/product-powder.webp",
    tagline: "Milled Fox Nut Powder for Food & Wellness Applications",

    description:
      "Makhana powder is supplied for food manufacturers, wellness brands and other applications, subject to final product specifications and confirmation. It is produced by milling graded makhana under hygienic conditions to a consistent particle size.",

    origin: "Mithila, Bihar, India",

    gradeSize:
      "To be confirmed — final particle size and grade specifications will be provided separately.",

    appearance:
      "Fine, off-white to ivory powder with a clean, consistent texture. Final appearance parameters to be confirmed.",

    moisture:
      "To be confirmed — final moisture specification will be provided separately.",

    qualityParameters: [
      { label: "Particle Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Moisture", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
      { label: "Packaging Format", value: "To be confirmed" },
    ],

    packagingOptions:
      "Bulk sacks and custom packaging formats available. Final pack sizes, materials and specifications to be confirmed.",

    moq: "To be confirmed based on product, packaging and destination market.",

    shelfLife:
      "To be confirmed based on final product specification and packaging format.",

    privateLabel:
      "Available for food and wellness brands. Requirements can be discussed with the export team.",

    bulkSupply:
      "Available for food manufacturers, wellness brands and ingredient buyers requiring bulk volumes.",

    exportMarkets:
      "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",

    sampleAvailability:
      "Samples available on request, subject to product and destination requirements.",

    processingSteps: [
      "Raw seed sourcing",
      "Roasting and processing",
      "Milling and grinding",
      "Quality inspection",
      "Final packing and export preparation",
    ],
  },
};

// Packaging capability shown across all Makhana product variants.
const MAKHANA_PACKAGING = [
  {
    icon: Boxes,
    title: "Bulk Packing",
    copy: "Heavy-duty bulk bags and cartons designed for wholesalers, distributors and food manufacturers ordering by container load.",
  },
  {
    icon: ShoppingBag,
    title: "Retail Packing",
    copy: "Consumer-ready pouches and packs suited for retail shelf presentation, e-commerce and food-service channels.",
  },
  {
    icon: Tag,
    title: "Private Label Packing",
    copy: "Fully branded packaging produced under your own label — logo, artwork and pack copy applied to our production line.",
  },
  {
    icon: SlidersHorizontal,
    title: "Custom Packing",
    copy: "Tailored pack formats, sizes and materials built around your market, shelf format and shipping requirements.",
  },
];

const GUARGUM_PACKAGING = [
  {
    icon: PackageCheck,
    title: "Standard Industrial / Food Grade Bags",
    copy: "Multi-wall kraft paper bags with inner polyethylene liner, built for hygienic handling and long-haul export transit.",
  },
  {
    icon: Settings2,
    title: "Customized Packaging",
    copy: "Bag sizes, materials and labelling adapted to buyer specifications, including jumbo FIBC bags for bulk shipments.",
  },
];

const PRIVATE_LABEL_FLOW = [
  { icon: ShoppingBag, label: "Product Selection" },
  { icon: Palette, label: "Flavour / Grade Selection" },
  { icon: Package, label: "Packaging Selection" },
  { icon: Tag, label: "Label / Branding" },
  { icon: Factory, label: "Production & Packing" },
  { icon: Ship, label: "Export" },
];

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = DETAIL_MAP[slug];

  if (!data) return {};

  return {
    title: `${data.name} — Videha Overseas`,
    description: data.tagline,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = DETAIL_MAP[slug];

  if (!product) {
    notFound();
  }

  const badges = [
    {
      icon: ShieldCheck,
      label: "Export Grade Quality",
    },
    {
      icon: Leaf,
      label: "Indian Origin",
    },
    {
      icon: Recycle,
      label: "Flexible Packaging",
    },
    {
      icon: MapPin,
      label: "Origin Traceable",
    },
  ];

  return (
   <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: [`https://www.videhaoverseas.com${product.image}`],
          brand: {
            "@type": "Brand",
            name: "Videha Overseas",
          },
          manufacturer: {
            "@type": "Organization",
            name: "Videha Overseas",
          },
        }),
      }}
    /> 

    <main
      className={`${poppins.variable} font-sans overflow-hidden bg-background`}
    >
      {/* Breadcrumb */}
      <div className="pt-28 md:pt-30 pb-6 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-md  text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Product Range
          </Link>
        </div>
      </div>

      {/* PRODUCT HERO */}
      <section className="border-b border-border bg-background py-0 md:py-4">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Product Image */}
            <div className="relative aspect-square w-full overflow-hidden border border-border bg-secondary">
              <Lens
                src={product.image}
                alt={product.name}
                zoomFactor={2.2}
                lensSize={180}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Product Information */}
            <div className="flex flex-col">
              <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
                {product.name}
              </h1>

              <p className="mt-3 text-base text-primary font-medium tracking-tight">
                {product.tagline}
              </p>

              {/* Product Description */}
              <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Origin */}
              <div className="mt-6 border-t border-border pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <span className="text-[16px] text-muted-foreground">
                      Origin
                    </span>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {product.origin}
                    </p>
                  </div>

                  <div>
                    <span className="text-[16px] text-muted-foreground">
                      Grade / Size
                    </span>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {product.gradeSize}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Quote */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <Link
                  href={`/contact?product=${encodeURIComponent(
                    product.name,
                  )}&additionalRequirement=${encodeURIComponent(
                    `Instant Enquiry for ${product.name}`,
                  )}`}
                  className="group inline-flex items-center justify-center gap-2 bg-foreground px-8 py-4 text-sm font-medium text-background transition-colors hover:bg-primary"
                >
                  Request Quote
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <WhatsAppButton
                  productName={product.name}
                  label="Get Export Price"
                />
              </div>

              {/* Badges */}
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

      {/* PRODUCT SPECIFICATIONS */}
      <section className="py-8 md:py-12 border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-primary">
              PRODUCT SPECIFICATIONS
            </span>

            <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Product Specifications
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Technical specifications shown below are editable and subject to
              final confirmation based on the buyer requirement and approved
              product specification sheet.
            </p>
          </div>

          <div className="border border-border bg-background">
            {/* Appearance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-5 border-b border-border">
              <span className="font-medium text-sm uppercase">Appearance</span>

              <span className="sm:col-span-2 text-sm text-muted-foreground">
                {product.appearance}
              </span>
            </div>

            {/* Moisture */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-5 border-b border-border">
              <span className="font-medium text-sm uppercase">Moisture</span>

              <span className="sm:col-span-2 text-sm text-muted-foreground">
                {product.moisture}
              </span>
            </div>

            {/* Quality Parameters */}
            {product.qualityParameters.map((spec, index) => (
              <div
                key={spec.label}
                className={`grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-5 ${
                  index !== product.qualityParameters.length - 1
                    ? "border-b border-border"
                    : ""
                }`}
              >
                <span className="font-medium text-sm uppercase">
                  {spec.label}
                </span>

                <span className="sm:col-span-2 text-sm text-muted-foreground">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMERCIAL INFORMATION */}
      <section className="py-8 md:py-12 border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-primary">
              COMMERCIAL INFORMATION
            </span>

            <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Supply & Export Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Packaging */}
            <div className="border border-border p-6 bg-[#f8f6f0]">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Packaging Options
              </span>

              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {product.packagingOptions}
              </p>
            </div>

            {/* MOQ */}
            <div className="border border-border p-6 bg-[#f8f6f0]">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                MOQ
              </span>

              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {product.moq}
              </p>
            </div>

            {/* Shelf Life */}
            <div className="border border-border p-6 bg-[#f8f6f0]">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Shelf Life
              </span>

              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {product.shelfLife}
              </p>
            </div>

            {/* Private Label */}
            <div className="border border-border p-6 bg-[#f8f6f0]">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Private Label Availability
              </span>

              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {product.privateLabel}
              </p>
            </div>

            {/* Bulk Supply */}
            <div className="border border-border p-6 bg-[#f8f6f0]">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Bulk Supply
              </span>

              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {product.bulkSupply}
              </p>
            </div>

            {/* Export Markets */}
            <div className="border border-border p-6 bg-[#f8f6f0]">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Export Markets
              </span>

              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {product.exportMarkets}
              </p>
            </div>

            {/* Sample */}
            <div className="border border-border p-6 bg-[#f8f6f0] md:col-span-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Sample Availability
              </span>

              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {product.sampleAvailability}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGING SOLUTIONS */}
      <section className="py-16 md:py-20 border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-12 max-w-3xl">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-primary">
              PACKAGING CAPABILITIES
            </span>

            <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Packaging Solutions
            </h2>

            <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              We offer flexible packaging formats across our Makhana and Guar
              Gum product lines to suit retail, food-service, industrial and
              private label requirements. Final packaging sizes and technical
              specifications will be shared and confirmed with the buyer prior
              to production.
            </p>
          </div>

          {/* Makhana Packaging */}
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Makhana
            </span>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MAKHANA_PACKAGING.map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="border border-border bg-background p-6 flex flex-col gap-3"
                >
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <Link
              href={`/contact?product=${encodeURIComponent(
                product.name,
              )}&additionalRequirement=${encodeURIComponent(
                `Discuss Packaging Requirement for ${product.name}`,
              )}&packaging=${encodeURIComponent(product.packagingOptions)}`}
              className="group inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-primary transition-colors"
            >
              Discuss Packaging Requirement
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* PRIVATE LABEL PROGRAM */}
      <section className="py-16 md:py-20 border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Content */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-primary">
                  PRIVATE LABEL PROGRAM
                </span>

                <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                  Your Brand. Our Product. <br className="hidden sm:inline" />
                  Reliable Export Support.
                </h2>

                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  We work with retail brands, distributors and importers to
                  develop Makhana products under their own label — from grade
                  and flavour selection through to branded packaging and export
                  delivery. Our team supports each stage of the process so
                  partner brands can launch with confidence.
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href={`/contact?product=${encodeURIComponent(
                    product.name,
                  )}&additionalRequirement=${encodeURIComponent(
                    `Discuss Private Label Requirement for ${product.name}`,
                  )}&privateLabel=Yes`}
                  className="group inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 text-sm font-medium hover:bg-primary transition-colors"
                >
                  Discuss Private Label Requirement
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* How It Works */}
            <div className="lg:col-span-7 h-full">
              <div className="h-full border border-border bg-[#f8f6f0] p-5 md:p-6 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-sm tracking-[0.1em] text-muted-foreground">
                    How It Works
                  </span>

                  {/* <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                    6 Steps
                  </span> */}
                </div>

                <div className="mt-5 flex-1 grid grid-cols-2 grid-rows-3 border border-border">
                  {PRIVATE_LABEL_FLOW.map(({ icon: Icon, label }, idx) => (
                    <div
                      key={label}
                      className={`
                  group relative flex flex-col justify-between
                  p-4 md:p-5 bg-background
                  transition-colors duration-300 hover:bg-[#f3f0e9]
                  ${idx % 2 === 0 ? "border-r border-border" : ""}
                  ${idx < 4 ? "border-b border-border" : ""}
                `}
                    >
                      {/* <span className="absolute top-3 right-4 text-[8px] font-mono tracking-[0.12em] text-muted-foreground/60">
                        {String(idx + 1).padStart(2, "0")}
                      </span> */}

                      <div className="flex h-8 w-8 items-center justify-center border border-border bg-[#f8f6f0]">
                        <Icon
                          className="h-4 w-4 text-accent"
                          strokeWidth={1.7}
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[11px] md:text-[12px] font-semibold text-foreground leading-tight">
                          {label}
                        </span>

                        {/* {idx !== PRIVATE_LABEL_FLOW.length - 1 && (
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform duration-300 group-hover:translate-x-1" />
                        )} */}
                      </div>
                    </div>
                  ))}
                </div>

                {/* <div className="mt-4 flex items-center gap-3">
                  <div className="h-px w-7 bg-border" />

                  <span className="text-[8px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                    From selection to export delivery
                  </span>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* PROCESSING JOURNEY */}
      <section className="py-8 md:py-12 border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-primary">
              QUALITY PROCESS
            </span>

            <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Quality Control Process
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.processingSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 border border-border p-5 bg-background"
              >
                <span className="font-mono text-xs font-bold text-accent bg-secondary px-2.5 py-1">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <p className="text-xs md:text-sm text-foreground font-medium mt-1">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REQUEST QUOTE CTA */}
      <section className="py-16 md:py-20 bg-background border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-border bg-[#f8f6f0] p-8 md:p-10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-primary">
                BUYER ENQUIRY
              </span>

              <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-foreground">
                Interested in {product.name}?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Request pricing, samples, technical specifications, packaging
                options or export details from our team.
              </p>
            </div>

            <Link
              href={`/contact?product=${encodeURIComponent(product.name)}&additionalRequirement=${encodeURIComponent(`Requesting Quote for ${product.name}`)}`}
              className="group inline-flex shrink-0 items-center gap-3 bg-foreground px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary"
            >
              Request Quote
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      {/* <section className="border-t border-border py-16 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="text-center mb-8">
            <span className="text-[9px] font-mono uppercase text-muted-foreground">
              Certified Sourcing Compliance
            </span>
          </div>

          <ComplianceBadgesGraphic />
        </div>
      </section> */}
    </main>
  </>  
  );
}
