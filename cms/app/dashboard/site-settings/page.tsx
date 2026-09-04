"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, FileText } from "lucide-react";
import { siteSettingsApi, uploadFile } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";

type Tab = "contact" | "registrations" | "brochure";

type ContactForm = {
  companyName: string;
  brandName: string;
  tagline: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  addressLines: string[];
  social: { facebook: string; instagram: string; linkedin: string; whatsapp: string };
  copyrightTagline: string;
};

type RegItem = {
  /** Stable React key — never change after create */
  _key: string;
  id: string;
  label: string;
  shortLabel: string;
  value: string;
};

type BrochureForm = {
  enabled: boolean;
  label: string;
  url: string;
  fileName: string;
};

const DEFAULT_REG_ITEMS: Omit<RegItem, "_key">[] = [
  { id: "iec", label: "IEC (Import Export Code)", shortLabel: "IEC", value: "AAMCV3205B" },
  { id: "gst", label: "GST Registration", shortLabel: "GST", value: "27AAMCV3205B1ZM" },
  { id: "fssai", label: "FSSAI License", shortLabel: "FSSAI", value: "11526996000869" },
  { id: "apeda-rcmc", label: "APEDA / RCMC", shortLabel: "APEDA / RCMC", value: "RCMC/APEDA/33029/2026-2027" },
];

const DEFAULT_DISCLAIMER =
  "We do not display product or system certifications (such as ISO, HACCP, Organic, Halal, Kosher, or US FDA registration) unless a valid, current certificate has been confirmed and supplied by Videha Overseas.";

const TABS: { id: Tab; label: string }[] = [
  { id: "contact", label: "Contact Details" },
  { id: "registrations", label: "Registrations" },
  { id: "brochure", label: "Brochure" },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    || `reg-${Date.now()}`;
}

function withKeys(items: Array<{ id: string; label: string; shortLabel: string; value: string }>): RegItem[] {
  return items.map((item, i) => ({
    ...item,
    _key: item.id || `row-${i}-${Math.random().toString(36).slice(2, 8)}`,
  }));
}

export default function SiteSettingsPage() {
  const [tab, setTab] = useState<Tab>("contact");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [contact, setContact] = useState<ContactForm>({
    companyName: "",
    brandName: "",
    tagline: "",
    email: "",
    phone: "",
    phoneDisplay: "",
    addressLines: [""],
    social: { facebook: "", instagram: "", linkedin: "", whatsapp: "" },
    copyrightTagline: "",
  });

  const [regDisclaimer, setRegDisclaimer] = useState(DEFAULT_DISCLAIMER);
  const [regItems, setRegItems] = useState<RegItem[]>(() => withKeys(DEFAULT_REG_ITEMS));

  const [brochure, setBrochure] = useState<BrochureForm>({
    enabled: true,
    label: "Download Brochure",
    url: "",
    fileName: "",
  });

  useEffect(() => {
    siteSettingsApi
      .getAll()
      .then((cfg) => {
        if (cfg.contact) setContact(cfg.contact as ContactForm);

        if (cfg.registrations) {
          const r = cfg.registrations as { disclaimer?: string; items?: Array<{ id: string; label: string; shortLabel: string; value: string }> };
          setRegDisclaimer(r.disclaimer || DEFAULT_DISCLAIMER);
          if (r.items && r.items.length > 0) {
            setRegItems(withKeys(r.items));
          }
        }

        if (cfg.brochure) setBrochure(cfg.brochure as BrochureForm);
      })
      .catch((e) => toast.error(e.message || "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  function updateReg(i: number, patch: Partial<RegItem>) {
    setRegItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function addRegistration() {
    const key = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setRegItems((prev) => [
      ...prev,
      { _key: key, id: "", label: "", shortLabel: "", value: "" },
    ]);
  }

  async function save() {
    setSaving(true);
    try {
      if (tab === "contact") {
        await siteSettingsApi.update("contact", contact);
      } else if (tab === "registrations") {
        const cleaned = regItems
          .map((item) => {
            const shortLabel = item.shortLabel.trim() || item.label.trim();
            const label = item.label.trim() || shortLabel;
            const value = item.value.trim();
            const id = (item.id.trim() || slugify(shortLabel || label)).trim();
            return { id, label, shortLabel, value };
          })
          .filter((item) => item.label && item.value);

        if (cleaned.length === 0) {
          toast.error("Add at least one registration with a label and value");
          setSaving(false);
          return;
        }

        // Ensure unique ids
        const seen = new Set<string>();
        const unique = cleaned.map((item) => {
          let id = item.id;
          if (seen.has(id)) id = `${id}-${Math.random().toString(36).slice(2, 5)}`;
          seen.add(id);
          return { ...item, id };
        });

        await siteSettingsApi.update("registrations", {
          disclaimer: regDisclaimer,
          items: unique,
        });

        // Refresh local state from what we saved so UI matches DB
        setRegItems(withKeys(unique));
      } else {
        await siteSettingsApi.update("brochure", brochure);
      }
      toast.success("Saved — refresh the website to see changes");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleBrochureUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setBrochure((b) => ({
        ...b,
        url,
        fileName: file.name,
      }));
      toast.success("Brochure uploaded — click Save Changes");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Site Settings"
        description="Contact details, business registrations, and brochure — synced to footer, nav, contact page, and more."
        action={
          <Button onClick={save} loading={saving} size="lg" className="px-6 py-3">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "contact" && (
        <Card>
          <CardBody className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Company Name" value={contact.companyName} onChange={(e) => setContact({ ...contact, companyName: e.target.value })} />
              <Input label="Brand Name" value={contact.brandName} onChange={(e) => setContact({ ...contact, brandName: e.target.value })} />
              <div className="md:col-span-2">
                <Input label="Tagline" value={contact.tagline} onChange={(e) => setContact({ ...contact, tagline: e.target.value })} />
              </div>
              <Input label="Email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              <Input label="Phone (tel link)" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} hint="+919373923799" />
              <Input label="Phone Display" value={contact.phoneDisplay} onChange={(e) => setContact({ ...contact, phoneDisplay: e.target.value })} />
              <Input label="Copyright Tagline" value={contact.copyrightTagline} onChange={(e) => setContact({ ...contact, copyrightTagline: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Address Lines</label>
              <div className="space-y-2">
                {contact.addressLines.map((line, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-1">
                      <Input value={line} onChange={(e) => {
                        const lines = [...contact.addressLines];
                        lines[i] = e.target.value;
                        setContact({ ...contact, addressLines: lines });
                      }} />
                    </div>
                    <button type="button" onClick={() => setContact({ ...contact, addressLines: contact.addressLines.filter((_, idx) => idx !== i) })} className="text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setContact({ ...contact, addressLines: [...contact.addressLines, ""] })}><Plus className="w-3 h-3" /> Add Line</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <Input label="Facebook URL" value={contact.social.facebook} onChange={(e) => setContact({ ...contact, social: { ...contact.social, facebook: e.target.value } })} />
              <Input label="Instagram URL" value={contact.social.instagram} onChange={(e) => setContact({ ...contact, social: { ...contact.social, instagram: e.target.value } })} />
              <Input label="LinkedIn URL" value={contact.social.linkedin} onChange={(e) => setContact({ ...contact, social: { ...contact.social, linkedin: e.target.value } })} />
              <Input label="WhatsApp Number" value={contact.social.whatsapp} onChange={(e) => setContact({ ...contact, social: { ...contact.social, whatsapp: e.target.value } })} hint="Digits only, e.g. 919373923799" />
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "registrations" && (
        <Card>
          <CardBody className="space-y-5">
            <Textarea label="Disclaimer" value={regDisclaimer} onChange={(e) => setRegDisclaimer(e.target.value)} rows={4} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Registration Items ({regItems.length})
                </label>
                <p className="text-xs text-slate-400">Fill Short label + Value, then Save Changes</p>
              </div>
              <div className="space-y-3">
                {regItems.map((item, i) => (
                  <div
                    key={item._key}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 items-end"
                  >
                    <div className="md:col-span-2">
                      <Input
                        label="Short label"
                        value={item.shortLabel}
                        onChange={(e) => updateReg(i, { shortLabel: e.target.value })}
                        placeholder="e.g. CIN"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Input
                        label="Full label"
                        value={item.label}
                        onChange={(e) => updateReg(i, { label: e.target.value })}
                        placeholder="e.g. CIN (Corporate Identity Number)"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <Input
                        label="Value / Number"
                        value={item.value}
                        onChange={(e) => updateReg(i, { value: e.target.value })}
                        placeholder="Registration number"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end pb-1">
                      <button
                        type="button"
                        onClick={() => setRegItems((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 p-2"
                        aria-label="Remove registration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addRegistration}>
                  <Plus className="w-3 h-3" /> Add Registration
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "brochure" && (
        <Card>
          <CardBody className="space-y-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={brochure.enabled}
                onChange={(e) => setBrochure({ ...brochure, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Show Download Brochure button in navigation</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Button Label" value={brochure.label} onChange={(e) => setBrochure({ ...brochure, label: e.target.value })} />
              <Input label="Download Filename" value={brochure.fileName} onChange={(e) => setBrochure({ ...brochure, fileName: e.target.value })} />
            </div>

            <Input label="Brochure URL" value={brochure.url} onChange={(e) => setBrochure({ ...brochure, url: e.target.value })} hint="/brochure/VIDEHA-OVERSEAS.pdf or /uploads/..." />

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
              <FileText className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-4">Upload a new PDF brochure</p>
              <label className="inline-flex">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleBrochureUpload(f);
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {uploading ? "Uploading…" : "Choose PDF"}
                </span>
              </label>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
