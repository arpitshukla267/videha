"use client";

import { FaWhatsapp } from "react-icons/fa6";

interface WhatsAppButtonProps {
  productName?: string;
  label?: string;
  floating?: boolean;
}

export function WhatsAppButton({
  productName,
  label = "WhatsApp",
  floating = false,
}: WhatsAppButtonProps) {
  const phoneNumber = "919373923799";

  const message = productName
    ? `Hello Videha Overseas, I am interested in ${productName}. Please share specifications and export pricing.`
    : `Hello Videha Overseas, I would like to discuss my export requirement. Please share more details.`;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message,
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        productName
          ? `Contact us about ${productName} on WhatsApp`
          : "Contact Videha Overseas on WhatsApp"
      }
      className={
        floating
          ? "group fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          : "group inline-flex h-[52px] items-center justify-center gap-2 rounded-none bg-[#25D366] px-6 text-sm font-medium text-white transition-all duration-300 hover:bg-[#20bd5a] hover:shadow-md"
      }
    >
      <FaWhatsapp className="h-6 w-6 shrink-0" />

      {!floating && <span>{label}</span>}
    </a>
  );
}
