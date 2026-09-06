"use client";
import { ContentManager } from "@/components/content-manager";
import { qualityPointsApi, type QualityPoint } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Award, CheckCircle2 } from "lucide-react";

export default function QualityPointsPage() {
  return (
    <ContentManager<QualityPoint>
      title="Quality Assurance Points"
      description="Quality factors and grade consistency standards displayed in the Quality section."
      gridCols="grid-cols-1 md:grid-cols-2 gap-6"
      api={qualityPointsApi}
      emptyDefaults={{ title: "", copy: "", isActive: true, order: 0 }}
      fields={[
        { key: "title", label: "Title", type: "text", span: "full", placeholder: "Size & colour consistency" },
        { key: "copy", label: "Copy", type: "textarea", span: "full", rows: 3 },
        { key: "order", label: "Order", type: "number" },
      ]}
      renderRow={(item) => (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
            </div>
            <Badge variant={item.isActive ? "success" : "warning"}>
              {item.isActive ? "Active" : "Hidden"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed pl-12">
            {item.copy || "No description provided."}
          </p>
        </div>
      )}
    />
  );
}

