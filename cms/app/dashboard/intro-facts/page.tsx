"use client";
import { ContentManager } from "@/components/content-manager";
import { introFactsApi, type IntroFact } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart2 } from "lucide-react";

export default function IntroFactsPage() {
  return (
    <ContentManager<IntroFact>
      title="Intro Statistics & Facts"
      description="The 3 key stats displayed in the homepage intro section (e.g. 12+ Global Markets Served)."
      gridCols="grid-cols-1 md:grid-cols-3 gap-6"
      api={introFactsApi}
      emptyDefaults={{ value: "", label: "", isActive: true, order: 0 }}
      fields={[
        { key: "value", label: "Stat Value (e.g. 12+)", type: "text", placeholder: "12+" },
        { key: "label", label: "Stat Label", type: "text", placeholder: "Global markets served" },
        { key: "order", label: "Order", type: "number" },
      ]}
      renderRow={(item) => (
        <div className="space-y-3 py-2 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <Badge variant={item.isActive ? "success" : "warning"}>
              {item.isActive ? "Active" : "Hidden"}
            </Badge>
          </div>

          <div>
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight text-purple-600">
              {item.value || "0"}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mt-1 line-clamp-2">
              {item.label || "No stat label"}
            </p>
          </div>
        </div>
      )}
    />
  );
}

