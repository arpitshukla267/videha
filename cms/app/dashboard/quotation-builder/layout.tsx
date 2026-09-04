/**
 * Full-bleed layout so the standalone Quotation Builder owns the viewport
 * beside the CMS sidebar — no shared CMS chrome inside the builder itself.
 */
export default function QuotationBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 left-72 z-30 overflow-hidden bg-[#EBE5D9] h-screen">
      {children}
    </div>
  );
}
