"use client";
import { useEffect, useState } from "react";
import { checkHealth, productsApi, heroApi } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Clapperboard,
  Globe,
  Activity,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowUpRight,
  Footprints,
  Star,
  Wrench,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  Layers,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [health, setHealth] = useState<boolean | null>(null);
  const [counts, setCounts] = useState({
    products: 0,
    activeProducts: 0,
    stories: 0,
    activeStories: 0,
  });

  useEffect(() => {
    checkHealth().then(setHealth);
    Promise.all([productsApi.list(), heroApi.list()])
      .then(([products, stories]) => {
        setCounts({
          products: products.length,
          activeProducts: products.filter((p) => p.isActive).length,
          stories: stories.length,
          activeStories: stories.filter((s) => s.isActive).length,
        });
      })
      .catch(() => {});
  }, []);

  const stats = [
    {
      label: "Total Products",
      value: counts.products,
      sub: `${counts.activeProducts} active on site`,
      icon: ShoppingBag,
      href: "/dashboard/products",
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      label: "Hero Stories",
      value: counts.stories,
      sub: `${counts.activeStories} slides live`,
      icon: Clapperboard,
      href: "/dashboard/hero",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      label: "Content Sections",
      value: 5,
      sub: "Process, Quality, Services…",
      icon: Layers,
      href: "/dashboard/process-steps",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "API Connectivity",
      value: health ? "100%" : "Offline",
      sub: health ? "Backend operational" : "Check local server",
      icon: Activity,
      href: "/dashboard/site-settings",
      color: health ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100",
    },
  ];

  const quickTiles = [
    { label: "Products Catalogue", desc: "10 Makhana items", icon: ShoppingBag, href: "/dashboard/products", bg: "hover:border-purple-300" },
    { label: "Hero Stories", desc: "Homepage slider", icon: Clapperboard, href: "/dashboard/hero", bg: "hover:border-indigo-300" },
    { label: "Site Settings", desc: "Contact & registrations", icon: Settings, href: "/dashboard/site-settings", bg: "hover:border-slate-300" },
    { label: "Process Steps", desc: "7 Export steps", icon: Footprints, href: "/dashboard/process-steps", bg: "hover:border-emerald-300" },
    { label: "Quality Points", desc: "4 Assurance factors", icon: Star, href: "/dashboard/quality-points", bg: "hover:border-amber-300" },
    { label: "Services", desc: "6 Core capabilities", icon: Wrench, href: "/dashboard/services", bg: "hover:border-blue-300" },
    { label: "Buyer Expectations", desc: "Why Videha points", icon: Users, href: "/dashboard/buyer-expectations", bg: "hover:border-purple-300" },
    { label: "Intro Facts", desc: "3 Key statistics", icon: BarChart3, href: "/dashboard/intro-facts", bg: "hover:border-indigo-300" },
  ];

  const overviewSections = [
    { title: "Products Management", badge: "10 Products", desc: "Manage grades, packaging, MOQ, and quality specs", href: "/dashboard/products", icon: ShoppingBag },
    { title: "Hero Stories", badge: "5 Slides", desc: "Homepage banners, images, headings and CTAs", href: "/dashboard/hero", icon: Clapperboard },
    { title: "Process & Quality", badge: "Content", desc: "7 export steps, 4 quality parameters & certifications", href: "/dashboard/process-steps", icon: Footprints },
    { title: "Global Services", badge: "Capabilities", desc: "6 international trade & supply chain service cards", href: "/dashboard/services", icon: Wrench },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Greeting Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          {/* <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              <Sparkles className="w-3.5 h-3.5" /> Videha Overseas CMS
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">v2.0 • Live Sync Enabled</span>
          </div> */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight pt-1">
            Welcome back, Admin 👋
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Control your website content, product catalogue, hero slides, and
            business details from your unified dashboard.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
          <a
            href="https://www.videhaoverseas.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-all shadow-sm shadow-purple-600/20"
          >
            Preview Site <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* Backend API Health Alert Card */}
      {/* <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-all ${
          health === null
            ? "bg-slate-50 text-slate-600 border-slate-200"
            : health
              ? "bg-emerald-50/70 text-emerald-900 border-emerald-200/70"
              : "bg-rose-50/70 text-rose-900 border-rose-200/70"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              health === null
                ? "bg-slate-200 text-slate-600"
                : health
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 animate-pulse"
                  : "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                Backend API Server Status:
              </span>
              {health === null ? (
                <Badge variant="outline">Checking…</Badge>
              ) : health ? (
                <Badge variant="success">Online & Connected</Badge>
              ) : (
                <Badge variant="destructive">Offline</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {health
                ? "API Endpoint http://localhost:4000 is active. Data is syncing seamlessly."
                : "Unable to reach http://localhost:4000. Start backend using npm run dev in the backend directory."}
            </p>
          </div>
        </div>

        <a
          href="http://localhost:3005"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 shrink-0 underline decoration-purple-300 underline-offset-4"
        >
          View Public Website <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div> */}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="h-full border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all duration-200">
              <CardBody className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {s.label}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${s.color}`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-slate-900 tracking-tight group-hover:text-purple-600 transition-colors">
                    {s.value}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {s.sub}
                  </p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Access Card with Clickable Navigation Tiles */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-slate-900 text-base">
              Quick Access Modules
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Click to navigate directly
          </span>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickTiles.map((q) => (
              <Link key={q.href} href={q.href} className="group">
                <div
                  className={`p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md ${q.bg} transition-all duration-200 flex items-start gap-3.5 h-full`}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <q.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-xs group-hover:text-purple-600 transition-colors truncate">
                        {q.label}
                      </h3>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {q.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Content Overview Cards Grid (2x2 balanced layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {overviewSections.map((sec) => (
          <Card
            key={sec.title}
            className="hover:border-purple-300 transition-all duration-200"
          >
            <CardBody className="p-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <sec.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      {sec.title}
                    </h3>
                    <Badge variant="purple">{sec.badge}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{sec.desc}</p>
                </div>
              </div>
              <Link href={sec.href}>
                <button className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shrink-0">
                  Manage
                </button>
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

