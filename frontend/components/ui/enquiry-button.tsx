"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useSiteSettings } from "@/components/site-settings-provider";

interface EnquiryButtonProps {
  label?: string;
  floating?: boolean;
}

export function EnquiryButton({
  label = "Enquire Now",
  floating = true,
}: EnquiryButtonProps) {
  const { contact } = useSiteSettings();
  if (!floating) return null;

  return (
    <Link
      href={`mailto:${contact.email}`}
      aria-label={label}
      className="
        group fixed bottom-[80px] md:bottom-[90px] right-4 md:right-6 z-50
        flex h-14 w-14 items-center justify-center
        rounded-full
        bg-white
        text-foreground
        shadow-lg
        transition-all duration-300
        hover:scale-105
        hover:shadow-xl
      "
    >
      <Mail
        className="
          h-6 w-6
          text-foreground
          transition-transform duration-300
          group-hover:scale-110
        "
        strokeWidth={1.8}
      />
    </Link>
  );
}
