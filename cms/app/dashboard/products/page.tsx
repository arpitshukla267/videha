"use client";
import { useEffect, useState, useCallback } from "react";
import { productsApi, type Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, GripVertical } from "lucide-react";

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
    try {
      await productsApi.toggle(p._id);
      toast.success(p.isActive ? "Product hidden" : "Product shown");
      load();
    } catch (e: any) {
      toast.error(e.message);
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
        title="Products"
        description="Manage your product catalogue — all 10 makhana products and their details."
        action={<Button onClick={openNew} size="lg"><Plus className="w-4 h-4" /> Add Product</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <Card key={p._id} className="overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3">
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />

                {/* Image thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image.startsWith("/uploads/")
                      ? `${process.env.NEXT_PUBLIC_API_URL}${p.image}`
                      : `http://localhost:3005${p.image}`}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">#{p.index}</span>
                    <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                    <Badge variant={p.isActive ? "success" : "warning"}>
                      {p.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{p.copy}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.meta.slice(0, 3).map((m) => (
                      <Badge key={m} variant="outline">{m}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(p)}
                    className="text-slate-400 hover:text-accent transition-colors"
                    title={p.isActive ? "Hide" : "Show"}
                  >
                    {p.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
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
        <div className="flex flex-col gap-5">
          {/* Basic */}
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Basic Info</h3>
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
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Image</h3>
            <ImageUpload
              value={editing.image || ""}
              onChange={(url) => setField("image", url)}
              hint="Upload a new image or enter a path (e.g. /images/product.jpeg)"
            />
          </section>

          {/* Listing Card Copy */}
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Listing Card</h3>
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
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Detail Page</h3>
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
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Quality Parameters</h3>
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
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Commercial Details</h3>
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
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Processing Steps</h3>
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
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
          <section>
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Order" type="number" value={String(editing.order ?? 0)} onChange={(e) => setField("order", Number(e.target.value))} />
              <div className="flex flex-col gap-1 justify-end">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Visibility</label>
                <button
                  onClick={() => setField("isActive", !editing.isActive)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                    editing.isActive ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  {editing.isActive
                    ? <><ToggleRight className="w-4 h-4" /> Active (visible)</>
                    : <><ToggleLeft className="w-4 h-4" /> Hidden</>}
                </button>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>
              {editing._id ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product?" size="sm">
        <p className="text-sm text-slate-600 mb-6">This will permanently delete this product. This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteId && doDelete(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
