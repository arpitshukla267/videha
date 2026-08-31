import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa6";
import { COMPANY_REGISTRATIONS } from "@/lib/registrations";

const NAV = [
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Why Videha", href: "/why-videha" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#5A4938]/20 bg-[#514536] text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 md:px-10 md:py-9">
        {/* =========================================================
            FOOTER CONTENT
        ========================================================= */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-7 lg:grid-cols-4 lg:gap-10">
          {/* =======================================================
              COMPANY
          ======================================================= */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex flex-col leading-none">
              <span className="text-[21px] font-semibold tracking-[-0.03em]">
                Videha
              </span>

              <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.36em] text-white/45">
                Overseas
              </span>
            </Link>

            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-white/55">
              Exporter of Premium Agricultural &amp; Food Products
            </p>

            {/* Registered Office */}
            <div className="mt-4 flex items-start gap-2.5 text-[11px] leading-[1.55] text-white/50">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" />

              <span>
                Flat No. 4, B Wing, Samruddhi Enclave,
                <br />
                Kedgaon Chufula Road, Bori Paradhi,
                <br />
                Pune, Maharashtra – 412203
              </span>
            </div>

            {/* Social Media */}
            <div className="mt-5 flex items-center gap-2">
              {/* LinkedIn */}
              {/* <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/45 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <FaLinkedinIn className="h-3.5 w-3.5" />
              </a> */}

              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/1Yta2hcPKY/?mibextid=wwXIfr"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/45 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <FaFacebookF className="h-3.5 w-3.5" />
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/videhaoverseas/"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/45 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <FaInstagram className="h-3.5 w-3.5" />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/919373923799"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/45 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <FaWhatsapp className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* =======================================================
              EXPLORE
          ======================================================= */}
          <div className="col-span-1 lg:col-span-1">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/35">
              Explore
            </span>

            <nav className="mt-4 flex flex-col gap-2.5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-fit text-[12px] text-white/55 transition-colors duration-200 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* =======================================================
              REGISTRATION & CERTIFICATIONS
          ======================================================= */}
          <div className="col-span-1 lg:col-span-1">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Registration
              {/* &amp;
              <br />
              Certifications */}
            </span>

            <div className="mt-4 flex flex-col gap-2.5 text-[11px] text-white/55">
              {COMPANY_REGISTRATIONS.map((reg) => (
                <div key={reg.id}>
                  <span className="mr-2 text-white/30">{reg.shortLabel}</span>
                  {reg.value}
                </div>
              ))}
            </div>
          </div>

          {/* =======================================================
              CONTACT
          ======================================================= */}
          <div className="col-span-2 lg:col-span-1">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/35">
              Contact
            </span>

            <div className="mt-4 flex flex-col gap-3 text-[12px] text-white/55">
              {/* Email */}
              <a
                href="mailto:info@videhaoverseas.com"
                className="flex items-center gap-2.5 transition-colors duration-200 hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-white/35" />
                <span>info@videhaoverseas.com</span>
              </a>

              {/* Phone / WhatsApp */}
              <a
                href="tel:+919373923799"
                className="flex items-center gap-2.5 transition-colors duration-200 hover:text-white"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-white/35" />
                <span>+91 93739 23799</span>
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================
            BOTTOM BAR
        ========================================================= */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[9px] text-white/35">
              © {new Date().getFullYear()} VIDEHA OVERSEAS PRIVATE LIMITED. All
              rights reserved.
            </span>

            <span className="hidden text-[9px] uppercase tracking-[0.16em] text-white/25 sm:block">
              Indian Origin · Global Reach
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
