"use client";
import { ContentManager } from "@/components/content-manager";
import { introFactsApi, type IntroFact } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function IntroFactsPage() {
  return (
    <ContentManager<IntroFact>
      title="Intro Facts"
      description="The 3 stats shown in the intro/about section (e.g. 12+ Global markets)."
      api={introFactsApi}
      emptyDefaults={{ value: "", label: "", isActive: true, order: 0 }}
      fields={[
        { key: "value", label: "Value", type: "text", placeholder: "12+" },
        { key: "label", label: "Label", type: "text", placeholder: "Global markets served" },
        { key: "order", label: "Order", type: "number" },
      ]}
      renderRow={(item) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600">{item.value}</span>
          <span className="text-sm text-slate-700">{item.label}</span>
          <Badge variant={item.isActive ? "success" : "warning"}>{item.isActive ? "Active" : "Hidden"}</Badge>
        </div>
      )}
    />
  );
}
