import Link from "next/link"

const NAV = [
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Our Process", href: "/our-process" },
  { label: "Quality", href: "/quality" },
  { label: "Why Videha", href: "/why-videha" },
  { label: "Global Reach", href: "/global-reach" },
  { label: "Contact", href: "/contact" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-semibold tracking-tight text-background">
                Videha
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.34em] text-background/60">
                Overseas
              </span>
            </div>
            <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-background/60">
              Premium makhana, sourced in India and exported to global markets with a
              standard our partners can trust.
            </p>
          </div>

          <div className="md:col-span-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-background/40">
              Explore
            </span>
            <ul className="mt-5 flex flex-col gap-3">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-[14px] text-background/75 transition-colors hover:text-background"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-background/40">
              Contact
            </span>
            <ul className="mt-5 flex flex-col gap-3 text-[14px] text-background/75">
              <li>
                <a href="mailto:export@videhaoverseas.com" className="hover:text-background">
                  export@videhaoverseas.com
                </a>
              </li>
              <li>Bihar, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-background/15 pt-8 text-[12px] text-background/50 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Videha Overseas. All rights reserved.</span>
          <span className="uppercase tracking-[0.2em]">Indian Origin · Global Reach</span>
        </div>
      </div>
    </footer>
  )
}
