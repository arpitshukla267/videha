"use client";
import { ContentManager } from "@/components/content-manager";
import { processStepsApi, type ProcessStep } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function ProcessStepsPage() {
  return (
    <ContentManager<ProcessStep>
      title="Process Steps"
      description="The 7-step export process shown in the Our Process section."
      api={processStepsApi}
      emptyDefaults={{ num: "", label: "", heading: "", copy: "", image: "", isActive: true, order: 0 }}
      fields={[
        { key: "num", label: "Step Number", type: "text", placeholder: "01" },
        { key: "label", label: "Label", type: "text", placeholder: "Requirement" },
        { key: "heading", label: "Heading", type: "text", span: "full", placeholder: "Understanding buyer requirements" },
        { key: "copy", label: "Copy", type: "textarea", span: "full", rows: 3 },
        { key: "image", label: "Image", type: "image" },
        { key: "order", label: "Order", type: "number" },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">#{item.num}</span>
            <span className="font-semibold text-slate-900 text-sm">{item.label}</span>
            <span className="text-sm text-slate-600">— {item.heading}</span>
            <Badge variant={item.isActive ? "success" : "warning"}>{item.isActive ? "Active" : "Hidden"}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{item.copy}</p>
        </div>
      )}
    />
  );
}
