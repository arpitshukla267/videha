import "dotenv/config";
import { connectDB } from "./db";
import { Product } from "./models/Product";
import { HeroStory } from "./models/HeroStory";
import {
  ProcessStep,
  QualityPoint,
  Market,
  Service,
  BuyerExpectation,
  IntroFact,
  SiteConfig,
} from "./models/SiteContent";

// ─── Products seed data ───────────────────────────────────────────────────────
const PRODUCTS_SEED = [
  {
    index: "01",
    slug: "raw-plain-makhana",
    name: "Raw / Plain Makhana",
    image: "/images/product-classic.jpeg",
    copy: "Clean, plain makhana sourced from India and supplied in carefully graded formats for bulk buyers, food businesses and further processing.",
    meta: ["Raw / Plain", "Bulk Supply", "Size Graded"],
    grade: "To be confirmed",
    format: "Raw / plain",
    application: "Bulk supply, processing, wholesale",
    packaging: "Bulk sacks · custom formats",
    tagline: "Clean, Graded Fox Nuts for Bulk & Processing",
    description: "Our raw and plain makhana is sourced directly from farmer cooperatives in Mithila, Bihar, and supplied in carefully graded, unroasted formats. It is suited to bulk buyers, food manufacturers, and businesses carrying out their own roasting, seasoning, or repacking.",
    origin: "Mithila, Bihar, India",
    gradeSize: "To be confirmed — final grade and size specifications will be provided separately.",
    appearance: "Clean, unroasted makhana seeds, uniformly graded with minimal foreign matter. Final appearance parameters to be confirmed.",
    moisture: "To be confirmed — final moisture specification will be provided separately.",
    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Defect Tolerance", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],
    packagingOptions: "Bulk sacks and custom packaging formats available. Final pack sizes, materials and specifications to be confirmed.",
    moq: "To be confirmed based on product, packaging and destination market.",
    shelfLife: "To be confirmed based on final product specification and packaging format.",
    privateLabel: "Available for buyers processing the product further under their own brand. Requirements can be discussed with the export team.",
    bulkSupply: "Core offering for wholesalers, food manufacturers and processors requiring large volumes.",
    exportMarkets: "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",
    sampleAvailability: "Samples available on request, subject to product and destination requirements.",
    processingSteps: ["Raw seed sourcing", "Cleaning and foreign matter removal", "Size grading and sorting", "Quality inspection", "Final packing and export preparation"],
    order: 1,
  },
  {
    index: "02",
    slug: "premium-makhana",
    name: "Premium Makhana",
    image: "/images/premium-makhana2.jpeg",
    copy: "Premium-grade Indian makhana selected for consistent quality, clean appearance and reliable supply across international markets.",
    meta: ["Premium Grade", "Export Supply", "Selected Quality"],
    grade: "To be confirmed",
    format: "Premium makhana",
    application: "Retail, wholesale, private label",
    packaging: "Retail packs · bulk sacks · custom formats",
    tagline: "Consistent, Export-Grade Fox Nuts",
    description: "Premium Makhana sourced from India and supplied for international buyers, retail brands, wholesalers and private label programs.",
    origin: "India",
    gradeSize: "Premium / Export Grade — Multiple grades available",
    appearance: "Clean, premium-grade fox nuts with a consistent appearance.",
    moisture: "≤7%",
    qualityParameters: [
      { label: "Grade", value: "Premium / Export Grade" },
      { label: "Size", value: "Multiple grades available" },
      { label: "Purity", value: "≥99%" },
    ],
    packagingOptions: "100 g, 250 g, 5 kg, 10 kg / Customized",
    moq: "To be confirmed based on product, packaging and buyer requirements.",
    shelfLife: "To be confirmed based on final product specification and packaging format.",
    privateLabel: "Available. Private label packaging can be customized according to buyer requirements.",
    bulkSupply: "Available for international distributors, wholesalers, food brands and large-volume buyers.",
    exportMarkets: "International markets, subject to destination-specific requirements.",
    sampleAvailability: "Samples available on request, subject to product and destination requirements.",
    processingSteps: ["Sourcing", "Cleaning and grading", "Quality inspection", "Final packing and export preparation"],
    order: 2,
  },
  {
    index: "03",
    slug: "jumbo-makhana",
    name: "Jumbo Makhana",
    image: "/images/jumbo.jpeg",
    copy: "Large-size makhana selected for buyers seeking premium presentation, uniform grading and high-quality export supply.",
    meta: ["Jumbo Size", "Premium Grade", "Export Supply"],
    grade: "To be confirmed",
    format: "Jumbo size",
    application: "Premium retail, wholesale, private label",
    packaging: "Retail packs · bulk sacks · custom formats",
    tagline: "Large-Size Fox Nuts for Premium Presentation",
    description: "Jumbo Makhana is selected for buyers seeking premium presentation, uniform large-size grading and high-quality export supply. It is well suited to premium retail, wholesale and private label programs where size consistency matters.",
    origin: "Mithila, Bihar, India",
    gradeSize: "Jumbo size grading. Final size specifications will be provided separately.",
    appearance: "Large, uniform, ivory-white makhana with a clean premium appearance. Final appearance parameters to be confirmed.",
    moisture: "To be confirmed — final moisture specification will be provided separately.",
    qualityParameters: [
      { label: "Grade", value: "Jumbo / Premium" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Defect Tolerance", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],
    packagingOptions: "Retail packs, bulk sacks and custom formats available. Final pack sizes, materials and specifications to be confirmed.",
    moq: "To be confirmed based on product, packaging and destination market.",
    shelfLife: "To be confirmed based on final product specification and packaging format.",
    privateLabel: "Available. Private label packaging and customized retail formats can be discussed based on buyer requirements.",
    bulkSupply: "Available for international distributors, wholesalers, premium food brands and other large-volume buyers.",
    exportMarkets: "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",
    sampleAvailability: "Samples available on request, subject to product and destination requirements.",
    processingSteps: ["Raw seed sourcing", "Cleaning and size grading", "Jumbo size selection", "Quality inspection", "Final packing and export preparation"],
    order: 3,
  },
  {
    index: "04",
    slug: "roasted-makhana",
    name: "Roasted Makhana",
    image: "/images/roasted.webp",
    copy: "Carefully roasted makhana with a light, crisp texture and clean flavour, suitable for retail, food brands and private-label programs.",
    meta: ["Roasted", "Snack-Ready", "Private Label"],
    grade: "To be confirmed",
    format: "Plain roasted",
    application: "Retail, private label, food service",
    packaging: "Retail packs · bulk sacks · custom formats",
    tagline: "Light, Crisp, Plain-Roasted Puffs",
    description: "Our roasted makhana is carefully roasted to a light, crisp texture with a clean flavour, suitable for retail snack brands, food service and private label programs. The raw seeds are dried, graded and roasted under controlled conditions to keep texture and taste consistent.",
    origin: "Mithila, Bihar, India",
    gradeSize: "To be confirmed — final grade and size specifications will be provided separately.",
    appearance: "Ivory-white roasted makhana with a clean, crisp and uniform appearance. Final appearance parameters to be confirmed.",
    moisture: "To be confirmed — final moisture specification will be provided separately.",
    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Defect Tolerance", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],
    packagingOptions: "Retail packs, bulk sacks and custom formats available. Final pack sizes, materials and specifications to be confirmed.",
    moq: "To be confirmed based on product, packaging and destination market.",
    shelfLife: "To be confirmed based on final product specification and packaging format.",
    privateLabel: "Available. Private label packaging and customized retail formats can be discussed based on buyer requirements.",
    bulkSupply: "Available for international distributors, wholesalers, food brands and other large-volume buyers.",
    exportMarkets: "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",
    sampleAvailability: "Samples available on request, subject to product and destination requirements.",
    processingSteps: ["Raw seed sourcing", "Cleaning and grading", "Controlled roasting", "Quality inspection", "Final packing and export preparation"],
    order: 4,
  },
  {
    index: "05",
    slug: "peri-peri-makhana",
    name: "Peri Peri Makhana",
    image: "/images/flavoured.jpeg",
    copy: "Spicy peri peri seasoned makhana for modern snacking, with export-ready retail and private label packaging options.",
    meta: ["Peri Peri", "Snack-Ready", "Private Label"],
    grade: "To be confirmed",
    format: "Peri peri flavoured",
    application: "Snack retail, food service, private label",
    packaging: "Retail-ready · private label options",
    tagline: "Spicy Seasoned Puffs for Global Snack Brands",
    description: "Our peri peri makhana is a ready-to-sell flavoured fox nut snack with a bold, spicy seasoning profile. Suited to snack brands, distributors and private label programs seeking a popular peri peri flavour for international retail and food-service markets.",
    origin: "India — final sourcing origin to be confirmed per product lot.",
    gradeSize: "To be confirmed — final grade and size specifications will be provided separately.",
    appearance: "Crisp roasted makhana with an even peri peri seasoning and clean finished appearance. Final appearance and coating parameters to be confirmed.",
    moisture: "To be confirmed — final moisture specification will be provided separately.",
    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Flavour Profile", value: "Peri Peri" },
      { label: "Seasoning Uniformity", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],
    packagingOptions: "Retail pouches, customized private label packaging, jars and other retail-ready formats may be available depending on requirements.",
    moq: "To be confirmed based on flavour, packaging format and order requirements.",
    shelfLife: "To be confirmed based on final formulation, packaging and storage conditions.",
    privateLabel: "Available. Custom packaging and private label formats can be developed according to buyer requirements.",
    bulkSupply: "Available for snack brands, distributors, food-service buyers and international retail programs.",
    exportMarkets: "International markets. Destination-specific requirements can be discussed during quotation.",
    sampleAvailability: "Samples available on request. Peri peri flavour samples can be discussed based on buyer requirements.",
    processingSteps: ["Grade selection", "Controlled roasting", "Peri peri seasoning application", "Quality inspection", "Final packaging and export preparation"],
    order: 5,
  },
  {
    index: "06",
    slug: "cream-onion-makhana",
    name: "Cream & Onion Makhana",
    image: "/images/cream&onion.webp",
    copy: "Cream & onion seasoned makhana with a savoury profile for retail, food service and international snack brands.",
    meta: ["Cream & Onion", "Snack-Ready", "Private Label"],
    grade: "To be confirmed",
    format: "Cream & onion flavoured",
    application: "Snack retail, food service, private label",
    packaging: "Retail-ready · private label options",
    tagline: "Savoury Seasoned Puffs for Global Snack Brands",
    description: "Our cream & onion makhana is a ready-to-sell flavoured fox nut snack with a creamy, savoury onion profile. Ideal for snack brands, distributors and private label buyers looking for a familiar cream & onion flavour for international retail and food-service channels.",
    origin: "India — final sourcing origin to be confirmed per product lot.",
    gradeSize: "To be confirmed — final grade and size specifications will be provided separately.",
    appearance: "Crisp roasted makhana with an even cream & onion seasoning and clean finished appearance. Final appearance and coating parameters to be confirmed.",
    moisture: "To be confirmed — final moisture specification will be provided separately.",
    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Flavour Profile", value: "Cream & Onion" },
      { label: "Seasoning Uniformity", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],
    packagingOptions: "Retail pouches, customized private label packaging, jars and other retail-ready formats may be available depending on requirements.",
    moq: "To be confirmed based on flavour, packaging format and order requirements.",
    shelfLife: "To be confirmed based on final formulation, packaging and storage conditions.",
    privateLabel: "Available. Custom packaging and private label formats can be developed according to buyer requirements.",
    bulkSupply: "Available for snack brands, distributors, food-service buyers and international retail programs.",
    exportMarkets: "International markets. Destination-specific requirements can be discussed during quotation.",
    sampleAvailability: "Samples available on request. Cream & onion flavour samples can be discussed based on buyer requirements.",
    processingSteps: ["Grade selection", "Controlled roasting", "Cream & onion seasoning application", "Quality inspection", "Final packaging and export preparation"],
    order: 6,
  },
  {
    index: "07",
    slug: "mint-masala-makhana",
    name: "Mint Masala Makhana",
    image: "/images/mint.jpeg",
    copy: "Mint masala seasoned makhana with a fresh, aromatic profile for retail, food service and international snack brands.",
    meta: ["Mint Masala", "Snack-Ready", "Private Label"],
    grade: "To be confirmed",
    format: "Mint masala flavoured",
    application: "Snack retail, food service, private label",
    packaging: "Retail-ready · private label options",
    tagline: "Fresh, Aromatic Seasoned Puffs for Global Snack Brands",
    description: "Our mint masala makhana is a ready-to-sell flavoured fox nut snack with a fresh, aromatic mint masala profile. Suited to snack brands, distributors and private label buyers seeking a distinctive mint masala flavour for international retail and food-service markets.",
    origin: "India — final sourcing origin to be confirmed per product lot.",
    gradeSize: "To be confirmed — final grade and size specifications will be provided separately.",
    appearance: "Crisp roasted makhana with an even mint masala seasoning and clean finished appearance. Final appearance and coating parameters to be confirmed.",
    moisture: "To be confirmed — final moisture specification will be provided separately.",
    qualityParameters: [
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Flavour Profile", value: "Mint Masala" },
      { label: "Seasoning Uniformity", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],
    packagingOptions: "Retail pouches, customized private label packaging, jars and other retail-ready formats may be available depending on requirements.",
    moq: "To be confirmed based on flavour, packaging format and order requirements.",
    shelfLife: "To be confirmed based on final formulation, packaging and storage conditions.",
    privateLabel: "Available. Custom packaging and private label formats can be developed according to buyer requirements.",
    bulkSupply: "Available for snack brands, distributors, food-service buyers and international retail programs.",
    exportMarkets: "International markets. Destination-specific requirements can be discussed during quotation.",
    sampleAvailability: "Samples available on request. Mint masala flavour samples can be discussed based on buyer requirements.",
    processingSteps: ["Grade selection", "Controlled roasting", "Mint masala seasoning application", "Quality inspection", "Final packaging and export preparation"],
    order: 7,
  },
  {
    index: "08",
    slug: "bulk-makhana",
    name: "Bulk Makhana",
    image: "/images/product-bulk.webp",
    copy: "Makhana supplied in export volumes for importers, distributors, manufacturers and businesses with large-volume requirements.",
    meta: ["Bulk Supply", "Export Volumes", "Wholesale"],
    grade: "To be confirmed",
    format: "Bulk makhana",
    application: "Wholesale, manufacturing, re-export",
    packaging: "Bulk sacks · container loads",
    tagline: "Export-Volume Supply for Importers & Distributors",
    description: "Bulk Makhana is supplied in export volumes for importers, distributors, manufacturers and businesses with large-volume requirements. Products can be supplied raw, roasted or flavoured according to required grade, size, volume and intended application, subject to final buyer specifications.",
    origin: "Mithila, Bihar, India",
    gradeSize: "Multiple grades and sizes may be available. Final grade and size specifications to be confirmed separately.",
    appearance: "Clean, graded makhana supplied in bulk format suitable for wholesale, re-export or further processing. Final appearance parameters to be confirmed.",
    moisture: "To be confirmed according to the final product specification and whether the product is supplied raw or roasted.",
    qualityParameters: [
      { label: "Product Format", value: "Raw / roasted bulk lots" },
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Container Load", value: "To be confirmed based on product format and packing" },
    ],
    packagingOptions: "Bulk sacks, heavy-duty packaging and container-load formats depending on product requirements.",
    moq: "To be confirmed based on product format, packaging and destination.",
    shelfLife: "To be confirmed based on raw material, processing status, packaging and storage conditions.",
    privateLabel: "Available where applicable for finished or processed products. Requirements can be discussed with the export team.",
    bulkSupply: "Yes. Bulk supply is a core offering for importers, distributors, manufacturers and wholesale buyers.",
    exportMarkets: "Suitable for international bulk buyers. Destination-specific compliance and documentation to be confirmed.",
    sampleAvailability: "Bulk product samples available on request, subject to product availability and shipping requirements.",
    processingSteps: ["Raw material sourcing", "Cleaning and removal of foreign material", "Size grading and sorting", "Quality inspection", "Bulk packing and container preparation"],
    order: 8,
  },
  {
    index: "09",
    slug: "private-label-makhana",
    name: "Private Label Makhana",
    image: "/images/process-pack.webp",
    copy: "Flexible private-label makhana solutions with customized packaging and product formats tailored to your brand requirements.",
    meta: ["Private Label", "Custom Packaging", "Export Supply"],
    grade: "To be confirmed",
    format: "Customized product format",
    application: "Private label, retail, international brands",
    packaging: "Custom retail packs · bulk formats",
    tagline: "Your Brand. Our Product. Reliable Export Support.",
    description: "Flexible private-label makhana solutions with customized product formats, flavours and packaging tailored to your brand requirements. We support retail brands, distributors and importers from product selection through to branded, export-ready packaging.",
    origin: "Mithila, Bihar, India",
    gradeSize: "To be confirmed based on selected product format (raw, roasted or flavoured) and buyer specification.",
    appearance: "Appearance depends on the selected product format and finish. Final appearance parameters to be confirmed with the buyer.",
    moisture: "To be confirmed based on the selected product format and final specification.",
    qualityParameters: [
      { label: "Product Format", value: "Customized to buyer requirement" },
      { label: "Grade", value: "To be confirmed" },
      { label: "Size", value: "To be confirmed" },
      { label: "Flavour / Seasoning", value: "To be confirmed, if applicable" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
    ],
    packagingOptions: "Custom retail packs and bulk formats produced under the buyer's own brand, artwork and pack copy.",
    moq: "To be confirmed based on product format, packaging and branding requirements.",
    shelfLife: "To be confirmed based on final product specification and packaging format.",
    privateLabel: "Core offering. Full private label program covering product, flavour, packaging and branding selection.",
    bulkSupply: "Available for retail brands, distributors and importers requiring branded bulk or retail-ready volumes.",
    exportMarkets: "International markets. Destination-specific requirements can be discussed during quotation.",
    sampleAvailability: "Samples available on request, including branded packaging mock-ups where applicable.",
    processingSteps: ["Product and flavour/grade selection", "Packaging format selection", "Label and branding application", "Production and packing", "Export preparation and dispatch"],
    order: 9,
  },
  {
    index: "10",
    slug: "makhana-powder",
    name: "Makhana Powder",
    image: "/images/makhana-powder.jpeg",
    copy: "Makhana powder for food manufacturers, wellness brands and other applications, subject to final product specifications and confirmation.",
    meta: ["Powder", "Food Ingredient", "TBC"],
    grade: "To be confirmed",
    format: "Makhana powder",
    application: "Food manufacturing, ingredient use",
    packaging: "Bulk sacks · custom formats",
    tagline: "Milled Fox Nut Powder for Food & Wellness Applications",
    description: "Makhana powder is supplied for food manufacturers, wellness brands and other applications, subject to final product specifications and confirmation. It is produced by milling graded makhana under hygienic conditions to a consistent particle size.",
    origin: "Mithila, Bihar, India",
    gradeSize: "To be confirmed — final particle size and grade specifications will be provided separately.",
    appearance: "Fine, off-white to ivory powder with a clean, consistent texture. Final appearance parameters to be confirmed.",
    moisture: "To be confirmed — final moisture specification will be provided separately.",
    qualityParameters: [
      { label: "Particle Size", value: "To be confirmed" },
      { label: "Purity", value: "To be confirmed" },
      { label: "Moisture", value: "To be confirmed" },
      { label: "Food Safety Parameters", value: "To be confirmed" },
      { label: "Packaging Format", value: "To be confirmed" },
    ],
    packagingOptions: "Bulk sacks and custom packaging formats available. Final pack sizes, materials and specifications to be confirmed.",
    moq: "To be confirmed based on product, packaging and destination market.",
    shelfLife: "To be confirmed based on final product specification and packaging format.",
    privateLabel: "Available for food and wellness brands. Requirements can be discussed with the export team.",
    bulkSupply: "Available for food manufacturers, wellness brands and ingredient buyers requiring bulk volumes.",
    exportMarkets: "International markets. Specific destination markets and export suitability to be confirmed based on buyer requirements.",
    sampleAvailability: "Samples available on request, subject to product and destination requirements.",
    processingSteps: ["Raw seed sourcing", "Roasting and processing", "Milling and grinding", "Quality inspection", "Final packing and export preparation"],
    order: 10,
  },
];

// ─── Hero Stories ─────────────────────────────────────────────────────────────
const HERO_SEED = [
  {
    id: "makhana",
    number: "01",
    label: "Premium Makhana",
    heading: ["Premium Makhana,", "Sourced from India."],
    description: "Premium Indian makhana and fox nuts, carefully sourced for quality, consistency, and international export markets.",
    image: "/images/hero-makhana-2.webp",
    mobileImage: "/images/makhana-hero.webp",
    alt: "Premium Indian makhana sourced from Bihar",
    ctaLabel: "Enquire Now",
    ctaHref: "/contact?product=Premium+Makhana",
    order: 1,
  },
  {
    id: "guar-gum",
    number: "02",
    label: "Food Grade Guar Gum",
    heading: ["Food Grade Guar Gum,", "Built for Global Supply."],
    description: "Food grade guar gum powder for international buyers — a reliable guar gum supplier from India with consistent quality and dependable bulk supply.",
    image: "/images/gaur-gum.webp",
    mobileImage: "/images/gaur-gum-mobile.webp",
    alt: "Food grade guar gum for international supply",
    ctaLabel: "Learn More",
    ctaHref: "/guar-gum",
    order: 2,
  },
  {
    id: "bulk-supply",
    number: "03",
    label: "Bulk Supply",
    heading: ["Reliable Bulk Supply,", "Built for Growing Markets."],
    description: "Dependable bulk makhana supply for importers, distributors, and businesses with large-volume requirements across global markets.",
    image: "/images/bulk-supply.webp",
    alt: "Bulk supply of Indian agricultural products",
    ctaLabel: "View Products",
    ctaHref: "/products",
    order: 3,
  },
  {
    id: "private-label",
    number: "04",
    label: "Private Label",
    heading: ["Private Label Solutions,", "Tailored to Your Brand."],
    description: "Private label makhana and flexible branding solutions for businesses bringing quality Indian food ingredients to their markets.",
    image: "/images/process-pack.webp",
    alt: "Private label food products prepared for export",
    ctaLabel: "Enquire Now",
    ctaHref: "/contact?product=Private+Label+Makhana",
    order: 4,
  },
  {
    id: "global-export",
    number: "05",
    label: "Global Export",
    heading: ["From India,", "To Global Markets."],
    description: "An agricultural products exporter from India, connecting trusted sourcing with international markets through professional export support.",
    image: "/images/global-export.webp",
    alt: "Global export from India",
    ctaLabel: "Our Process",
    ctaHref: "/our-process",
    order: 5,
  },
];

// ─── Process Steps ────────────────────────────────────────────────────────────
const PROCESS_STEPS_SEED = [
  { num: "01", label: "Requirement", heading: "Understanding buyer requirements", copy: "We begin by understanding the buyer's product requirements, specifications, packaging preferences, quantity and destination market.", image: "/images/requirement.webp", order: 1 },
  { num: "02", label: "Source", heading: "Product sourcing from India", copy: "Products are sourced through our trusted supply network according to the buyer's requirements, product specifications and required volumes.", image: "/images/source.webp", order: 2 },
  { num: "03", label: "Quality", heading: "Quality checked before dispatch", copy: "Product quality is reviewed against the required specifications before moving forward to packing and export preparation.", image: "/images/quality-check.webp", order: 3 },
  { num: "04", label: "Pack", heading: "Packed for the global journey", copy: "Products are prepared in suitable food-grade, bulk or customized packaging formats based on buyer requirements and destination needs.", image: "/images/bulk-supply.webp", order: 4 },
  { num: "05", label: "Documentation", heading: "Export documentation prepared", copy: "Required commercial, product and export documentation is coordinated to support a smooth international shipment process.", image: "/images/export-documentation.webp", order: 5 },
  { num: "06", label: "Logistics", heading: "Coordinated from origin to destination", copy: "Shipping and logistics are coordinated according to the shipment requirements, destination and agreed delivery terms.", image: "/images/logistics.webp", order: 6 },
  { num: "07", label: "Dispatch", heading: "Exported to global markets", copy: "Once everything is ready, the shipment is dispatched and moves from India to the buyer's destination market.", image: "/images/global-export.webp", order: 7 },
];

// ─── Quality Points ───────────────────────────────────────────────────────────
const QUALITY_POINTS_SEED = [
  { title: "Size & colour consistency", copy: "Every batch is graded so puffs arrive uniform in size and a clean, natural ivory — shipment after shipment.", order: 1 },
  { title: "Moisture-controlled packing", copy: "Barrier packaging protects crunch and shelf life through long-haul export and varied climates.", order: 2 },
  { title: "Food-safety compliant", copy: "Processed to hygiene and documentation standards expected by international buyers and retailers.", order: 3 },
  { title: "Full batch traceability", copy: "From harvest pond to pallet, each lot can be traced back to its origin and processing run.", order: 4 },
];

// ─── Markets ──────────────────────────────────────────────────────────────────
const MARKETS_SEED = [
  { marketId: "europe", name: "Europe", x: 512, y: 158, info: "Retail and wholesale distribution across European markets, with documentation aligned to import requirements.", order: 1 },
  { marketId: "middle-east", name: "Middle East", x: 585, y: 250, info: "Bulk and retail supply for distributors and food brands serving the Gulf and wider Middle East region.", order: 2 },
  { marketId: "north-america", name: "North America", x: 190, y: 205, info: "Export-ready formats for importers, snack brands and health-food retailers across North America.", order: 3 },
  { marketId: "southeast-asia", name: "Southeast Asia", x: 792, y: 300, info: "Consistent supply to distributors and private-label partners across Southeast Asian markets.", order: 4 },
  { marketId: "oceania", name: "Oceania", x: 852, y: 402, info: "Growing demand served through established export channels to Australia and New Zealand.", order: 5 },
];

// ─── Services ─────────────────────────────────────────────────────────────────
const SERVICES_SEED = [
  { num: "01", title: "Sourcing", copy: "Direct relationships with farming clusters in Bihar's makhana belt — traceable origin, seasonal planning and reliable raw material supply.", detail: "We work at the wetlands, not just the warehouse.", order: 1 },
  { num: "02", title: "Quality & Grading", copy: "Size, colour and moisture grading applied at every stage. Export benchmarks maintained shipment after shipment.", detail: "Uniform lots, documented standards.", order: 2 },
  { num: "03", title: "Processing", copy: "Controlled roasting and puffing with capacity for plain, flavoured and semi-processed formats.", detail: "From raw seed to finished puff.", order: 3 },
  { num: "04", title: "Private Label", copy: "Custom specifications, blends and packaging developed for brands building their own makhana range.", detail: "Your brand, our production discipline.", order: 4 },
  { num: "05", title: "Packaging", copy: "Retail-ready packs, bulk sacks and moisture-barrier formats designed for long-haul export integrity.", detail: "Formats built for the journey.", order: 5 },
  { num: "06", title: "Export & Logistics", copy: "Documentation, compliance paperwork and end-to-end logistics coordination for international buyers.", detail: "From pallet to port to destination.", order: 6 },
];

// ─── Buyer Expectations ───────────────────────────────────────────────────────
const BUYER_EXPECTATIONS_SEED = [
  { title: "Consistent supply", copy: "Seasonal planning and processing capacity aligned to recurring buyer requirements.", order: 1 },
  { title: "Export-ready packaging", copy: "Moisture-protected formats designed for long-haul shipping and varied climates.", order: 2 },
  { title: "Reliable documentation", copy: "Compliance paperwork and specifications prepared for international import requirements.", order: 3 },
  { title: "Quality consistency", copy: "Graded lots that meet the same benchmark — shipment after shipment.", order: 4 },
  { title: "Long-term partnership", copy: "Responsive communication and supply relationships built to last beyond a single order.", order: 5 },
];

// ─── Intro Facts ──────────────────────────────────────────────────────────────
const INTRO_FACTS_SEED = [
  { value: "12+", label: "Global markets served", order: 1 },
  { value: "100%", label: "Traceable sourcing", order: 2 },
  { value: "24T", label: "Monthly export capacity", order: 3 },
];

// ─── Site Config ──────────────────────────────────────────────────────────────
const SITE_CONFIG_SEED = [
  { key: "origin", value: { x: 662, y: 262, label: "India" } },
  {
    key: "contact",
    value: {
      companyName: "VIDEHA OVERSEAS PRIVATE LIMITED",
      brandName: "Videha",
      tagline: "Exporter of Premium Agricultural & Food Products",
      email: "info@videhaoverseas.com",
      phone: "+919373923799",
      phoneDisplay: "+91 93739 23799",
      addressLines: [
        "Flat No. 4, B Wing, Samruddhi Enclave,",
        "Kedgaon Chufula Road, Bori Paradhi,",
        "Pune, Maharashtra – 412203",
      ],
      social: {
        facebook: "https://www.facebook.com/share/1Yta2hcPKY/?mibextid=wwXIfr",
        instagram: "https://www.instagram.com/videhaoverseas/",
        linkedin: "",
        whatsapp: "919373923799",
      },
      copyrightTagline: "Indian Origin · Global Reach",
    },
  },
  {
    key: "registrations",
    value: {
      disclaimer:
        "We do not display product or system certifications (such as ISO, HACCP, Organic, Halal, Kosher, or US FDA registration) unless a valid, current certificate has been confirmed and supplied by Videha Overseas.",
      items: [
        { id: "iec", label: "IEC (Import Export Code)", shortLabel: "IEC", value: "AAMCV3205B" },
        { id: "gst", label: "GST Registration", shortLabel: "GST", value: "27AAMCV3205B1ZM" },
        { id: "fssai", label: "FSSAI License", shortLabel: "FSSAI", value: "11526996000869" },
        { id: "apeda-rcmc", label: "APEDA / RCMC", shortLabel: "APEDA / RCMC", value: "RCMC/APEDA/33029/2026-2027" },
      ],
    },
  },
  {
    key: "brochure",
    value: {
      enabled: true,
      label: "Download Brochure",
      url: "/brochure/VIDEHA-OVERSEAS.pdf",
      fileName: "VIDEHA-OVERSEAS.pdf",
    },
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log("Connected. Starting seed...");

  // Clear collections
  await Promise.all([
    Product.deleteMany({}),
    HeroStory.deleteMany({}),
    ProcessStep.deleteMany({}),
    QualityPoint.deleteMany({}),
    Market.deleteMany({}),
    Service.deleteMany({}),
    BuyerExpectation.deleteMany({}),
    IntroFact.deleteMany({}),
    SiteConfig.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Insert all
  await Product.insertMany(PRODUCTS_SEED);
  console.log(`✓ Seeded ${PRODUCTS_SEED.length} products`);

  await HeroStory.insertMany(HERO_SEED);
  console.log(`✓ Seeded ${HERO_SEED.length} hero stories`);

  await ProcessStep.insertMany(PROCESS_STEPS_SEED);
  console.log(`✓ Seeded ${PROCESS_STEPS_SEED.length} process steps`);

  await QualityPoint.insertMany(QUALITY_POINTS_SEED);
  console.log(`✓ Seeded ${QUALITY_POINTS_SEED.length} quality points`);

  await Market.insertMany(MARKETS_SEED);
  console.log(`✓ Seeded ${MARKETS_SEED.length} markets`);

  await Service.insertMany(SERVICES_SEED);
  console.log(`✓ Seeded ${SERVICES_SEED.length} services`);

  await BuyerExpectation.insertMany(BUYER_EXPECTATIONS_SEED);
  console.log(`✓ Seeded ${BUYER_EXPECTATIONS_SEED.length} buyer expectations`);

  await IntroFact.insertMany(INTRO_FACTS_SEED);
  console.log(`✓ Seeded ${INTRO_FACTS_SEED.length} intro facts`);

  await SiteConfig.insertMany(SITE_CONFIG_SEED);
  console.log(`✓ Seeded ${SITE_CONFIG_SEED.length} site config entries`);

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
