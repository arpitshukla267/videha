"use client";
import { useEffect, useState } from "react";
import { checkHealth, productsApi, heroApi } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import {
  ShoppingBag, Clapperboard, Globe, Activity,
  CheckCircle2, XCircle, ExternalLink, ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [health, setHealth] = useState<boolean | null>(null);
  const [counts, setCounts] = useState({ products: 0, activeProducts: 0, stories: 0, activeStories: 0 });

  useEffect(() => {
    checkHealth().then(setHealth);
    Promise.all([productsApi.list(), heroApi.list()]).then(([products, stories]) => {
      setCounts({
        products: products.length,
        activeProducts: products.filter((p) => p.isActive).length,
        stories: stories.length,
        activeStories: stories.filter((s) => s.isActive).length,
      });
    }).catch(() => {});
  }, []);

  const cards = [
    { label: "Total Products", value: counts.products, sub: `${counts.activeProducts} active`, icon: ShoppingBag, href: "/dashboard/products", color: "accent" },
    { label: "Hero Stories", value: counts.stories, sub: `${counts.activeStories} active`, icon: Clapperboard, href: "/dashboard/hero", color: "primary" },
    { label: "Content Sections", value: 5, sub: "Process, Quality, Services…", icon: Globe, href: "/dashboard/process-steps", color: "muted" },
  ];

  const quick = [
    { label: "Site Settings", href: "/dashboard/site-settings" },
    { label: "Manage Products", href: "/dashboard/products" },
    { label: "Edit Hero Stories", href: "/dashboard/hero" },
    { label: "Process Steps", href: "/dashboard/process-steps" },
    { label: "Quality Points", href: "/dashboard/quality-points" },
    { label: "Services", href: "/dashboard/services" },
    { label: "Buyer Expectations", href: "/dashboard/buyer-expectations" },
    { label: "Intro Facts", href: "/dashboard/intro-facts" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your website content from here</p>
      </div>

      {/* API Status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-8 text-sm font-medium ${
        health === null ? "bg-slate-100 text-slate-500" :
        health ? "bg-green-50 text-green-700 border border-green-200" :
        "bg-red-50 text-red-700 border border-red-200"
      }`}>
        <Activity className="w-4 h-4" />
        <span>Backend API:</span>
        {health === null ? (
          <span className="text-slate-400">Checking…</span>
        ) : health ? (
          <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Connected — http://localhost:4000</span>
        ) : (
          <span className="flex items-center gap-1"><XCircle className="w-4 h-4" /> Offline — start backend with <code className="bg-red-100 px-1 rounded text-xs">npm run dev</code></span>
        )}
        <a href="http://localhost:3005" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-xs opacity-60 hover:opacity-100">
          Website <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardBody className="flex items-center gap-4 py-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  c.color === "accent" ? "bg-[#F3E2D4]" :
                  c.color === "primary" ? "bg-[#EBE5D9]" : "bg-[#E5DDD0]"
                }`}>
                  <c.icon className={`w-6 h-6 ${
                    c.color === "accent" ? "text-accent" :
                    c.color === "primary" ? "text-primary" : "text-[#665E52]"
                  }`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-xs text-slate-400">{c.sub}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
          {quick.map((q, i) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex items-center justify-between px-4 py-3 text-sm text-[#1F2421] hover:bg-[#F3E2D4] hover:text-accent transition-colors border-b border-r border-[#E2D9CB]"
            >
              {q.label}
              <ArrowRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
