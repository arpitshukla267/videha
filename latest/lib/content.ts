export const PRODUCTS = [
  {
    index: "01",
    name: "Classic Roasted Makhana",
    image: "/images/product-classic.webp",
    copy: "Pure, plain-roasted fox nuts with a delicate crunch and clean flavour — the versatile foundation of the range, ideal for retail and private label.",
    meta: ["Plain Roasted", "Retail & Bulk", "Grade AAA"],
    grade: "Grade AAA",
    format: "Plain Roasted",
    application: "Retail, private label, ingredient use",
    packaging: "Retail packs · bulk sacks · custom formats",
  },
  {
    index: "02",
    name: "Flavoured Makhana",
    image: "/images/product-flavoured.webp",
    copy: "Lightly seasoned varieties developed for modern snacking — measured spice, natural ingredients and a finish tuned to international palates.",
    meta: ["Seasoned", "Snack-Ready", "Custom Blends"],
    grade: "Export Grade",
    format: "Seasoned & flavoured",
    application: "Snack retail, food service",
    packaging: "Retail-ready · private label options",
  },
  {
    index: "03",
    name: "Bulk & Raw Export",
    image: "/images/product-bulk.webp",
    copy: "Graded raw and semi-processed fox nuts supplied in export volumes, sorted by size and packed to preserve integrity across long-haul shipping.",
    meta: ["Size Graded", "Bulk Sacks", "Wholesale"],
    grade: "Size-graded lots",
    format: "Raw & semi-processed",
    application: "Wholesale, processing, re-export",
    packaging: "Bulk sacks · container loads",
  },
] as const

export const PROCESS_STEPS = [
  {
    num: "01",
    label: "Source",
    heading: "From the wetlands of Bihar",
    copy: "Every season begins in the ponds of eastern India, where makhana is harvested by hand from lotus. We partner directly with farming communities at origin.",
    image: "/images/process-source.webp",
  },
  {
    num: "02",
    label: "Select",
    heading: "Graded seed by seed",
    copy: "Raw seeds are cleaned, sun-dried and sorted by size and maturity. Only the grades that meet our export benchmark move forward.",
    image: "/images/process-select.webp",
  },
  {
    num: "03",
    label: "Process",
    heading: "Popped to perfection",
    copy: "Controlled roasting pops each seed into a light, uniform puff — preserving the natural nutrition and delicate crunch makhana is prized for.",
    image: "/images/process-process.webp",
  },
  {
    num: "04",
    label: "Quality",
    heading: "Checked at every stage",
    copy: "Moisture, size, colour and food-safety checks are applied before any batch is approved — ensuring consistency that holds across borders.",
    image: "/images/quality-macro.webp",
  },
  {
    num: "05",
    label: "Pack",
    heading: "Sealed for the journey",
    copy: "Finished makhana is packed in food-grade, moisture-protected formats — retail, private label or bulk — built to hold quality across continents.",
    image: "/images/process-pack.webp",
  },
  {
    num: "06",
    label: "Export",
    heading: "Delivered to the world",
    copy: "Documentation, compliance and logistics are handled end to end, moving consistent shipments to buyers across global markets.",
    image: "/images/process-export.webp",
  },
] as const

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
] as const

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
] as const

export const ORIGIN = { x: 662, y: 262, label: "India" }

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
] as const

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
] as const

export const INTRO_FACTS = [
  { value: "12+", label: "Global markets served" },
  { value: "100%", label: "Traceable sourcing" },
  { value: "24T", label: "Monthly export capacity" },
] as const
