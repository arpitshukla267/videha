"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, Download, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Quality & Compliance", href: "/quality" },
  { label: "Why Videha", href: "/why-videha" },
  { label: "Contact", href: "/contact" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  const pathname = usePathname();

  /*
   * Scroll state for all pages except Home.
   * Home uses hero visibility instead, so the navbar
   * stays transparent while the hero is still visible.
   */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);

      if (pathname === "/") {
        const hero = document.getElementById("hero");

        if (hero) {
          const rect = hero.getBoundingClientRect();

          // Keep navbar transparent until the hero
          // has completely left the viewport.
          setHeroVisible(rect.bottom > 0);
        } else {
          setHeroVisible(false);
        }
      }
    };

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  /*
   * Reset page-specific state when route changes.
   */
  useEffect(() => {
    setOpen(false);
    setProductsOpen(false);

    document.body.style.overflow = "unset";

    // Home should start with hero-visible state.
    if (pathname === "/") {
      setHeroVisible(true);
    } else {
      setHeroVisible(false);
    }
  }, [pathname]);

  /*
   * Lock body scroll while mobile menu is open.
   */
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
    setProductsOpen(false);
  };

  const isActive = (href: string) => pathname === href;

  /*
   * PAGE TYPES
   */
  const isHome = pathname === "/";

  const isServices =
    pathname === "/services" || pathname?.startsWith("/services/");

  /*
   * TOP / SCROLL STATE
   *
   * HOME:
   *   Hero visible -> transparent
   *   Hero gone    -> background
   *
   * SERVICES:
   *   Top          -> transparent
   *   Scroll       -> background
   *
   * OTHER PAGES:
   *   Top          -> transparent
   *   Scroll       -> background
   */
  const isTransparent =
    !open && ((isHome && heroVisible) || (!isHome && !scrolled));

  /*
   * WHITE TEXT ONLY ON:
   *   Home while hero is visible
   *   Services while at top
   *
   * OTHER PAGES ALWAYS START WITH BLACK TEXT.
   */
  const useLightNav =
    !open && ((isHome && heroVisible) || (isServices && !scrolled));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          isTransparent
            ? "border-b border-transparent bg-transparent"
            : "border-b border-border/70 bg-background/95 backdrop-blur-md shadow-xs",
        )}
      >
        <nav
          className={cn(
            "mx-auto flex max-w-[1400px] items-center justify-between px-5 transition-all duration-500 md:px-10",
            isTransparent ? "h-24" : "h-16",
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            onClick={closeMenu}
            className="relative z-50 flex flex-col leading-none"
          >
            <Image
              src="/logo.png"
              alt="Videha Overseas"
              width={120}
              height={120}
              priority
              className="h-auto w-28 sm:w-36 focus:outline-none"
            />
            {/* <span
              className={cn(
                "text-lg font-semibold tracking-tight transition-colors duration-300",
                useLightNav ? "text-white" : "text-foreground",
              )}
            >
              Videha
            </span>

            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.34em] transition-colors duration-300",
                useLightNav ? "text-white/70" : "text-muted-foreground",
              )}
            >
              Overseas
            </span> */}
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => {
              if (l.label !== "Products") {
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "relative inline-flex h-5 items-center leading-none text-[13px] font-medium transition-colors duration-300",
                        "after:absolute after:-bottom-1.5 after:left-0 after:h-px",
                        "after:transition-all after:duration-300",

                        useLightNav
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
                );
              }

              return (
                <li
                  key={l.href}
                  className="relative"
                  onMouseEnter={() => setProductsOpen(true)}
                  onMouseLeave={() => setProductsOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setProductsOpen((prev) => !prev)}
                    className={cn(
                      "group relative inline-flex h-5 items-center gap-1.5 leading-none text-[13px] font-medium transition-colors duration-300",
                      useLightNav
                        ? "text-white/80 hover:text-white"
                        : "text-foreground/70 hover:text-foreground",
                    )}
                    aria-expanded={productsOpen}
                  >
                    Products
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-300",
                        productsOpen && "rotate-180",
                      )}
                    />
                    <span
                      className={cn(
                        "absolute -bottom-1.5 left-0 h-px transition-all duration-300",
                        useLightNav ? "bg-white" : "bg-foreground",
                        productsOpen ? "w-full" : "w-0",
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {productsOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          y: 8,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="absolute left-1/2 top-full z-50 mt-5 w-64 -translate-x-1/2"
                      >
                        <div className="overflow-hidden rounded-lg border border-border/70 bg-background shadow-[0_14px_35px_rgba(0,0,0,0.12)]">
                          <Link
                            href="/products"
                            onClick={closeMenu}
                            className="group block border-b border-border/60 px-5 py-4 transition-colors duration-200 hover:bg-muted/40"
                          >
                            <span className="block text-sm font-medium text-foreground">
                              Makhana Range
                            </span>

                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              Premium Indian Makhana
                            </span>
                          </Link>

                          <Link
                            href="/guar-gum"
                            onClick={closeMenu}
                            className="group block px-5 py-4 transition-colors duration-200 hover:bg-muted/40"
                          >
                            <span className="block text-sm font-medium text-foreground">
                              Food Grade Guar Gum
                            </span>

                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              Technical B2B Ingredient
                            </span>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>

          {/* Desktop CTA + Mobile Menu */}
          <div className="relative z-50 flex items-center gap-3">
            <Link
              href="/brochure/VIDEHA-OVERSEAS.pdf"
              download="VIDEHA-OVERSEAS.pdf"
              className={cn(
                "hidden items-center px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.18em] transition-all duration-300 lg:inline-flex",

                useLightNav
                  ? "border border-white/40 text-white hover:bg-white hover:text-black"
                  : "border border-foreground/25 bg-foreground text-white hover:bg-background hover:text-foreground",
              )}
            >
              Download Brochure
            </Link>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={toggleMenu}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center transition-colors lg:hidden",
                useLightNav ? "text-white" : "text-foreground",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span
                    key="close"
                    initial={{
                      rotate: -90,
                      opacity: 0,
                    }}
                    animate={{
                      rotate: 0,
                      opacity: 1,
                    }}
                    exit={{
                      rotate: 90,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                  >
                    <X className="h-6 w-6" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{
                      rotate: 90,
                      opacity: 0,
                    }}
                    animate={{
                      rotate: 0,
                      opacity: 1,
                    }}
                    exit={{
                      rotate: -90,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
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
                  {LINKS.map((link) => {
                    if (link.label !== "Products") {
                      return (
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
                                  ? "translate-x-1 font-semibold text-foreground"
                                  : "text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground",
                              )}
                            >
                              {link.label}
                            </span>
                          </Link>
                        </li>
                      );
                    }

                    return (
                      <li key={link.href} className="border-b border-border/70">
                        <button
                          type="button"
                          onClick={() => setProductsOpen((prev) => !prev)}
                          className="flex w-full items-center justify-between px-7 py-5 text-left transition-colors duration-200 hover:bg-muted/40"
                          aria-expanded={productsOpen}
                        >
                          <span
                            className={cn(
                              "text-[17px] font-medium tracking-tight",
                              productsOpen
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            Products
                          </span>

                          <ChevronDown
                            className={cn(
                              "h-5 w-5 text-muted-foreground transition-transform duration-300",
                              productsOpen && "rotate-180 text-foreground",
                            )}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {productsOpen && (
                            <motion.div
                              initial={{
                                height: 0,
                                opacity: 0,
                              }}
                              animate={{
                                height: "auto",
                                opacity: 1,
                              }}
                              exit={{
                                height: 0,
                                opacity: 0,
                              }}
                              transition={{
                                duration: 0.25,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="overflow-hidden bg-muted/20"
                            >
                              <Link
                                href="/products"
                                onClick={closeMenu}
                                className="flex flex-col border-t border-border/50 px-10 py-4 transition-colors hover:bg-muted/40"
                              >
                                <span className="text-[15px] font-medium text-foreground">
                                  Makhana Range
                                </span>

                                <span className="mt-1 text-xs text-muted-foreground">
                                  Premium Indian Makhana
                                </span>
                              </Link>

                              <Link
                                href="/guar-gum"
                                onClick={closeMenu}
                                className="flex flex-col border-t border-border/50 px-10 py-4 transition-colors hover:bg-muted/40"
                              >
                                <span className="text-[15px] font-medium text-foreground">
                                  Food Grade Guar Gum
                                </span>

                                <span className="mt-1 text-xs text-muted-foreground">
                                  Technical B2B Ingredient
                                </span>
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}

                  {/* Download Brochure */}
                  <li className="border-b border-border/70">
                    <a
                      href="/brochure/VIDEHA-OVERSEAS.pdf"
                      download="VIDEHA-OVERSEAS.pdf"
                      className={cn(
                        "group flex w-full items-center px-7 py-5",
                        "text-left",
                        "transition-colors duration-200",
                        "bg-muted/90",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[17px] font-medium tracking-tight",
                          "text-black",
                          "transition-transform duration-200",
                          "group-hover:translate-x-1 group-hover:text-foreground",
                        )}
                      >
                        Download Brochure
                      </span>
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
