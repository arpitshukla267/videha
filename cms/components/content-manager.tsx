"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, GripVertical } from "lucide-react";

export type FieldDef =
  | { key: string; label: string; type: "text"; placeholder?: string; span?: "full" }
  | { key: string; label: string; type: "textarea"; rows?: number; span?: "full" }
  | { key: string; label: string; type: "image" }
  | { key: string; label: string; type: "number"; span?: "full" };

interface ContentManagerProps<T extends { _id: string; isActive?: boolean; order?: number }> {
  title: string;
  description?: string;
  fields: FieldDef[];
  api: {
    list: () => Promise<T[]>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: string, data: Partial<T>) => Promise<T>;
    toggle: (id: string) => Promise<T>;
    delete: (id: string) => Promise<any>;
  };
  renderRow: (item: T) => React.ReactNode;
  emptyDefaults: Partial<T>;
}

export function ContentManager<T extends { _id: string; isActive?: boolean; order?: number }>({
  title,
  description,
  fields,
  api,
  renderRow,
  emptyDefaults,
}: ContentManagerProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<T>>(emptyDefaults);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.list());
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing({ ...emptyDefaults, order: items.length + 1 } as Partial<T>);
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditing({ ...item });
    setModalOpen(true);
  }

  function setField(key: string, value: any) {
    setEditing((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      if ((editing as any)._id) {
        await api.update((editing as any)._id, editing);
        toast.success("Updated");
      } else {
        await api.create(editing);
        toast.success("Created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: T) {
    try {
      await api.toggle(item._id);
      toast.success((item as any).isActive ? "Hidden" : "Shown");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function doDelete(id: string) {
    try {
      await api.delete(id);
      toast.success("Deleted");
      setDeleteId(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={<Button onClick={openNew} size="lg"><Plus className="w-4 h-4" /> Add</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3">
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="flex-1 min-w-0">{renderRow(item)}</div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.isActive !== undefined && (
                    <button onClick={() => toggle(item)} className="text-slate-400 hover:text-accent transition-colors">
                      {item.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(item._id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={(editing as any)._id ? `Edit ${title}` : `Add ${title}`} size="lg">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => {
              const val = (editing as any)[f.key] ?? "";
              if (f.type === "image") {
                return (
                  <div key={f.key} className="col-span-2">
                    <ImageUpload label={f.label} value={val} onChange={(url) => setField(f.key, url)} />
                  </div>
                );
              }
              if (f.type === "textarea") {
                return (
                  <div key={f.key} className={f.span === "full" ? "col-span-2" : "col-span-2"}>
                    <Textarea label={f.label} value={val} onChange={(e) => setField(f.key, e.target.value)} rows={f.rows || 3} />
                  </div>
                );
              }
              return (
                <div key={f.key} className={f.span === "full" ? "col-span-2" : ""}>
                  <Input
                    label={f.label}
                    type={f.type === "number" ? "number" : "text"}
                    value={String(val)}
                    onChange={(e) => setField(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                    placeholder={(f as any).placeholder}
                  />
                </div>
              );
            })}
          </div>

          {/* Visibility toggle */}
          {(editing as any).isActive !== undefined && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Visibility</label>
              <button
                onClick={() => setField("isActive", !(editing as any).isActive)}
                className={`w-fit flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                  (editing as any).isActive ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                {(editing as any).isActive
                  ? <><ToggleRight className="w-4 h-4" /> Active</>
                  : <><ToggleLeft className="w-4 h-4" /> Hidden</>}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{(editing as any)._id ? "Save Changes" : "Create"}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title={`Delete ${title}?`} size="sm">
        <p className="text-sm text-slate-600 mb-6">This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteId && doDelete(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
