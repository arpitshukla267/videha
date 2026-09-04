"use client";
import { ContentManager } from "@/components/content-manager";
import { servicesApi, type Service } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function ServicesPage() {
  return (
    <ContentManager<Service>
      title="Services"
      description="The 6 service capabilities shown on the Services page."
      api={servicesApi}
      emptyDefaults={{ num: "", title: "", copy: "", detail: "", isActive: true, order: 0 }}
      fields={[
        { key: "num", label: "Number", type: "text", placeholder: "01" },
        { key: "title", label: "Title", type: "text", placeholder: "Sourcing", span: "full" },
        { key: "copy", label: "Copy", type: "textarea", span: "full", rows: 3 },
        { key: "detail", label: "Detail (short tagline)", type: "text", span: "full", placeholder: "We work at the wetlands, not just the warehouse." },
        { key: "order", label: "Order", type: "number" },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">#{item.num}</span>
            <span className="font-semibold text-slate-900 text-sm">{item.title}</span>
            <Badge variant={item.isActive ? "success" : "warning"}>{item.isActive ? "Active" : "Hidden"}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{item.copy}</p>
          <p className="text-xs text-slate-400 italic">{item.detail}</p>
        </div>
      )}
    />
  );
}
