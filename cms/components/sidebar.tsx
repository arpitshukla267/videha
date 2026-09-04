"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { label: "Hero Stories", href: "/dashboard/hero", icon: Clapperboard },
  { label: "Site Settings", href: "/dashboard/site-settings", icon: Settings },
  { label: "Quotation Builder", href: "/dashboard/quotation-builder", icon: FileText },
  {
    label: "Site Content",
    icon: Globe,
    children: [
      { label: "Process Steps", href: "/dashboard/process-steps", icon: Footprints },
      { label: "Quality Points", href: "/dashboard/quality-points", icon: Star },
      { label: "Services", href: "/dashboard/services", icon: Wrench },
      { label: "Buyer Expectations", href: "/dashboard/buyer-expectations", icon: Users },
      { label: "Intro Facts", href: "/dashboard/intro-facts", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 bg-[#0f172a] min-h-screen flex flex-col shadow-xl">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-600/30">
            V
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Videha Overseas</p>
            <p className="text-blue-300/60 text-[10px] font-medium tracking-wide">Content Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {NAV.map((item, idx) => {
            if ("children" in item && item.children) {
              return (
                <div key={item.label} className={cn(idx > 0 && "mt-4 pt-4 border-t border-white/10")}>
                  <div className="flex items-center gap-2 px-3 py-2 mb-1 text-white/40 text-[10px] font-semibold uppercase tracking-widest">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                  {item.children.map((child) => {
                    const active = pathname === child.href || pathname.startsWith(child.href + "/");
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm transition-all mb-0.5",
                          active
                            ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-900/40"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <child.icon className="w-4 h-4 shrink-0 opacity-80" />
                        {child.label}
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
                  "flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm transition-all",
                  idx > 0 && href === "/dashboard/site-settings" && "mt-1",
                  active
                    ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-900/40"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-6 py-5 border-t border-white/10">
        <a
          href="http://localhost:3005"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-400 text-xs hover:text-blue-300 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          View Website
        </a>
      </div>
    </aside>
  );
}
