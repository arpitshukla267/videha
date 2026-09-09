"use client";
import { ContentManager } from "@/components/content-manager";
import { servicesApi, type Service } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Wrench, Globe2, Truck, CheckSquare, Sparkles } from "lucide-react";

export default function ServicesPage() {
  return (
    <ContentManager<Service>
      title="Services & Capabilities"
      description="Manage the 6 core capabilities of Videha Overseas, displayed on the Services page."
      gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                #{item.num || "00"}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base line-clamp-1">{item.title}</h3>
                {item.detail && <p className="text-[11px] text-purple-600 font-medium italic line-clamp-1">{item.detail}</p>}
              </div>
            </div>
            <Badge variant={item.isActive ? "success" : "warning"}>
              {item.isActive ? "Active" : "Hidden"}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
            {item.copy || "No service description copy."}
          </p>
        </div>
      )}
    />
  );
}

