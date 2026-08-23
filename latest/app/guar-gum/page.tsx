import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  Beaker,
  Truck,
  Layers,
  CheckCircle2,
  Package,
  Boxes,
  Settings2,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Food Grade Guar Gum Powder (E412) — Videha Overseas",
  description:
    "Technical B2B specification page for Food Grade Guar Gum Powder. Origin, viscosity grades, mesh size, microbiological limits, and export packaging.",
};

const SPECIFICATIONS = [
  {
    group: "Identification",
    items: [
      { label: "Product Name", value: "Food Grade Guar Gum Powder" },
      { label: "E Number", value: "E412" },
      { label: "CAS Number", value: "9000-30-0" },
      { label: "HS Code", value: "1302.32.30" },
    ],
  },
  {
    group: "Physical & Chemical Parameters",
    items: [
      { label: "Origin", value: "Rajasthan / Haryana, India" },
      {
        label: "Appearance",
        value: "Creamish-white, free-flowing, fine powder",
      },
      {
        label: "Mesh Size",
        value: "Min. 92% passing through 200 Mesh (or custom calibrated mesh)",
      },
      {
        label: "Viscosity",
        value:
          "3,500 cps to 5,500 cps (1% cold solution, Brookfield viscometer at 25°C, 20 RPM after 2 hours)",
      },
      { label: "Moisture", value: "Max. 12.0% (typically 8.0% - 11.5%)" },
      { label: "pH", value: "5.5 – 7.0 (1% aqueous solution)" },
      { label: "Ash (Total)", value: "Max. 1.0%" },
      { label: "Acid Insoluble Ash", value: "Max. 0.5%" },
      { label: "Protein", value: "Max. 4.5% - 5.0% (nitrogen content)" },
    ],
  },
  {
    group: "Microbiological Limits",
    items: [
      { label: "Total Plate Count", value: "Max. 5,000 CFU/g" },
      { label: "Yeast & Mold", value: "Max. 500 CFU/g" },
      { label: "E. coli", value: "Negative in 5g" },
      { label: "Salmonella", value: "Negative in 25g" },
      { label: "Coliforms", value: "Negative in 1g" },
    ],
  },
  {
    group: "Commercial & Logistical Terms",
    items: [
      {
        label: "Shelf Life",
        value:
          "24 months from manufacturing date when stored in clean, cool, and dry warehouses",
      },
      {
        label: "Packaging",
        value:
          "25 kg multi-wall kraft paper bags with inner polyethylene liner; jumbo FIBC bags (500kg / 1,000kg) available upon request",
      },
      {
        label: "Minimum Order (MOQ)",
        value:
          "1 x 20ft FCL (18-20 Metric Tons palletized, 19-21 MT loose loaded)",
      },
      {
        label: "Loading Quantity",
        value:
          "Approx. 18-20 MT per 20ft FCL with shrink-wrapped ISPM-15 wooden pallets",
      },
      {
        label: "COA Availability",
        value:
          "Batch-specific Certificate of Analysis (COA) issued by factory QA or independent ISO/IEC 17025 accredited laboratory with each consignment",
      },
    ],
  },
];

const APPLICATIONS = [
  {
    title: "Dairy Products",
    function: "Stabilization & Prevention of Syneresis",
    copy: "Improves viscosity, body, and mouthfeel in yogurts, sour creams, and cheese spreads. Binds free water to prevent weeping and phase separation during storage.",
  },
  {
    title: "Ice Cream",
    function: "Ice Crystal Growth Retardation",
    copy: "Acts as a primary stabilizer by slowing down the migration of water molecules. Promotes small ice crystal growth, resulting in a smooth, creamy texture and controlled meltdown.",
  },
  {
    title: "Bakery",
    function: "Moisture Retention & Dough Conditioning",
    copy: "Improves water absorption, enhances dough yield, and retains softness. Particularly critical in gluten-free bakery formulations to simulate gluten structure and extend shelf-life.",
  },
  {
    title: "Sauces & Dressings",
    function: "Viscosity Control & Emulsification",
    copy: "Stabilizes oil-in-water emulsions in salad dressings, mayonnaises, and ketchups. Thickens without masking delicate flavours, providing excellent stability across a wide temperature range.",
  },
  {
    title: "Beverages",
    function: "Suspension & Mouthfeel Enhancement",
    copy: "Used in plant-based milks, diet drinks, and juices to suspend insoluble particles and cocoa powders. Imparts clean mouthfeel and uniform density without adding calories.",
  },
  {
    title: "Processed Foods",
    function: "Water Binding & Heat Stability",
    copy: "Controls viscosity and prevents oil separation in canned soups, gravies, and instant meals. Maintains structural integrity and texture through retort heating and freeze-thaw cycles.",
  },
  {
    title: "Food Manufacturing",
    function: "Clean-Label Binding & Gelling",
    copy: "Functions as a versatile hydrocolloid for thickening, binding, and gelling in vegan alternatives, sausage binders, and confectionery pastes, serving as a reliable dietary fibre source.",
  },
];

const PACKAGING_OPTIONS = [
  {
    icon: Boxes,
    title: "Standard Industrial / Food Grade Bags",
    copy: "25 kg multi-wall kraft paper bags with an inner polyethylene liner for standard export shipments, plus jumbo FIBC bags (500kg / 1,000kg) for bulk industrial buyers.",
  },
  {
    icon: Settings2,
    title: "Customized Packaging",
    copy: "Bag sizes, materials, labelling, and palletization adapted to buyer specifications, destination requirements, and handling conditions.",
  },
];

export default function GuarGumPage() {
  const getContactLink = (type: string) => {
    let subject = "";
    let message = "";

    switch (type) {
      case "spec":
        subject = "Request Technical Specification (E412)";
        message =
          "Hello, we are interested in obtaining the detailed Technical Specification sheet and product data sheet for Food Grade Guar Gum Powder (E412). Please share the document with us.";
        break;
      case "coa":
        subject = "Request Certificate of Analysis (COA) - Guar Gum";
        message =
          "Hello, we would like to request a representative Certificate of Analysis (COA) for Food Grade Guar Gum Powder to review viscosity ranges, purity, and microbiological parameters.";
        break;
      case "sample":
        subject = "Request Guar Gum Sample (E412)";
        message =
          "Hello, we wish to request a sample of Food Grade Guar Gum Powder for laboratory analysis and pilot production trials. Our shipping details and carrier account information will be provided.";
        break;
      case "quote":
        subject = "Get Export Quote - Food Grade Guar Gum";
        message =
          "Hello, please provide an export quote (FOB/CIF) for Food Grade Guar Gum Powder. Our target volumes, destination port, and grade requirements are as follows:";
        break;
      case "packaging":
        subject = "Packaging Requirement Enquiry - Guar Gum";
        message =
          "Hello, we would like to discuss packaging options for Food Grade Guar Gum Powder, including bag sizes, materials, and any customization needed for our destination market.";
        break;
      default:
        subject = "Food Grade Guar Gum Enquiry";
        message =
          "Hello, we have an inquiry regarding Food Grade Guar Gum Powder.";
    }

    return `/contact?product=${encodeURIComponent("Food Grade Guar Gum")}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
  };

  return (
    <main
      className="overflow-hidden bg-background pt-12 md:pt-24 font-poppins"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* 1. HERO SECTION & TECHNICAL STATEMENT */}
      <section className="border-b border-border bg-background py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
            {/* Left: Heading & Value Proposition */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <Reveal>
                <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
                  TECHNICAL B2B FOOD INGREDIENT
                </span>

                <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
                  Food Grade <br className="hidden sm:inline" /> Guar Gum Powder
                </h1>

                <div className="mt-4 inline-flex items-center gap-2 rounded bg-secondary px-3 py-1.5 text-xs font-semibold tracking-wider text-primary max-w-fit">
                  E Number: E412
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
                  Our Food Grade Guar Gum Powder is a premium, high-purity
                  natural hydrocolloid derived from the endosperm of the guar
                  seed (*Cyamopsis tetragonoloba*). Extracted and milled under
                  strict hygienic standards, it functions as an extremely
                  efficient cold-water soluble thickening agent, binder, and
                  emulsion stabilizer.
                </p>
                <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  Tailored for demanding B2B food processing applications, it
                  guarantees viscosity stability, excellent hydration rates, and
                  strict adherence to global food safety limits (including FSSC
                  22000, Halal, and Kosher standards).
                </p>
              </Reveal>

              {/* Highlight Grid */}
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="border border-border p-4 bg-card text-center rounded-[5px]">
                  <Beaker className="mx-auto h-5 w-5 text-accent" />
                  <span className="mt-2 block text-xs font-semibold uppercase text-foreground">
                    High Viscosity
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Up to 5,500 cps
                  </span>
                </div>
                <div className="border border-border p-4 bg-card text-center rounded-[5px]">
                  <Layers className="mx-auto h-5 w-5 text-accent" />
                  <span className="mt-2 block text-xs font-semibold uppercase text-foreground">
                    Fine Mesh
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Min. 92% (200 Mesh)
                  </span>
                </div>
                <div className="border border-border p-4 bg-card text-center rounded-[5px]">
                  <ShieldCheck className="mx-auto h-5 w-5 text-accent" />
                  <span className="mt-2 block text-xs font-semibold uppercase text-foreground">
                    Traceable Origin
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Rajasthan, India
                  </span>
                </div>
                <div className="border border-border p-4 bg-card text-center rounded-[5px]">
                  <ClipboardCheck className="mx-auto h-5 w-5 text-accent" />
                  <span className="mt-2 block text-xs font-semibold uppercase text-foreground">
                    Certifiable
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Halal & Kosher compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Technical Actions B2B Hub */}
            <div className="lg:col-span-5 bg-card border border-border p-6 md:p-8 rounded-[5px] shadow-[0_14px_35px_rgba(0,0,0,0.03)] lg:sticky lg:top-28">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                EXPORT DESK ENQUIRY
              </span>

              <h3 className="mt-2 text-lg font-bold text-foreground">
                Document & Sample Requests
              </h3>

              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                As a direct supplier of Indian origin hydrocolloids, we provide
                comprehensive technical files, microbiological data, and
                container rates to qualified commercial buyers, food scientists,
                and procurement departments.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={getContactLink("spec")}
                  className="group flex items-center justify-between border border-foreground/60 bg-transparent px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Request Technical Spec
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href={getContactLink("coa")}
                  className="group flex items-center justify-between border border-foreground/60 bg-transparent px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Request Sample COA
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href={getContactLink("sample")}
                  className="group flex items-center justify-between border border-foreground/60 bg-transparent px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
                >
                  <span className="flex items-center gap-2">
                    <Beaker className="h-4 w-4" />
                    Request Laboratory Sample
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href={getContactLink("quote")}
                  className="group flex items-center justify-between bg-foreground border border-foreground px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-background transition-all duration-300 hover:bg-primary hover:border-primary"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Get Export Container Quote
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <span className="mt-5 block text-center text-[10px] leading-relaxed text-muted-foreground">
                Response within 24 business hours from our export logistics
                desk.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TECHNICAL SPECIFICATIONS TABLE */}
      <section className="py-16 md:py-24 border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-12 max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.24em] text-primary">
              CERTIFIED B2B PARAMETERS
            </span>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Technical Specification Matrix
            </h2>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              These values represent our standard high-viscosity food-grade
              parameters. Batch-specific Certificates of Analysis (COAs) are
              compiled in accordance with standard test protocols and dispatched
              with each batch.
            </p>
          </div>

          <div className="border border-border bg-background shadow-xs overflow-hidden rounded-[5px]">
            {SPECIFICATIONS.map((specGroup, groupIdx) => (
              <div
                key={specGroup.group}
                className={`${groupIdx > 0 ? "border-t-2 border-border" : ""}`}
              >
                <div className="bg-secondary/40 px-6 py-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    {specGroup.group}
                  </h3>
                </div>

                <div className="divide-y divide-border">
                  {specGroup.items.map((spec) => (
                    <div
                      key={spec.label}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-6 py-4.5 items-baseline"
                    >
                      <span className="font-medium text-xs md:text-sm uppercase tracking-wider text-foreground">
                        {spec.label}
                      </span>
                      <span className="sm:col-span-2 text-sm text-muted-foreground">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. APPLICATIONS MATRIX */}
      <section className="py-16 md:py-24 border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-14 max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
              INDUSTRIAL HYDROCOLLOID FUNCTIONALITY
            </span>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Targeted Food Sector Applications
            </h2>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Due to its high concentration of galactomannan soluble dietary
              fibre, Guar Gum Powder E412 exhibits excellent synergistic
              behavior with other hydrocolloids (like Xanthan Gum and
              Carrageenan), offering tailored texture optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {APPLICATIONS.map((app, idx) => (
              <div
                key={app.title}
                className="border border-border p-6 bg-card hover:bg-secondary/10 hover:shadow-md transition-all duration-300 flex flex-col justify-between rounded-[5px]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-accent bg-secondary px-2.5 py-1 rounded">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">
                      {app.title}
                    </h3>
                  </div>

                  <span className="mt-4 block text-[11px] uppercase tracking-wider text-primary font-semibold">
                    {app.function}
                  </span>

                  <p className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {app.copy}
                  </p>
                </div>

                <div className="mt-6 border-t border-border/60 pt-4">
                  <Link
                    href={
                      getContactLink("sample") +
                      `&message=${encodeURIComponent(`Hello, we would like to request a sample of Food Grade Guar Gum specifically for testing in our ${app.title} application.`)}`
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-primary transition-colors"
                  >
                    Request application sample
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. COMPLIANCE & EXIM RELIABILITY */}
      <section className="py-16 bg-[#f8f6f0] border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-primary">
                QUALITY MANAGEMENT & HACCP
              </span>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-foreground">
                Rigorous Sourcing & Traceability Standards
              </h2>
              <p className="mt-4 text-xs md:text-sm leading-relaxed text-muted-foreground">
                At Videha Overseas, we guarantee high-grade raw material
                sourcing. Every lot of guar endosperm splits undergoes
                multi-stage clean-air separation, high-speed pulverization, and
                sterilization to keep moisture levels and microbial counts
                strictly below regulatory limits.
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-muted-foreground">
                    **Certified Facilities**: Processed in sites operating under
                    FSSC 22000, ISO 9001:2015, and HACCP standards.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-muted-foreground">
                    **Full Traceability**: Complete lot traceability from
                    processing plant splits reception back to agricultural mandi
                    levels.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-muted-foreground">
                    **Strict Metal Detection**: Multi-stage magnetic traps and
                    physical filters prevent any metallic or foreign physical
                    contamination.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-background border border-border p-6 md:p-8 rounded-[5px] flex flex-col justify-center">
              <h3 className="text-lg font-bold text-foreground">
                Direct Export Containers
              </h3>
              <p className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
                Guar Gum is packed in hermetically sealed multi-wall kraft paper
                bags to guard against moisture ingress during long-haul sea
                transit. We handle logistics directly to major destinations
                globally, coordinating phytosanitary clearances, export customs,
                and port delivery.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    25 kg Paper Bags
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    Independent Lab Audited
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PACKAGING SOLUTIONS */}
      <section className="py-16 md:py-24 border-b border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-12 max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
              EXPORT PACKAGING CAPABILITIES
            </span>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Packaging Solutions
            </h2>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Food Grade Guar Gum Powder is offered in standard industrial and
              food-grade formats, with customization available to match buyer
              specifications. Final packaging sizes and technical specifications
              will be shared and confirmed prior to order production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PACKAGING_OPTIONS.map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="border border-border p-6 md:p-8 bg-card rounded-[5px] flex flex-col gap-4"
              >
                <Icon className="h-6 w-6 text-accent" />
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {copy}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href={getContactLink("packaging")}
              className="group inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-primary transition-colors"
            >
              Discuss Packaging Requirement
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. REQUEST QUOTE CTA PANEL */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-border bg-[#514536] text-white p-8 md:p-12 rounded-[5px]">
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                B2B TRADE & PARTNERSHIPS
              </span>

              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-white">
                Partner with Videha Overseas
              </h2>

              <p className="mt-3 max-w-2xl text-xs md:text-sm leading-relaxed text-white/70">
                Contact our hydrocolloid trade desk for samples, custom
                viscosities, bulk contracts, and current container freight
                pricing to your destination port.
              </p>
            </div>

            <Link
              href={getContactLink("quote")}
              className="group inline-flex shrink-0 items-center gap-3 bg-white px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-black transition-colors hover:bg-secondary"
            >
              Get Export Quote
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
