"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import type { UploadContext, UploadSection } from "@/lib/upload-context";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { ActiveToggle } from "@/components/ui/active-toggle";
import { optimisticToggle } from "@/lib/optimistic-toggle";

export type FieldDef =
  | { key: string; label: string; type: "text"; placeholder?: string; span?: "full" }
  | { key: string; label: string; type: "textarea"; rows?: number; span?: "full" }
  | { key: string; label: string; type: "image" }
  | { key: string; label: string; type: "number"; span?: "full" };

interface ContentManagerProps<T extends { _id: string; isActive?: boolean; order?: number }> {
  title: string;
  description?: string;
  fields: FieldDef[];
  uploadSection?: UploadSection;
  uploadIdentifier?: (item: Partial<T>) => string;
  gridCols?: string;
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
  uploadSection,
  uploadIdentifier,
  gridCols = "grid-cols-1 md:grid-cols-2 gap-6",
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
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
    setTogglingId(item._id);
    try {
      await optimisticToggle(item, setItems, api.toggle, {
        on: "Shown on site",
        off: "Hidden from site",
      });
    } finally {
      setTogglingId(null);
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
        action={
          <Button onClick={openNew} size="lg" className="shadow-md shadow-purple-600/20">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className={`grid ${gridCols}`}>
          {items.map((item) => (
            <Card key={item._id} className="overflow-hidden flex flex-col justify-between group hover:border-purple-300 hover:shadow-md transition-all duration-200">
              <CardBody className="p-5">
                {renderRow(item)}
              </CardBody>

              <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  {item.isActive !== undefined && (
                    <ActiveToggle
                      active={Boolean(item.isActive)}
                      loading={togglingId === item._id}
                      onToggle={() => toggle(item)}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
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
                if (!uploadSection || !uploadIdentifier) {
                  return null;
                }
                const uploadContext: UploadContext = {
                  section: uploadSection,
                  identifier: uploadIdentifier(editing),
                  field: f.key,
                };
                return (
                  <div key={f.key} className="col-span-2">
                    <ImageUpload
                      label={f.label}
                      value={val}
                      onChange={(url) => setField(f.key, url)}
                      uploadContext={uploadContext}
                    />
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Visibility Status</label>
              <ActiveToggle
                active={Boolean((editing as any).isActive)}
                onToggle={() => setField("isActive", !(editing as any).isActive)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{(editing as any)._id ? "Save Changes" : "Create Item"}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title={`Delete ${title}?`} size="sm">
        <p className="text-sm text-slate-600 mb-6">This action will permanently delete this item.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteId && doDelete(deleteId)}>Delete Item</Button>
        </div>
      </Modal>
    </div>
  );
}

