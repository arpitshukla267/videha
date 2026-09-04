"use client";
import { ContentManager } from "@/components/content-manager";
import { buyerExpectationsApi, type BuyerExpectation } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function BuyerExpectationsPage() {
  return (
    <ContentManager<BuyerExpectation>
      title="Buyer Expectations"
      description="The 5 buyer expectation points shown in the Why Videha section."
      api={buyerExpectationsApi}
      emptyDefaults={{ title: "", copy: "", isActive: true, order: 0 }}
      fields={[
        { key: "title", label: "Title", type: "text", span: "full", placeholder: "Consistent supply" },
        { key: "copy", label: "Copy", type: "textarea", span: "full", rows: 3 },
        { key: "order", label: "Order", type: "number" },
      ]}
      renderRow={(item) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">{item.title}</span>
            <Badge variant={item.isActive ? "success" : "warning"}>{item.isActive ? "Active" : "Hidden"}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{item.copy}</p>
        </div>
      )}
    />
  );
}
