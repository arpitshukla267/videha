export const PRODUCTS = [
  {
    index: "01",
    name: "Raw / Plain Makhana",
    image: "/images/product-classic.webp",
    copy: "Clean, plain makhana sourced from India and supplied in carefully graded formats for bulk buyers, food businesses and further processing.",
    meta: ["Raw / Plain", "Bulk Supply", "Size Graded"],
    grade: "To be confirmed",
    format: "Raw / plain",
    application: "Bulk supply, processing, wholesale",
    packaging: "Bulk sacks · custom formats",
  },

  {
    index: "02",
    name: "Premium Makhana",
    image: "/images/premium-makhana.jpeg",
    copy: "Premium-grade Indian makhana selected for consistent quality, clean appearance and reliable supply across international markets.",
    meta: ["Premium Grade", "Export Supply", "Selected Quality"],
    grade: "To be confirmed",
    format: "Premium makhana",
    application: "Retail, wholesale, private label",
    packaging: "Retail packs · bulk sacks · custom formats",
  },

  {
    index: "03",
    name: "Jumbo Makhana",
    image: "/images/jumbo.jpeg",
    copy: "Large-size makhana selected for buyers seeking premium presentation, uniform grading and high-quality export supply.",
    meta: ["Jumbo Size", "Premium Grade", "Export Supply"],
    grade: "To be confirmed",
    format: "Jumbo size",
    application: "Premium retail, wholesale, private label",
    packaging: "Retail packs · bulk sacks · custom formats",
  },

  {
    index: "04",
    name: "Roasted Makhana",
    image: "/images/classic-roasted-salt.jpeg",
    copy: "Carefully roasted makhana with a light, crisp texture and clean flavour, suitable for retail, food brands and private-label programs.",
    meta: ["Roasted", "Snack-Ready", "Private Label"],
    grade: "To be confirmed",
    format: "Plain roasted",
    application: "Retail, private label, food service",
    packaging: "Retail packs · bulk sacks · custom formats",
  },

  {
    index: "05",
    name: "Flavoured Makhana",
    image: "/images/flavoured.jpeg",
    copy: "Seasoned makhana developed for modern snacking, with flexible flavour and packaging options for international markets.",
    meta: ["Seasoned", "Snack-Ready", "Custom Blends"],
    grade: "To be confirmed",
    format: "Seasoned & flavoured",
    application: "Snack retail, food service, private label",
    packaging: "Retail-ready · private label options",
  },

  {
    index: "06",
    name: "Bulk Makhana",
    image: "/images/product-bulk.webp",
    copy: "Makhana supplied in export volumes for importers, distributors, manufacturers and businesses with large-volume requirements.",
    meta: ["Bulk Supply", "Export Volumes", "Wholesale"],
    grade: "To be confirmed",
    format: "Bulk makhana",
    application: "Wholesale, manufacturing, re-export",
    packaging: "Bulk sacks · container loads",
  },

  {
    index: "07",
    name: "Private Label Makhana",
    image: "/images/process-pack.webp",
    copy: "Flexible private-label makhana solutions with customized packaging and product formats tailored to your brand requirements.",
    meta: ["Private Label", "Custom Packaging", "Export Supply"],
    grade: "To be confirmed",
    format: "Customized product format",
    application: "Private label, retail, international brands",
    packaging: "Custom retail packs · bulk formats",
  },

  {
    index: "08",
    name: "Makhana Powder",
    image: "/images/product-powder.webp",
    copy: "Makhana powder for food manufacturers, wellness brands and other applications, subject to final product specifications and confirmation.",
    meta: ["Powder", "Food Ingredient", "TBC"],
    grade: "To be confirmed",
    format: "Makhana powder",
    application: "Food manufacturing, ingredient use",
    packaging: "Bulk sacks · custom formats",
  },
] as const;

// export const PROCESS_STEPS = [
//   {
//     num: "01",
//     label: "Source",
//     heading: "From the wetlands of Bihar",
//     copy: "Every season begins in the ponds of eastern India, where makhana is harvested by hand from lotus. We partner directly with farming communities at origin.",
//     image: "/images/process-source.webp",
//   },
//   {
//     num: "02",
//     label: "Select",
//     heading: "Graded seed by seed",
//     copy: "Raw seeds are cleaned, sun-dried and sorted by size and maturity. Only the grades that meet our export benchmark move forward.",
//     image: "/images/process-select.webp",
//   },
//   {
//     num: "03",
//     label: "Process",
//     heading: "Popped to perfection",
//     copy: "Controlled roasting pops each seed into a light, uniform puff — preserving the natural nutrition and delicate crunch makhana is prized for.",
//     image: "/images/process-process.webp",
//   },
//   {
//     num: "04",
//     label: "Quality",
//     heading: "Checked at every stage",
//     copy: "Moisture, size, colour and food-safety checks are applied before any batch is approved — ensuring consistency that holds across borders.",
//     image: "/images/quality-macro.webp",
//   },
//   {
//     num: "05",
//     label: "Pack",
//     heading: "Sealed for the journey",
//     copy: "Finished makhana is packed in food-grade, moisture-protected formats — retail, private label or bulk — built to hold quality across continents.",
//     image: "/images/process-pack.webp",
//   },
//   {
//     num: "06",
//     label: "Export",
//     heading: "Delivered to the world",
//     copy: "Documentation, compliance and logistics are handled end to end, moving consistent shipments to buyers across global markets.",
//     image: "/images/process-export.webp",
//   },
// ] as const;

export const PROCESS_STEPS = [
  {
    num: "01",
    label: "Requirement",
    heading: "Understanding buyer requirements",
    copy: "We begin by understanding the buyer's product requirements, specifications, packaging preferences, quantity and destination market.",
    image: "/images/requirement.webp",
  },
  {
    num: "02",
    label: "Source",
    heading: "Product sourcing from India",
    copy: "Products are sourced through our trusted supply network according to the buyer's requirements, product specifications and required volumes.",
    image: "/images/source.webp",
  },
  {
    num: "03",
    label: "Quality",
    heading: "Quality checked before dispatch",
    copy: "Product quality is reviewed against the required specifications before moving forward to packing and export preparation.",
    image: "/images/quality-check.webp",
  },
  {
    num: "04",
    label: "Pack",
    heading: "Packed for the global journey",
    copy: "Products are prepared in suitable food-grade, bulk or customized packaging formats based on buyer requirements and destination needs.",
    image: "/images/bulk-supply.webp",
  },
  {
    num: "05",
    label: "Documentation",
    heading: "Export documentation prepared",
    copy: "Required commercial, product and export documentation is coordinated to support a smooth international shipment process.",
    image: "/images/export-documentation.webp",
  },
  {
    num: "06",
    label: "Logistics",
    heading: "Coordinated from origin to destination",
    copy: "Shipping and logistics are coordinated according to the shipment requirements, destination and agreed delivery terms.",
    image: "/images/logistics.webp",
  },
  {
    num: "07",
    label: "Dispatch",
    heading: "Exported to global markets",
    copy: "Once everything is ready, the shipment is dispatched and moves from India to the buyer's destination market.",
    image: "/images/global-export.webp",
  },
] as const;

export const QUALITY_POINTS = [
  {
    title: "Size & colour consistency",
    copy: "Every batch is graded so puffs arrive uniform in size and a clean, natural ivory — shipment after shipment.",
  },
  {
    title: "Moisture-controlled packing",
    copy: "Barrier packaging protects crunch and shelf life through long-haul export and varied climates.",
  },
  {
    title: "Food-safety compliant",
    copy: "Processed to hygiene and documentation standards expected by international buyers and retailers.",
  },
  {
    title: "Full batch traceability",
    copy: "From harvest pond to pallet, each lot can be traced back to its origin and processing run.",
  },
] as const;

export const MARKETS = [
  {
    id: "europe",
    name: "Europe",
    x: 512,
    y: 158,
    info: "Retail and wholesale distribution across European markets, with documentation aligned to import requirements.",
  },
  {
    id: "middle-east",
    name: "Middle East",
    x: 585,
    y: 250,
    info: "Bulk and retail supply for distributors and food brands serving the Gulf and wider Middle East region.",
  },
  {
    id: "north-america",
    name: "North America",
    x: 190,
    y: 205,
    info: "Export-ready formats for importers, snack brands and health-food retailers across North America.",
  },
  {
    id: "southeast-asia",
    name: "Southeast Asia",
    x: 792,
    y: 300,
    info: "Consistent supply to distributors and private-label partners across Southeast Asian markets.",
  },
  {
    id: "oceania",
    name: "Oceania",
    x: 852,
    y: 402,
    info: "Growing demand served through established export channels to Australia and New Zealand.",
  },
] as const;

export const ORIGIN = { x: 662, y: 262, label: "India" };

export const SERVICES = [
  {
    num: "01",
    title: "Sourcing",
    copy: "Direct relationships with farming clusters in Bihar's makhana belt — traceable origin, seasonal planning and reliable raw material supply.",
    detail: "We work at the wetlands, not just the warehouse.",
  },
  {
    num: "02",
    title: "Quality & Grading",
    copy: "Size, colour and moisture grading applied at every stage. Export benchmarks maintained shipment after shipment.",
    detail: "Uniform lots, documented standards.",
  },
  {
    num: "03",
    title: "Processing",
    copy: "Controlled roasting and puffing with capacity for plain, flavoured and semi-processed formats.",
    detail: "From raw seed to finished puff.",
  },
  {
    num: "04",
    title: "Private Label",
    copy: "Custom specifications, blends and packaging developed for brands building their own makhana range.",
    detail: "Your brand, our production discipline.",
  },
  {
    num: "05",
    title: "Packaging",
    copy: "Retail-ready packs, bulk sacks and moisture-barrier formats designed for long-haul export integrity.",
    detail: "Formats built for the journey.",
  },
  {
    num: "06",
    title: "Export & Logistics",
    copy: "Documentation, compliance paperwork and end-to-end logistics coordination for international buyers.",
    detail: "From pallet to port to destination.",
  },
] as const;

export const BUYER_EXPECTATIONS = [
  {
    title: "Consistent supply",
    copy: "Seasonal planning and processing capacity aligned to recurring buyer requirements.",
  },
  {
    title: "Export-ready packaging",
    copy: "Moisture-protected formats designed for long-haul shipping and varied climates.",
  },
  {
    title: "Reliable documentation",
    copy: "Compliance paperwork and specifications prepared for international import requirements.",
  },
  {
    title: "Quality consistency",
    copy: "Graded lots that meet the same benchmark — shipment after shipment.",
  },
  {
    title: "Long-term partnership",
    copy: "Responsive communication and supply relationships built to last beyond a single order.",
  },
] as const;

export const INTRO_FACTS = [
  { value: "12+", label: "Global markets served" },
  { value: "100%", label: "Traceable sourcing" },
  { value: "24T", label: "Monthly export capacity" },
] as const;
