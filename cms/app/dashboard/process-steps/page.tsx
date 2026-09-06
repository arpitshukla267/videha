"use client";
import { ContentManager } from "@/components/content-manager";
import { processStepsApi, type ProcessStep } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/media-url";

export default function ProcessStepsPage() {
  return (
    <ContentManager<ProcessStep>
      title="Process Steps"
      description="Manage the 7-step export workflow shown in the Our Process section."
      uploadSection="process-steps"
      gridCols="grid-cols-1 md:grid-cols-2 gap-6"
      uploadIdentifier={(item) => {
        const num = String(item.num || "00").padStart(2, "0");
        const label = String(item.label || "step")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        return `${num}-${label || "step"}`;
      }}
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
        <div className="space-y-3">
          {item.image && (
            <div className="-mx-5 -mt-5 mb-4 h-48 w-[calc(100%+2.5rem)] overflow-hidden bg-slate-100 border-b border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(item.image)} alt={item.heading} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-mono font-bold text-base flex items-center justify-center shadow-md shadow-purple-600/30 shrink-0">
                {item.num || "00"}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">{item.label}</span>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.heading}</h3>
              </div>
            </div>

            <Badge variant={item.isActive ? "success" : "warning"}>
              {item.isActive ? "Active" : "Hidden"}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {item.copy || "No description copy provided."}
          </p>
        </div>
      )}


    />
  );
}

