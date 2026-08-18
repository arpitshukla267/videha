"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Search, X } from "lucide-react";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { SectionCta } from "@/components/section-cta";

const PRODUCTS = [
  "Classic Roasted Makhana",
  "Flavoured Makhana",
  "Bulk & Raw Export",
  "Makhana Powder",
];

const SERVICES = [
  "Private Label",
  "Custom Flavour Development",
  "Bulk Export Supply",
  "Contract Manufacturing",
  "Global Sourcing",
  "Export & Logistics",
];

const FIELDS = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Your full name",
    required: true,
  },
  {
    name: "company",
    label: "Company",
    type: "text",
    placeholder: "Company name",
    required: false,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "you@company.com",
    required: true,
  },
  {
    name: "country",
    label: "Country",
    type: "text",
    placeholder: "Destination market",
    required: true,
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    placeholder: "+1 · +44 · +971",
    required: false,
  },
  {
    name: "volume",
    label: "Expected Monthly Volume",
    type: "text",
    placeholder: "e.g. 2–5 MT / month",
    required: false,
  },
  {
    name: "port",
    label: "Destination Port / Market",
    type: "text",
    placeholder: "e.g. Dubai / Jebel Ali",
    required: false,
  },
] as const;

type ContactProps = {
  preview?: boolean;
  headline?: string;
  subhead?: string;
};

type MultiSelectProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
};

function MultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
  required = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleOption(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div ref={ref} className="relative flex flex-col">
      <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-videha-green">*</span>}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 flex min-h-[43px] w-full items-center justify-between border-b border-border bg-transparent py-2 text-left transition-colors hover:border-videha-green/50 focus:outline-none"
      >
        <span
          className={
            selected.length
              ? "text-sm text-foreground"
              : "text-sm text-muted-foreground/40"
          }
        >
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Selected chips */}
      <AnimatePresence initial={false}>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-1.5 overflow-hidden pt-2"
          >
            {selected.map((item) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-flex items-center gap-1 rounded-full bg-videha-mist px-2.5 py-1 text-[10px] font-medium text-videha-navy"
              >
                {item}

                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleOption(item);
                  }}
                />
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-xl border border-border bg-background shadow-[0_20px_50px_rgba(11,38,56,0.12)]"
          >
            {/* Search */}
            <div className="border-b border-border p-3">
              <div className="flex items-center gap-2 rounded-lg bg-videha-mist px-3">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-9 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-56 overflow-y-auto p-2">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const active = selected.includes(option);

                  return (
                    <motion.button
                      key={option}
                      type="button"
                      layout
                      onClick={() => toggleOption(option)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                        active
                          ? "bg-videha-mist text-videha-navy"
                          : "text-foreground/75 hover:bg-videha-mist/60"
                      }`}
                    >
                      <span>{option}</span>

                      <span
                        className={`h-4 w-4 shrink-0 rounded-full border transition-all duration-200 ${
                          active
                            ? "border-[#8B6547] bg-[#8B6547]"
                            : "border-[#C9C2B8] bg-transparent"
                        }`}
                      />
                    </motion.button>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No results found
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
              <span className="text-[10px] text-muted-foreground">
                {selected.length} selected
              </span>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[10px] font-semibold uppercase tracking-[0.12em] text-videha-green"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Contact({
  preview = false,
  headline = "Looking for a Reliable Makhana Partner?",
  subhead = "Tell us about your requirement — products, services, volumes, markets, specifications — and our export team will respond with a tailored proposal.",
}: ContactProps) {
  const [sent, setSent] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const enquiry = {
      name: formData.get("name"),
      company: formData.get("company"),
      email: formData.get("email"),
      country: formData.get("country"),
      phone: formData.get("phone"),
      volume: formData.get("volume"),
      port: formData.get("port"),
      products: selectedProducts,
      services: selectedServices,
      message: formData.get("message"),
    };

    console.log("ENQUIRY:", enquiry);

    setSent(true);
  }

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* LEFT */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <Reveal>
                <SectionLabel>Let&apos;s Connect</SectionLabel>
              </Reveal>

              <Reveal delay={0.05}>
                <h2 className="mt-6 text-4xl font-medium leading-[1.02] tracking-[-0.04em] text-videha-navy text-balance md:text-5xl">
                  {headline}
                </h2>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-6 max-w-md text-[15px] leading-[1.75] text-muted-foreground">
                  {subhead}
                </p>
              </Reveal>
            </div>

            <div className="mt-10 flex flex-col gap-5 border-t border-border pt-7 text-xs">
              <div>
                <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Export Division Email
                </span>

                <a
                  href="mailto:export@videhaoverseas.com"
                  className="mt-1 block text-sm font-medium text-videha-navy hover:text-videha-green"
                >
                  export@videhaoverseas.com
                </a>
              </div>

              <div>
                <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Telephone Inquiries
                </span>

                <span className="mt-1 block text-sm font-medium text-videha-navy">
                  +91 91234 56789
                </span>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Operating Hours
                  </span>

                  <span className="mt-1 block text-sm font-medium text-videha-navy">
                    09:00 - 18:00 IST
                  </span>

                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Monday - Friday
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Procurement Hub
                  </span>

                  <span className="mt-1 block text-sm font-medium text-videha-navy">
                    Mithila, Bihar
                  </span>

                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    India
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="flex min-h-[500px] flex-col justify-center border border-border bg-videha-mist p-8 md:p-10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-videha-green/10">
                    <Check className="h-5 w-5 text-videha-green" />
                  </div>

                  <h3 className="mt-6 text-2xl font-medium text-videha-navy">
                    Thank you — enquiry received.
                  </h3>

                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Our export desk has registered your requirements. An EXIM
                    coordinator will contact you shortly with the next steps.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="border border-border bg-background p-6 md:p-10"
                >
                  <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
                    {FIELDS.map((field) => (
                      <div key={field.name} className="group flex flex-col">
                        <label
                          htmlFor={
                            preview ? `preview-${field.name}` : field.name
                          }
                          className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors group-focus-within:text-videha-green"
                        >
                          {field.label}

                          {field.required && (
                            <span className="ml-1 text-videha-green">*</span>
                          )}
                        </label>

                        <input
                          id={preview ? `preview-${field.name}` : field.name}
                          name={field.name}
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder}
                          className="mt-2 border-b border-border bg-transparent pb-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/35 focus:border-videha-green focus:pl-1"
                        />
                      </div>
                    ))}

                    {/* Products */}
                    <MultiSelect
                      label="Products Required"
                      placeholder="Select products"
                      options={PRODUCTS}
                      selected={selectedProducts}
                      onChange={setSelectedProducts}
                      required
                    />

                    {/* Services */}
                    <MultiSelect
                      label="Services Required"
                      placeholder="Select services"
                      options={SERVICES}
                      selected={selectedServices}
                      onChange={setSelectedServices}
                    />
                  </div>

                  {/* Message */}
                  <div className="mt-8 flex flex-col group">
                    <label
                      htmlFor={preview ? "preview-message" : "message"}
                      className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors group-focus-within:text-videha-green"
                    >
                      Requirement / Message
                      <span className="ml-1 text-videha-green">*</span>
                    </label>

                    <textarea
                      id={preview ? "preview-message" : "message"}
                      name="message"
                      required
                      rows={4}
                      placeholder="Tell us about product grade, monthly volume, destination market, packaging, certifications or any other requirement..."
                      className="mt-2 resize-none border-b border-border bg-transparent pb-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/35 focus:border-videha-green focus:pl-1"
                    />
                  </div>

                  {/* Submit */}
                  <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      className="group inline-flex w-fit cursor-pointer items-center gap-3 bg-videha-navy px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-videha-green"
                    >
                      Send Enquiry
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    <span className="max-w-xs text-[10px] leading-relaxed text-muted-foreground">
                      Your enquiry details are handled privately and shared only
                      with our export team.
                    </span>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {preview && (
          <div className="mt-8 md:hidden">
            <SectionCta href="/contact" label="Full enquiry page" />
          </div>
        )}
      </div>
    </section>
  );
}
