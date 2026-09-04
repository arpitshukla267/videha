import { CheckCircle2, FileText } from "lucide-react";

interface DocumentItem {
  title: string;
  note?: string;
}

const DOCUMENTS: DocumentItem[] = [
  {
    title: "Commercial Invoice",
  },
  {
    title: "Packing List",
  },
  {
    title: "Certificate of Origin",
  },
  {
    title: "COA",
  },
  {
    title: "Phytosanitary Certificate",
    note: "Where applicable",
  },
  {
    title: "Fumigation Certificate",
    note: "Where applicable",
  },
  {
    title: "Shipping Documents",
  },
  {
    title: "Other Destination-Specific Documents",
  },
];

export function ExportDocumentation() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-[95vw] md:max-w-[90vw] px-5 py-14 sm:px-8 md:px-10 md:py-16 xl:px-12">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary" />

              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-primary">
                Export Documentation
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-medium leading-[1.05] tracking-[-0.04em] text-foreground sm:text-3xl">
              Documentation for Global Trade
            </h2>
            <p className="max-w-xl mt-2 text-sm leading-[1.7] text-muted-foreground text-left">
              Documentation can be arranged as applicable to the product,
              destination country and buyer requirement.
            </p>
          </div>
        </div>

        {/* Documentation List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
          {DOCUMENTS.map((document, index) => (
            <div
              key={document.title}
              className="flex items-center justify-between gap-5 border-b border-border py-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="text-sm font-medium text-foreground">
                  {document.title}
                </span>
              </div>

              {document.note ? (
                <span className="shrink-0 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  {document.note}
                </span>
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              )}
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="mt-7 flex items-start gap-3">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

          <p className="max-w-3xl text-xs leading-[1.7] text-muted-foreground">
            Additional destination-specific documents can be coordinated based
            on applicable regulations, product requirements and buyer
            instructions.
          </p>
        </div>
      </div>
    </section>
  );
}
