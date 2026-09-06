"use client";
import { useEffect, useState, useCallback } from "react";
import { productsApi, type Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { resolveMediaUrl } from "@/lib/media-url";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, GripVertical, Package } from "lucide-react";
import { ActiveToggle } from "@/components/ui/active-toggle";
import { optimisticToggle } from "@/lib/optimistic-toggle";

const EMPTY: Partial<Product> = {
  index: "", slug: "", name: "", image: "", copy: "",
  meta: [], grade: "", format: "", application: "", packaging: "",
  tagline: "", description: "", origin: "", gradeSize: "", appearance: "",
  moisture: "", qualityParameters: [], packagingOptions: "", moq: "",
  shelfLife: "", privateLabel: "", bulkSupply: "", exportMarkets: "",
  sampleAvailability: "", processingSteps: [], isActive: true, order: 0,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.list();
      setProducts(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing({ ...EMPTY, order: products.length + 1, index: String(products.length + 1).padStart(2, "0") });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing({ ...p });
    setModalOpen(true);
  }

  async function save() {
    if (!editing.name) { toast.error("Product name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        slug: editing.slug || slugify(editing.name || ""),
      };
      if (editing._id) {
        await productsApi.update(editing._id, payload);
        toast.success("Product updated");
      } else {
        await productsApi.create(payload);
        toast.success("Product created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(p: Product) {
    setTogglingId(p._id);
    try {
      await optimisticToggle(p, setProducts, productsApi.toggle, {
        on: "Product shown on site",
        off: "Product hidden from site",
      });
    } finally {
      setTogglingId(null);
    }
  }

  async function doDelete(id: string) {
    try {
      await productsApi.delete(id);
      toast.success("Product deleted");
      setDeleteId(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function setField<K extends keyof Product>(key: K, value: Product[K]) {
    setEditing((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        title="Products Catalogue"
        description="Manage your product catalogue — makhana products, specifications, and commercial details."
        action={
          <Button onClick={openNew} size="lg" className="shadow-md shadow-purple-600/20">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <Card key={p._id} className="overflow-hidden flex flex-col justify-between group hover:border-purple-300 hover:shadow-lg transition-all duration-200">
              <div>
                {/* Product Image Header Container */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(p.image)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-12 h-12" />
                    </div>
                  )}

                  {/* Index badge top left */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-full font-semibold">
                    #{p.index || "00"}
                  </div>

                  {/* Active / Hidden status top right */}
                  <div className="absolute top-3 right-3">
                    <Badge variant={p.isActive ? "success" : "warning"}>
                      {p.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                </div>

                {/* Card Content Body */}
                <CardBody className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-600 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {p.copy || p.tagline || "No description provided."}
                    </p>
                  </div>

                  {/* Meta tags chips */}
                  {p.meta && p.meta.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.meta.slice(0, 3).map((m) => (
                        <span key={m} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-100">
                          {m}
                        </span>
                      ))}
                      {p.meta.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                          +{p.meta.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </CardBody>
              </div>

              {/* Action Bar Footer */}
              <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <ActiveToggle
                  active={Boolean(p.isActive)}
                  loading={togglingId === p._id}
                  onToggle={() => toggle(p)}
                />

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(p._id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing._id ? "Edit Product" : "Add Product"} size="xl">
        <div className="flex flex-col gap-6">
          {/* Basic */}
          <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Basic Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Index" value={editing.index || ""} onChange={(e) => setField("index", e.target.value)} placeholder="01" />
              <Input
                label="Slug"
                value={editing.slug || ""}
                onChange={(e) => setField("slug", e.target.value)}
                hint="Auto-generated from name if blank"
                placeholder="raw-plain-makhana"
              />
              <Input label="Name" value={editing.name || ""} onChange={(e) => {
                setField("name", e.target.value);
                if (!editing._id) setField("slug", slugify(e.target.value));
              }} className="col-span-2" />
              <Input label="Tagline" value={editing.tagline || ""} onChange={(e) => setField("tagline", e.target.value)} className="col-span-2" />
            </div>
          </section>

          {/* Image */}
          <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Product Image</h3>
            <ImageUpload
              value={editing.image || ""}
              onChange={(url) => setField("image", url)}
              hint="Uploaded to Cloudinary as products/{slug}/main"
              uploadContext={{
                section: "products",
                identifier: editing.slug || slugify(editing.name || "") || "new-product",
                field: "main",
              }}
            />
          </section>

          {/* Listing Card Copy */}
          <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Listing Card Details</h3>
            <div className="flex flex-col gap-3">
              <Textarea label="Copy (card description)" value={editing.copy || ""} onChange={(e) => setField("copy", e.target.value)} rows={2} />
              <Input
                label="Meta tags (comma separated)"
                value={(editing.meta || []).join(", ")}
                onChange={(e) => setField("meta", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="Raw / Plain, Bulk Supply, Size Graded"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Grade" value={editing.grade || ""} onChange={(e) => setField("grade", e.target.value)} />
                <Input label="Format" value={editing.format || ""} onChange={(e) => setField("format", e.target.value)} />
                <Input label="Application" value={editing.application || ""} onChange={(e) => setField("application", e.target.value)} />
                <Input label="Packaging" value={editing.packaging || ""} onChange={(e) => setField("packaging", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Detail Page */}
          <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Detail Page Specs</h3>
            <div className="flex flex-col gap-3">
              <Textarea label="Description" value={editing.description || ""} onChange={(e) => setField("description", e.target.value)} rows={4} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Origin" value={editing.origin || ""} onChange={(e) => setField("origin", e.target.value)} />
                <Input label="Grade / Size" value={editing.gradeSize || ""} onChange={(e) => setField("gradeSize", e.target.value)} />
              </div>
              <Textarea label="Appearance" value={editing.appearance || ""} onChange={(e) => setField("appearance", e.target.value)} rows={2} />
              <Input label="Moisture" value={editing.moisture || ""} onChange={(e) => setField("moisture", e.target.value)} />
            </div>
          </section>

          {/* Quality Parameters */}
          <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Quality Parameters</h3>
            <div className="flex flex-col gap-2">
              {(editing.qualityParameters || []).map((qp, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={qp.label}
                    onChange={(e) => {
                      const updated = [...(editing.qualityParameters || [])];
                      updated[i] = { ...updated[i], label: e.target.value };
                      setField("qualityParameters", updated);
                    }}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={qp.value}
                    onChange={(e) => {
                      const updated = [...(editing.qualityParameters || [])];
                      updated[i] = { ...updated[i], value: e.target.value };
                      setField("qualityParameters", updated);
                    }}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <button
                    onClick={() => {
                      const updated = (editing.qualityParameters || []).filter((_, idx) => idx !== i);
                      setField("qualityParameters", updated);
                    }}
                    className="text-rose-400 hover:text-rose-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setField("qualityParameters", [...(editing.qualityParameters || []), { label: "", value: "" }])}
              >
                <Plus className="w-3 h-3" /> Add Parameter
              </Button>
            </div>
          </section>

          {/* Commercial */}
          <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Commercial Details</h3>
            <div className="flex flex-col gap-3">
              <Textarea label="Packaging Options" value={editing.packagingOptions || ""} onChange={(e) => setField("packagingOptions", e.target.value)} rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="MOQ" value={editing.moq || ""} onChange={(e) => setField("moq", e.target.value)} />
                <Input label="Shelf Life" value={editing.shelfLife || ""} onChange={(e) => setField("shelfLife", e.target.value)} />
              </div>
              <Textarea label="Private Label" value={editing.privateLabel || ""} onChange={(e) => setField("privateLabel", e.target.value)} rows={2} />
              <Textarea label="Bulk Supply" value={editing.bulkSupply || ""} onChange={(e) => setField("bulkSupply", e.target.value)} rows={2} />
              <Input label="Export Markets" value={editing.exportMarkets || ""} onChange={(e) => setField("exportMarkets", e.target.value)} />
              <Input label="Sample Availability" value={editing.sampleAvailability || ""} onChange={(e) => setField("sampleAvailability", e.target.value)} />
            </div>
          </section>

          {/* Processing Steps */}
          <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Processing Steps</h3>
            <div className="flex flex-col gap-2">
              {(editing.processingSteps || []).map((step, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-slate-400 font-mono w-5 text-right">{i + 1}</span>
                  <Input
                    value={step}
                    onChange={(e) => {
                      const updated = [...(editing.processingSteps || [])];
                      updated[i] = e.target.value;
                      setField("processingSteps", updated);
                    }}
                    className="flex-1"
                    placeholder="Step description"
                  />
                  <button
                    onClick={() => setField("processingSteps", (editing.processingSteps || []).filter((_, idx) => idx !== i))}
                    className="text-rose-400 hover:text-rose-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setField("processingSteps", [...(editing.processingSteps || []), ""])}
              >
                <Plus className="w-3 h-3" /> Add Step
              </Button>
            </div>
          </section>

          {/* Settings */}
          <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest">Display Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Order" type="number" value={String(editing.order ?? 0)} onChange={(e) => setField("order", Number(e.target.value))} />
              <div className="flex flex-col gap-1.5 justify-end">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Visibility Status</label>
                <ActiveToggle
                  active={Boolean(editing.isActive)}
                  onToggle={() => setField("isActive", !editing.isActive)}
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>
              {editing._id ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product?" size="sm">
        <p className="text-sm text-slate-600 mb-6">This action will permanently remove this product from the database.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteId && doDelete(deleteId)}>Delete Product</Button>
        </div>
      </Modal>
    </div>
  );
}

