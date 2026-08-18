"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const LINKS = [
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Why Videha", href: "/why-videha" },
  { label: "Contact", href: "/contact" },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close the mobile menu whenever the route changes and restore scroll
  useEffect(() => {
    setOpen(false)
    document.body.style.overflow = "unset"
  }, [pathname])

  const toggleMenu = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = "unset"
      }
      return next
    })
  }

  const isActive = (href: string) => pathname === href

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled || open
            ? "border-b border-border/70 bg-background/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          className={cn(
            "mx-auto flex max-w-[1400px] items-center justify-between px-5 transition-all duration-500 md:px-10",
            scrolled ? "h-16" : "h-24",
          )}
        >
          <Link href="/" className="flex flex-col leading-none z-50">
            <span className="text-lg font-semibold tracking-tight text-foreground">Videha</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.34em] text-muted-foreground">
              Overseas
            </span>
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "relative text-[13px] font-medium transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-foreground after:transition-all after:duration-300",
                    isActive(l.href)
                      ? "text-foreground after:w-full"
                      : "text-foreground/60 after:w-0 hover:text-foreground hover:after:w-full",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 z-50">
            <Link
              href="/contact"
              className="hidden items-center border border-foreground/25 px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background lg:inline-flex"
            >
              Enquire
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={toggleMenu}
              className="inline-flex h-10 w-10 items-center justify-center text-foreground hover:opacity-80 transition-opacity"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Premium Fullscreen Mobile Menu Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-background px-6 pt-32 pb-12 lg:hidden"
          >
            <div className="flex flex-col justify-center flex-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-6">
                Navigation
              </span>
              <ul className="flex flex-col gap-6">
                {LINKS.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={l.href}
                      className="group flex items-baseline gap-4 py-1.5"
                    >
                      <span className="font-mono text-xs text-accent/50 group-hover:text-accent transition-colors">
                        0{i + 1}
                      </span>
                      <span className={cn(
                        "text-3xl font-semibold tracking-tight transition-colors",
                        isActive(l.href) ? "text-primary" : "text-foreground hover:text-primary"
                      )}>
                        {l.label}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="border-t border-border/60 pt-6 flex flex-col gap-4"
            >
              <div className="flex flex-col text-xs text-muted-foreground font-mono">
                <span>EXPORT ENQUIRY DESK</span>
                <a href="mailto:export@videhaoverseas.com" className="text-foreground font-medium mt-1 hover:underline">
                  export@videhaoverseas.com
                </a>
              </div>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center bg-foreground px-5 py-4 text-[12px] font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary"
              >
                Send Enquiry
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

