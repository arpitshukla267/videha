"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { Reveal } from "@/components/reveal"
import { SectionCta } from "@/components/section-cta"

const FIELDS = [
  { name: "name", label: "Name", type: "text", placeholder: "Your full name", required: true },
  { name: "company", label: "Company", type: "text", placeholder: "Company name", required: false },
  { name: "email", label: "Email", type: "email", placeholder: "you@company.com", required: true },
  { name: "country", label: "Country", type: "text", placeholder: "Destination market", required: true },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+1 · +44 · +971", required: false },
] as const

type ContactProps = {
  preview?: boolean
  headline?: string
  subhead?: string
}

export function Contact({
  preview = false,
  headline = "Looking for a Reliable Makhana Partner?",
  subhead = "Tell us about your requirement — volumes, markets, specifications — and our export team will respond with a tailored proposal.",
}: ContactProps) {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          
          {/* Left Column: Business Info */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <Reveal>
                <SectionLabel>Let&apos;s Connect</SectionLabel>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground text-balance md:text-5xl">
                  {headline}
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  {subhead}
                </p>
              </Reveal>
            </div>

            <div className="mt-12 pt-8 border-t border-border flex flex-col gap-6 text-xs font-mono">
              <div>
                <span className="text-muted-foreground uppercase text-[9px] block">EXPORT DIVISION EMAIL</span>
                <a href="mailto:export@videhaoverseas.com" className="text-foreground font-semibold text-sm hover:underline block mt-1">
                  export@videhaoverseas.com
                </a>
              </div>

              <div>
                <span className="text-muted-foreground uppercase text-[9px] block">TELEPHONE INQUIRIES</span>
                <span className="text-foreground font-semibold text-sm block mt-1">
                  +91 91234 56789
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground uppercase text-[9px] block">OPERATING HOURS</span>
                  <span className="text-foreground font-semibold block mt-1">
                    09:00 - 18:00 IST
                  </span>
                  <span className="text-muted-foreground block mt-0.5">Monday - Friday</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[9px] block">PROCUREMENT HUB</span>
                  <span className="text-foreground font-semibold block mt-1">
                    Mithila, Bihar
                  </span>
                  <span className="text-muted-foreground block mt-0.5">India</span>
                </div>
              </div>
            </div>

            {!preview && (
              <Reveal delay={0.15} className="mt-12 border-t border-border pt-8">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent font-semibold block">
                  EXPORT PROCESS POLICY
                </span>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground max-w-sm">
                  We respond to verified international buyer requests with standard specification sheets, container pricing locks, and courier air-dispatch sample trackers.
                </p>
              </Reveal>
            )}
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            {sent ? (
              <div className="flex h-full min-h-64 flex-col items-start justify-center border border-border bg-[#f8f6f0] p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-foreground">
                  Thank you — enquiry received.
                </h3>
                <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                  Our export desk has registered your details. An EXIM coordinator will contact you shortly with samples dispatch details.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col border border-border p-6 md:p-10 bg-background">
                <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
                  {FIELDS.map((f) => (
                    <div key={f.name} className="flex flex-col group">
                      <label
                        htmlFor={preview ? `preview-${f.name}` : f.name}
                        className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors"
                      >
                        {f.label}
                        {f.required && <span className="text-accent"> *</span>}
                      </label>
                      <input
                        id={preview ? `preview-${f.name}` : f.name}
                        name={f.name}
                        type={f.type}
                        required={f.required}
                        placeholder={f.placeholder}
                        className="mt-2 border-b border-border bg-transparent pb-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/35 focus:border-primary focus:pl-1"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col group">
                  <label
                    htmlFor={preview ? "preview-message" : "message"}
                    className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors"
                  >
                    Requirement / Message<span className="text-accent"> *</span>
                  </label>
                  <textarea
                    id={preview ? "preview-message" : "message"}
                    name="message"
                    required
                    rows={4}
                    placeholder="Product grade, monthly volume, destination port and cargo dispatch timeline..."
                    className="mt-2 resize-none border-b border-border bg-transparent pb-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/35 focus:border-primary focus:pl-1"
                  />
                </div>

                <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <button
                    type="submit"
                    className="group inline-flex w-fit items-center gap-3 bg-foreground px-8 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary cursor-pointer"
                  >
                    Send Enquiry
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <span className="text-[10px] font-mono text-muted-foreground leading-relaxed max-w-xs">
                    We treat container enquiries with strict privacy. Pricing estimates remain valid for 14 days.
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>

        {preview && (
          <div className="mt-8 md:hidden">
            <SectionCta href="/contact" label="Full enquiry page" />
          </div>
        )}
      </div>
    </section>
  )
}
