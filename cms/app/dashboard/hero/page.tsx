"use client";
import { useEffect, useState, useCallback } from "react";
import { heroApi, type HeroStory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { resolveMediaUrl } from "@/lib/media-url";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Image as ImageIcon, ExternalLink, Sparkles } from "lucide-react";

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

  const heroIdentifier = editing.id || editing.label || "new-story";

  return (
    <div>
      <PageHeader
        title="Hero Stories"
        description="Manage hero slides and visual feature stories displayed on the homepage slider."
        action={
          <Button onClick={openNew} size="lg" className="shadow-md shadow-purple-600/20">
            <Plus className="w-4 h-4" /> Add Story
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((s) => (
            <Card
              key={s._id}
              className="overflow-hidden flex flex-col justify-between group hover:border-purple-300 hover:shadow-lg transition-all duration-200"
            >
              <div>
                {/* Hero Image Container */}
                <div className="relative w-full h-56 bg-slate-900 overflow-hidden">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(s.image)}
                      alt={s.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}

                  {/* Gradient Overlay for text readability preview */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Active / Hidden status badge top right */}
                  <div className="absolute top-3 right-3">
                    <Badge variant={s.isActive ? "success" : "warning"}>
                      {s.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </div>

                  {/* Image overlay heading snippet */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-widest">{s.label}</p>
                    <h3 className="font-bold text-lg sm:text-xl line-clamp-1 leading-snug">{s.heading?.join(" ")}</h3>
                  </div>
                </div>


                {/* Card Content Body */}
                <CardBody className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {s.description || "No slide description."}
                  </p>

                  {s.ctaLabel && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100/80">
                      <span className="text-[11px] font-bold uppercase text-purple-400">CTA:</span>
                      <span>{s.ctaLabel}</span>
                      {s.ctaHref && <span className="text-slate-400 font-normal">({s.ctaHref})</span>}
                    </div>
                  )}
                </CardBody>
              </div>

              {/* Action Bar Footer */}
              <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => toggle(s)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-600 transition-colors"
                >
                  {s.isActive ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-[11px]">{s.isActive ? "Active" : "Hidden"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit Slide
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
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Story ID" value={editing.id || ""} onChange={(e) => setField("id", e.target.value)} placeholder="makhana" hint="Unique identifier" />
            <Input label="Number" value={editing.number || ""} onChange={(e) => setField("number", e.target.value)} placeholder="01" />
            <Input label="Label" value={editing.label || ""} onChange={(e) => setField("label", e.target.value)} placeholder="Premium Makhana" className="col-span-2" />
          </div>

          {/* Heading (2 lines) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Heading (2 lines)</label>
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

          <Textarea label="Description" value={editing.description || ""} onChange={(e) => setField("description", e.target.value)} rows={3} />
          <Input label="Alt text" value={editing.alt || ""} onChange={(e) => setField("alt", e.target.value)} />

          <ImageUpload
            label="Desktop Image"
            value={editing.image || ""}
            onChange={(url) => setField("image", url)}
            uploadContext={{ section: "hero", identifier: heroIdentifier, field: "desktop" }}
          />
          <ImageUpload
            label="Mobile Image (optional)"
            value={editing.mobileImage || ""}
            onChange={(url) => setField("mobileImage", url)}
            uploadContext={{ section: "hero", identifier: heroIdentifier, field: "mobile" }}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input label="CTA Label" value={editing.ctaLabel || ""} onChange={(e) => setField("ctaLabel", e.target.value)} placeholder="Enquire Now" />
            <Input label="CTA Link" value={editing.ctaHref || ""} onChange={(e) => setField("ctaHref", e.target.value)} placeholder="/contact?product=..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Order" type="number" value={String(editing.order ?? 0)} onChange={(e) => setField("order", Number(e.target.value))} />
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Visibility Status</label>
              <button
                onClick={() => setField("isActive", !editing.isActive)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  editing.isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                {editing.isActive ? <><ToggleRight className="w-5 h-5 text-emerald-600" /> Active</> : <><ToggleLeft className="w-5 h-5 text-slate-400" /> Hidden</>}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing._id ? "Save Changes" : "Create Story"}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Story?" size="sm">
        <p className="text-sm text-slate-600 mb-6">This action will permanently remove this hero story slide.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteId && doDelete(deleteId)}>Delete Story</Button>
        </div>
      </Modal>
    </div>
  );
}

