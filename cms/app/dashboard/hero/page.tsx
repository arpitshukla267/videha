"use client";
import { useEffect, useState, useCallback } from "react";
import { heroApi, type HeroStory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

const EMPTY: Partial<HeroStory> = {
  id: "", number: "", label: "",
  heading: ["", ""],
  description: "", image: "", mobileImage: "", alt: "",
  ctaLabel: "", ctaHref: "", isActive: true, order: 0,
};

export default function HeroPage() {
  const [stories, setStories] = useState<HeroStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<HeroStory>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await heroApi.list();
      setStories(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load hero stories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing({ ...EMPTY, order: stories.length + 1, number: String(stories.length + 1).padStart(2, "0") });
    setModalOpen(true);
  }

  function openEdit(s: HeroStory) {
    setEditing({ ...s });
    setModalOpen(true);
  }

  function setField<K extends keyof HeroStory>(key: K, value: HeroStory[K]) {
    setEditing((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!editing.label) { toast.error("Label is required"); return; }
    setSaving(true);
    try {
      if (editing._id) {
        await heroApi.update(editing._id, editing);
        toast.success("Story updated");
      } else {
        await heroApi.create(editing);
        toast.success("Story created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(s: HeroStory) {
    try {
      await heroApi.toggle(s._id);
      toast.success(s.isActive ? "Story hidden" : "Story shown");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function doDelete(id: string) {
    try {
      await heroApi.delete(id);
      toast.success("Story deleted");
      setDeleteId(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  return (
    <div>
      <PageHeader
        title="Hero Stories"
        description="Manage the 5 hero slides shown at the top of the homepage."
        action={<Button onClick={openNew} size="lg"><Plus className="w-4 h-4" /> Add Story</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {stories.map((s) => (
            <Card key={s._id} className="overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image.startsWith("/uploads/") ? `${API}${s.image}` : `http://localhost:3005${s.image}`}
                    alt={s.label}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">#{s.number}</span>
                    <span className="font-semibold text-slate-900 text-sm">{s.label}</span>
                    <Badge variant={s.isActive ? "success" : "warning"}>
                      {s.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{s.heading.join(" ")}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{s.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(s)} className="text-slate-400 hover:text-accent transition-colors">
                    {s.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(s._id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing._id ? "Edit Hero Story" : "Add Hero Story"} size="lg">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Story ID" value={editing.id || ""} onChange={(e) => setField("id", e.target.value)} placeholder="makhana" hint="Unique identifier (no spaces)" />
            <Input label="Number" value={editing.number || ""} onChange={(e) => setField("number", e.target.value)} placeholder="01" />
            <Input label="Label" value={editing.label || ""} onChange={(e) => setField("label", e.target.value)} placeholder="Premium Makhana" className="col-span-2" />
          </div>

          {/* Heading (2 lines) */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Heading (2 lines)</label>
            <div className="flex flex-col gap-2">
              <Input
                value={editing.heading?.[0] || ""}
                onChange={(e) => setField("heading", [e.target.value, editing.heading?.[1] || ""])}
                placeholder="Line 1 (e.g. Premium Makhana,)"
              />
              <Input
                value={editing.heading?.[1] || ""}
                onChange={(e) => setField("heading", [editing.heading?.[0] || "", e.target.value])}
                placeholder="Line 2 (e.g. Sourced from India.)"
              />
            </div>
          </div>

          <Textarea label="Description" value={editing.description || ""} onChange={(e) => setField("description", e.target.value)} rows={3} />
          <Input label="Alt text" value={editing.alt || ""} onChange={(e) => setField("alt", e.target.value)} />

          <ImageUpload label="Desktop Image" value={editing.image || ""} onChange={(url) => setField("image", url)} />
          <ImageUpload label="Mobile Image (optional)" value={editing.mobileImage || ""} onChange={(url) => setField("mobileImage", url)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="CTA Label" value={editing.ctaLabel || ""} onChange={(e) => setField("ctaLabel", e.target.value)} placeholder="Enquire Now" />
            <Input label="CTA Link" value={editing.ctaHref || ""} onChange={(e) => setField("ctaHref", e.target.value)} placeholder="/contact?product=..." />
          </div>

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
                {editing.isActive ? <><ToggleRight className="w-4 h-4" /> Active</> : <><ToggleLeft className="w-4 h-4" /> Hidden</>}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing._id ? "Save Changes" : "Create Story"}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Story?" size="sm">
        <p className="text-sm text-slate-600 mb-6">This will permanently delete this hero story.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteId && doDelete(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
