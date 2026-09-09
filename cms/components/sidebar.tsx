"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  Clapperboard,
  Footprints,
  Star,
  Globe,
  Wrench,
  Users,
  BarChart3,
  ChevronRight,
  Settings,
  FileText,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { label: "Hero Stories", href: "/dashboard/hero", icon: Clapperboard },
  { label: "Site Settings", href: "/dashboard/site-settings", icon: Settings },
  {
    label: "Site Content",
    icon: Globe,
    children: [
      { label: "Process Steps", href: "/dashboard/process-steps", icon: Footprints },
      { label: "Quality Points", href: "/dashboard/quality-points", icon: Star },
      { label: "Services", href: "/dashboard/services", icon: Wrench },
      // { label: "Buyer Expectations", href: "/dashboard/buyer-expectations", icon: Users },
      { label: "Intro Facts", href: "/dashboard/intro-facts", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const quotationBuilderUrl = process.env.NEXT_PUBLIC_QUOTATION_BUILDER_URL?.trim();

  return (
    <aside className="w-64 shrink-0 bg-[#0e1626] h-full flex flex-col border-r border-slate-800/60 text-slate-300">
      {/* Brand Header */}

      <div className="px-6 py-6 border-b border-slate-800/70">
        <div className="flex flex-col items-center gap-3.5">
          <Image 
            src="/logo.png" 
            alt="Videha Overseas" 
            width={92} 
            height={92} 
            className="w-full h-20 object-cover"
          />
          {/* <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white font-bold text-sm tracking-tight">
                Videha Overseas
              </p>
            </div>
          </div> */}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 overflow-y-auto space-y-6">
        <div className="flex flex-col gap-1.5">
          {NAV.map((item, idx) => {
            if ("children" in item && item.children) {
              return (
                <div
                  key={item.label}
                  className="mt-4 pt-4 border-t border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <item.icon className="w-3.5 h-3.5 text-purple-400" />
                    {item.label}
                  </div>
                  {item.children.map((child) => {
                    const active =
                      pathname === child.href ||
                      pathname.startsWith(child.href + "/");
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-colors group",
                          active
                            ? "text-white font-semibold"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="active-sidebar-pill"
                            className="absolute inset-0 bg-purple-600 rounded-xl shadow-md shadow-purple-900/50"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                        <child.icon
                          className={cn(
                            "w-4 h-4 shrink-0 relative z-10 transition-transform group-hover:scale-110",
                            active ? "text-white" : "text-slate-400",
                          )}
                        />
                        <span className="relative z-10 flex-1">
                          {child.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const href = item.href as string;
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-colors group",
                  active
                    ? "text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-sidebar-pill"
                    className="absolute inset-0 bg-purple-600 rounded-xl shadow-md shadow-purple-900/50"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0 relative z-10 transition-transform group-hover:scale-110",
                    active ? "text-white" : "text-slate-400",
                  )}
                />
                <span className="relative z-10 flex-1">{item.label}</span>
              </Link>
            );
          })}

          {quotationBuilderUrl ? (
            <a
              href={quotationBuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all mt-2"
            >
              <FileText className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="flex-1">Quotation Builder</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </a>
          ) : null}
        </div>
      </nav>

      {/* Footer link */}
      <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-950/40">
        <a
          href="https://www.videhaoverseas.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium hover:border-purple-500/50 hover:text-white transition-all group"
        >
          <div className="flex items-center gap-2">
            <span>Live Website</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </aside>
  );
}

