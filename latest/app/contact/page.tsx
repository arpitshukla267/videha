import type { Metadata } from "next"
import { Contact } from "@/components/contact"
import { MapPin, ShieldCheck, Mail, Phone, Calendar } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = {
  title: "Contact — Videha Overseas",
  description:
    "Contact Videha Overseas for makhana export enquiries — bulk supply, private label and international trade partnerships.",
}

const FAQ_LIST = [
  {
    q: "How is product crispness preserved during ocean transit?",
    a: "We dry all popped makhana lots below 4.5% moisture limits prior to packaging. Shipments are immediately enclosed inside nitrogen-flushed retail pouches or double-barrier bulk vacuum bags. This stops atmospheric dampness from turning the puffs soft."
  },
  {
    q: "Do you offer private label or custom seasoning services?",
    a: "Yes. We offer complete OEM private label printing and packaging. Our flavor technologists match custom spice blends (Truffle, Herbs, Salt, Peri Peri) sprayed uniformly using cold-pressed vegetable binders."
  },
  {
    q: "What export certifications are provided with the cargo?",
    a: "Every container lot comes with a batch Certificate of Analysis (COA) from an independent laboratory, Phytosanitary Certificate from the Ministry of Agriculture, FSSAI Export License, Certificate of Origin (COO), and full bills of lading."
  },
  {
    q: "What is your standard Minimum Order Quantity (MOQ)?",
    a: "Our standard export MOQ is 1 x 20ft FCL container (which fits roughly 3.5 to 4.5 Metric Tons of expanded popped makhana due to its volumetric density). LCL sample lots can be arranged for verified buyers."
  }
]

export default function ContactPage() {
  return (
    <main className="overflow-hidden bg-background pt-8 md:pt-12">
      {/* 1. Split-Panel Contact form */}
      <Contact
        headline="Let's Build Something That Travels."
        subhead="Share your target volumes, product grades, and destination ports. Our export desk will draft an EXIM specification sheet and container rates."
      />

      {/* 2. Procurement Hub & Warehouse Coordinates */}
      <section className="bg-secondary/30 border-b border-border py-16 md:py-24">
        <div className="mx-auto max-w-[95vw] md:max-w-[1400px] px-5 md:px-10">
          <div className="max-w-2xl mb-12">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              REGIONAL OPERATIONS DIRECTORY
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              Procurement & Warehousing Coordinates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-background border border-border">
              <MapPin className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-bold text-foreground">Sourcing & Sorting Depot</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Located directly at the heart of Mithila wetland belt, Bihar. Handles cooperative seed receipts, sieving, mechanical calibration, and initial sun-drying audits.
              </p>
              <span className="text-[10px] font-mono text-accent block mt-4">BIHAR, INDIA</span>
            </div>

            <div className="p-8 bg-background border border-border">
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-bold text-foreground">Processing & Export Warehouse</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Dry-kiln moisture management, batch roasting, flavoring lines, nitrogen sealing, and container stuffing. Conveniently linked to Kolkata and JNPT dispatch ports.
              </p>
              <span className="text-[10px] font-mono text-accent block mt-4">EXIM WAREHOUSE CAPACITY: 24MT/MONTH</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. B2B Sourcing FAQs */}
      <section className="py-24 md:py-32 border-t border-border bg-background">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-2xl mb-16">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">
              EXIM ADVISORY
            </span>
            <h2 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
              Sourcing & Trade FAQ Directory
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {FAQ_LIST.map((faq, idx) => (
              <div key={idx} className="flex flex-col border-t border-border/70 pt-8 first:border-t-0 md:first:border-t-0 md:pt-8">
                <span className="font-mono text-xs text-accent font-bold">FAQ 0{idx + 1}</span>
                <h3 className="text-base font-bold text-foreground mt-2">{faq.q}</h3>
                <p className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
