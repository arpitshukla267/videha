"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Why Videha", href: "/why-videha" },
  { label: "Contact", href: "/contact" },
];

export function SiteNav() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setOpen(false);
    document.body.style.overflow = "unset";
  }, [pathname]);

  // Lock body scroll while menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const toggleMenu = () => {
    setOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const isActive = (href: string) => pathname === href;

  /* Transparent dark mode for Home page (/) and Services page (/services) when at top */
  const isTransparentRoute = pathname === "/" || pathname === "/services" || pathname?.startsWith("/services/");
  const isTopTransparent = isTransparentRoute && !scrolled && !open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled || open
            ? "border-b border-border/70 bg-background/95 backdrop-blur-md shadow-xs"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          className={cn(
            "mx-auto flex max-w-[1400px] items-center justify-between px-5 transition-all duration-500 md:px-10",
            scrolled ? "h-16" : "h-24",
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            onClick={closeMenu}
            className="relative z-50 flex flex-col leading-none"
          >
            <span
              className={cn(
                "text-lg font-semibold tracking-tight transition-colors duration-300",
                isTopTransparent ? "text-white" : "text-foreground",
              )}
            >
              Videha
            </span>

            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.34em] transition-colors duration-300",
                isTopTransparent ? "text-white/70" : "text-muted-foreground",
              )}
            >
              Overseas
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "relative text-[13px] font-medium transition-colors duration-300",
                    "after:absolute after:-bottom-1.5 after:left-0 after:h-px",
                    "after:transition-all after:duration-300",
                    isTopTransparent
                      ? isActive(l.href)
                        ? "text-white after:w-full after:bg-white"
                        : "text-white/80 after:w-0 after:bg-white hover:text-white hover:after:w-full"
                      : isActive(l.href)
                        ? "text-foreground after:w-full after:bg-foreground"
                        : "text-foreground/70 after:w-0 after:bg-foreground hover:text-foreground hover:after:w-full",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA + Mobile Menu Button */}
          <div className="relative z-50 flex items-center gap-3">
            <Link
              href="/contact"
              className={cn(
                "hidden items-center px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.18em] transition-all duration-300 lg:inline-flex",
                isTopTransparent
                  ? "border border-white/40 text-white hover:bg-white hover:text-black"
                  : "border border-foreground/25 text-foreground hover:bg-foreground hover:text-background",
              )}
            >
              Enquire
            </Link>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={toggleMenu}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center transition-colors lg:hidden",
                isTopTransparent ? "text-white" : "text-foreground",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>

        {/* ================= MOBILE MENU ================= */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{
                opacity: 0,
                scaleY: 0,
              }}
              animate={{
                opacity: 1,
                scaleY: 1,
              }}
              exit={{
                opacity: 0,
                scaleY: 0,
              }}
              transition={{
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                transformOrigin: "top",
              }}
              className="
                absolute left-0 right-0 top-full
                overflow-hidden
                border-t border-border/60
                bg-background
                lg:hidden
                shadow-[0_14px_24px_rgba(0,0,0,0.10)]
              "
            >
              <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto">
                <ul>
                  {LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={closeMenu}
                        className={cn(
                          "group flex items-center px-7 py-5",
                          "border-b border-border/70",
                          "transition-colors duration-200",
                          "hover:bg-muted/40",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[17px] font-medium tracking-tight",
                            "transition-transform duration-200",
                            isActive(link.href)
                              ? "translate-x-1 text-foreground font-semibold"
                              : "text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground",
                          )}
                        >
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  ))}

                  {/* Download Brochure */}
                  <li>
                    <a
                      href="/brochure.pdf"
                      download
                      onClick={closeMenu}
                      className="
                        group flex items-center justify-between
                        border-b border-border/70
                        px-7 py-5
                        transition-colors duration-200
                        hover:bg-muted/40
                      "
                    >
                      <span
                        className="
                          text-[17px] font-medium tracking-tight
                          text-muted-foreground
                          transition-transform duration-200
                          group-hover:translate-x-1
                          group-hover:text-foreground
                        "
                      >
                        Download Brochure
                      </span>

                      <Download
                        className="
                          h-5 w-5
                          text-muted-foreground
                          transition-all duration-200
                          group-hover:translate-y-0.5
                          group-hover:text-foreground
                        "
                      />
                    </a>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
