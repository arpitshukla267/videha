import Link from "next/link";

const NAV = [
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Why Videha", href: "/why-videha" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t  border-[#5A4938]/20 bg-[#514536] text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 md:px-10 md:py-12">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 md:grid-cols-12 md:gap-10">
          {/* Brand */}
          <div className="md:col-span-6">
            <Link href="/" className="inline-flex flex-col leading-none">
              <span className="text-[22px] font-semibold tracking-[-0.03em]">
                Videha
              </span>

              <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.36em] text-white/55">
                Overseas
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-[13px] leading-[1.65] text-white/55">
              Premium makhana, sourced in India and exported to global markets
              with a standard our partners can trust.
            </p>
          </div>

          {/* Explore */}
          <div className="md:col-span-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
              Explore
            </span>

            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="w-fit text-[13px] text-white/65 transition-colors duration-200 hover:text-white"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
              Contact
            </span>

            <div className="mt-4 space-y-2.5 text-[13px] text-white/65">
              <a
                href="mailto:export@videhaoverseas.com"
                className="block transition-colors hover:text-white"
              >
                export@videhaoverseas.com
              </a>

              <span className="block">Bihar, India</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-5 text-[10px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Videha Overseas. All rights reserved.
          </span>

          <span className="uppercase tracking-[0.18em]">
            Indian Origin · Global Reach
          </span>
        </div>
      </div>
    </footer>
  );
}
