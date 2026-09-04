"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Search, X } from "lucide-react";
import { SectionLabel } from "@/components/section-label";
import { Reveal } from "@/components/reveal";
import { SectionCta } from "@/components/section-cta";
import {
  CONTACT_PRODUCT_OPTIONS,
  matchProductOption,
} from "@/lib/product-options";
import { useSearchParams } from "next/navigation";
import { useSiteSettings } from "@/components/site-settings-provider";

const PRODUCTS = CONTACT_PRODUCT_OPTIONS;

const SERVICES = [
  "Private Label",
  "Custom Flavour Development",
  "Bulk Export Supply",
  "Contract Manufacturing",
  "Global Sourcing",
  "Export & Logistics",
];

function normalizeParam(value: string) {
  return value.toLowerCase().replace(/[-_]/g, " ").trim().replace(/\s+/g, " ");
}

function matchFromList(param: string, options: readonly string[]) {
  const normalized = normalizeParam(param);

  const exact = options.find((option) => normalizeParam(option) === normalized);
  if (exact) return exact;

  const candidates = options.filter((option) => {
    const label = normalizeParam(option);
    return label.includes(normalized) || normalized.includes(label);
  });

  if (candidates.length > 0) {
    return [...candidates].sort((a, b) => b.length - a.length)[0];
  }

  return param.trim();
}

const FIELDS = [
  {
    name: "name",
    label: "Full name",
    type: "text",
    placeholder: "Your full name",
    required: true,
  },
  {
    name: "company",
    label: "Company name",
    type: "text",
    placeholder: "Your company name",
    required: true,
  },
  {
    name: "email",
    label: "Business email",
    type: "email",
    placeholder: "Your business email",
    required: true,
  },
  {
    name: "phone",
    label: "WhatsApp / Phone number",
    type: "tel",
    placeholder: "Your WhatsApp / phone number",
    required: true,
  },
  {
    name: "country",
    label: "Country",
    type: "text",
    placeholder: "Your country",
    required: true,
  },
  {
    name: "grade",
    label: "Product grade / Specification",
    type: "text",
    placeholder: "Required grade or specification",
    required: false,
  },
  {
    name: "quantity",
    label: "Required quantity",
    type: "text",
    placeholder: "e.g. 1,000 kg",
    required: true,
  },
  {
    name: "monthlyRequirement",
    label: "Monthly requirement",
    type: "text",
    placeholder: "e.g. 5 MT / month",
    required: false,
  },
  {
    name: "packaging",
    label: "Packaging requirement",
    type: "text",
    placeholder: "e.g. Bulk sacks / retail packs / custom",
    required: false,
  },
  {
    name: "port",
    label: "Destination port",
    type: "text",
    placeholder: "Destination port",
    required: true,
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
  singleSelect?: boolean;
};

function MultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
  required = false,
  singleSelect = false,
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
    if (singleSelect) {
      onChange(selected.includes(option) ? [] : [option]);
      setOpen(false);
      return;
    }

    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div ref={ref} className="relative flex flex-col">
      <label className="text-xs font-medium tracking-[0.05em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-videha-green">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 flex min-h-[46px] w-full items-center justify-between border-b border-border bg-transparent py-2 text-left transition-colors hover:border-videha-green/50 focus:outline-none"
      >
        {/* FIX: text-sm(14px) -> 16px on mobile. Sub-16px text on a
            focusable control triggers iOS Safari's auto-zoom, which is
            the "bohot bada ho jata hai" issue. md+ pe chhota kar diya
            kyunki desktop pe zoom problem nahi hoti. */}
        <span
          className={
            selected.length
              ? "text-[16px] text-foreground md:text-sm"
              : "text-[16px] text-muted-foreground/40 md:text-sm"
          }
        >
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

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
                // FIX: py-1 -> py-1.5 taaki chip ka "x" touch target thoda
                // bada ho, chhoti screen pe misstap kam ho
                className="inline-flex items-center gap-1 rounded-full bg-videha-mist px-2.5 py-1.5 text-xs font-medium text-videha-navy"
              >
                {item}

                <X
                  className="h-3.5 w-3.5 shrink-0 cursor-pointer"
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
            <div className="border-b border-border p-3">
              <div className="flex items-center gap-2 rounded-lg bg-videha-mist px-3">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                {/* FIX: same zoom issue — this is a real focusable
                    text input, so it also needs >=16px on mobile */}
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-9 w-full bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground/50 md:text-xs"
                />
              </div>
            </div>

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
                      // FIX: py-2.5 -> py-3, so each row is a comfortable
                      // ~44px tap target on mobile (Apple's own min guideline)
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors md:text-xs ${
                        active
                          ? "bg-videha-mist text-videha-navy"
                          : "text-foreground/75 active:bg-videha-mist/60 hover:bg-videha-mist/60"
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

            <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
              <span className="text-xs text-muted-foreground">
                {selected.length} selected
              </span>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2 py-1 text-xs font-semibold text-videha-green"
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

function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="group flex flex-col">
      <label
        htmlFor={name}
        className="text-xs font-medium tracking-[0.05em] text-muted-foreground transition-colors group-focus-within:text-videha-green"
      >
        {label}
        {required && <span className="ml-1 text-videha-green">*</span>}
      </label>

      <div className="relative mt-2">
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          // FIX: native <select> bhi iOS pe usi zoom issue se affected
          // hota hai agar font-size <16px ho
          className="h-[46px] w-full appearance-none border-b border-border bg-transparent pr-8 text-[16px] text-foreground outline-none transition-all focus:border-videha-green md:text-sm"
        >
          <option value="">Select an option</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

export function Contact({
  preview = false,
  headline = "Looking for a Reliable Makhana Partner?",
  subhead = "Tell us about your requirement — products, quantities, specifications, packaging and destination — and our export team will respond with a tailored proposal.",
}: ContactProps) {
  const [sent, setSent] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [privateLabel, setPrivateLabel] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [sampleRequired, setSampleRequired] = useState("");
  const searchParams = useSearchParams();
  const { contact } = useSiteSettings();

  useEffect(() => {
    const paramProduct = searchParams.get("product") || searchParams.get("p");

    const paramService =
      searchParams.get("service") ||
      searchParams.get("services") ||
      searchParams.get("s");

    const paramSubject =
      searchParams.get("subject") ||
      searchParams.get("interest") ||
      searchParams.get("enquiry");

    const paramMessage =
      searchParams.get("additionalRequirement") ||
      searchParams.get("message") ||
      searchParams.get("purpose") ||
      searchParams.get("req");

    const paramPrivateLabel =
      searchParams.get("privateLabel") || searchParams.get("pl");

    const paramPackaging =
      searchParams.get("packaging") || searchParams.get("pack");

    if (paramProduct) {
      const cleanParam = decodeURIComponent(paramProduct).trim();
      const targetProduct = matchProductOption(cleanParam);
      setSelectedProducts([targetProduct]);
    }

    if (paramService) {
      const cleanParam = decodeURIComponent(paramService).trim();
      const targetService = matchFromList(cleanParam, SERVICES);
      setSelectedServices([targetService]);
    }

    if (paramPrivateLabel) {
      const cleanPl = decodeURIComponent(paramPrivateLabel).trim();
      if (cleanPl.toLowerCase() === "yes" || cleanPl.toLowerCase() === "true") {
        setPrivateLabel("Yes");
      } else if (
        cleanPl.toLowerCase() === "no" ||
        cleanPl.toLowerCase() === "false"
      ) {
        setPrivateLabel("No");
      }
    }

    if (paramSubject || paramMessage) {
      const textToFill =
        paramMessage ||
        (paramSubject ? `Enquiry regarding: ${paramSubject}` : "");

      if (textToFill) {
        setTimeout(() => {
          const addReqInput = (document.getElementById(
            "additionalRequirement",
          ) ||
            document.getElementById("preview-additionalRequirement") ||
            document.getElementById("message") ||
            document.getElementById(
              "preview-message",
            )) as HTMLTextAreaElement | null;

          if (addReqInput && !addReqInput.value) {
            addReqInput.value = textToFill;
          }
        }, 100);
      }
    }

    if (paramPackaging) {
      const textToFill = decodeURIComponent(paramPackaging).trim();
      if (textToFill) {
        setTimeout(() => {
          const packInput = (document.getElementById("packaging") ||
            document.getElementById(
              "preview-packaging",
            )) as HTMLInputElement | null;

          if (packInput && !packInput.value) {
            packInput.value = textToFill;
          }
        }, 100);
      }
    }
  }, [searchParams]);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      setError("Please select at least one product.");
      return;
    }

    setSending(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const enquiry = {
      name: String(formData.get("name") || ""),
      company: String(formData.get("company") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      country: String(formData.get("country") || ""),
      products: selectedProducts,
      services: selectedServices,
      grade: String(formData.get("grade") || ""),
      quantity: String(formData.get("quantity") || ""),
      monthlyRequirement: String(formData.get("monthlyRequirement") || ""),
      packaging: String(formData.get("packaging") || ""),
      privateLabel,
      port: String(formData.get("port") || ""),
      incoterm,
      sampleRequired,
      additionalRequirement: String(
        formData.get("additionalRequirement") || "",
      ),
    };

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(enquiry),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to send enquiry.");
      }

      setSent(true);
      form.reset();
      setSelectedProducts([]);
      setSelectedServices([]);
      setPrivateLabel("");
      setIncoterm("");
      setSampleRequired("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="bg-background">
      {/* FIX: py-20 -> py-14 on mobile — was adding a lot of dead space
          before/after the form on small screens, forcing extra scroll
          for no reason. Restored to py-20 from md+. */}
      <div className="mx-auto max-w-[1400px] px-5 py-14 md:px-10 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* LEFT */}
          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <Reveal>
                <SectionLabel>Let's Connect</SectionLabel>
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
                <span className="text-xs font-medium text-muted-foreground">
                  Export Division Email
                </span>

                <a
                  href={`mailto:${contact.email}`}
                  className="mt-1 block text-sm font-medium text-videha-navy hover:text-videha-green"
                >
                  {contact.email}
                </a>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  WhatsApp / Phone
                </span>

                <a
                  href={`https://wa.me/${contact.social.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm font-medium text-videha-navy hover:text-videha-green"
                >
                  {contact.phoneDisplay}
                </a>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
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
                  <span className="text-xs font-medium text-muted-foreground">
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
                  className="flex md:min-h-[500px] flex-col justify-center border border-border bg-videha-mist p-6 md:p-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center text-green-600">
                      <svg
                        viewBox="0 0 52 52"
                        className="h-11 w-11"
                        fill="none"
                      >
                        <circle
                          cx="26"
                          cy="26"
                          r="23"
                          className="check-circle"
                          stroke="currentColor"
                          strokeWidth="2"
                        />

                        <path
                          d="M15 27L22 34L38 18"
                          className="check-mark"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-xl font-medium tracking-tight text-videha-navy md:text-2xl">
                        Thank you for your enquiry.
                      </h3>

                      <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-green-600">
                        Enquiry received
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 max-w-lg border-t border-border pt-5">
                    <p className="text-sm leading-7 text-muted-foreground">
                      Your enquiry has been successfully submitted to the Videha
                      Overseas export desk. Our team will review your
                      requirements and an EXIM coordinator will contact you
                      shortly to discuss the next steps.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="border border-border bg-background p-5 sm:p-6 md:p-10"
                >
                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 sm:gap-y-7">
                    {FIELDS.map((field) => (
                      <div key={field.name} className="group flex flex-col">
                        <label
                          htmlFor={
                            preview ? `preview-${field.name}` : field.name
                          }
                          className="text-xs font-medium tracking-[0.05em] text-muted-foreground transition-colors group-focus-within:text-videha-green"
                        >
                          {field.label}

                          {field.required && (
                            <span className="ml-1 text-videha-green">*</span>
                          )}
                        </label>

                        {/* FIX: text-sm -> 16px on mobile. This was the
                            main culprit — Safari zooms the whole page in
                            on focus when a text input's font is <16px. */}
                        <input
                          id={preview ? `preview-${field.name}` : field.name}
                          name={field.name}
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder}
                          className="mt-2 border-b border-border bg-transparent pb-2.5 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground/35 focus:border-videha-green md:text-sm"
                        />
                      </div>
                    ))}

                    {/* Product */}
                    <MultiSelect
                      label="Product required"
                      placeholder="Select product"
                      options={PRODUCTS}
                      selected={selectedProducts}
                      onChange={setSelectedProducts}
                    />

                    {/* Service */}
                    <MultiSelect
                      label="Service required"
                      placeholder="Select service"
                      options={SERVICES}
                      selected={selectedServices}
                      onChange={setSelectedServices}
                    />

                    {/* Private label */}
                    <MultiSelect
                      label="Private label required"
                      placeholder="Select option"
                      options={["Yes", "No"]}
                      selected={privateLabel ? [privateLabel] : []}
                      onChange={(value) => setPrivateLabel(value[0] || "")}
                      required
                      singleSelect
                    />

                    {/* Incoterm */}
                    <MultiSelect
                      label="Preferred incoterm"
                      placeholder="Select incoterm"
                      options={["EXW", "FOB", "CFR", "CIF"]}
                      selected={incoterm ? [incoterm] : []}
                      onChange={(value) => setIncoterm(value[0] || "")}
                      required
                      singleSelect
                    />

                    {/* Sample */}
                    <MultiSelect
                      label="Sample required"
                      placeholder="Select option"
                      options={["Yes", "No"]}
                      selected={sampleRequired ? [sampleRequired] : []}
                      onChange={(value) => setSampleRequired(value[0] || "")}
                      required
                      singleSelect
                    />
                  </div>

                  {/* Additional Requirement */}
                  <div className="mt-8 flex flex-col group">
                    <label
                      htmlFor={
                        preview
                          ? "preview-additionalRequirement"
                          : "additionalRequirement"
                      }
                      className="text-xs font-medium tracking-[0.05em] text-muted-foreground transition-colors group-focus-within:text-videha-green"
                    >
                      Additional requirement
                    </label>

                    {/* FIX: same 16px fix applied to the textarea */}
                    <textarea
                      id={
                        preview
                          ? "preview-additionalRequirement"
                          : "additionalRequirement"
                      }
                      name="additionalRequirement"
                      rows={4}
                      placeholder="Tell us about any additional requirement, certification, specification, packaging or delivery detail..."
                      className="mt-2 resize-none border-b border-border bg-transparent pb-2.5 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground/35 focus:border-videha-green md:text-sm"
                    />
                  </div>

                  {error && (
                    <p className="mt-6 text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={sending}
                      className="group inline-flex w-full cursor-pointer items-center justify-center gap-3 bg-videha-navy px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-black border border-gray-700 transition-colors hover:bg-black hover:text-white hover:bg-videha-green disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit sm:justify-start"
                    >
                      {sending ? "Sending..." : "Send Business Enquiry"}
                      {!sending && (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
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