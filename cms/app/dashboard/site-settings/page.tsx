"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, FileText, Phone, Building2, MapPin, ShieldCheck, Download, Share2 } from "lucide-react";
import { siteSettingsApi, uploadFile } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

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

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "contact", label: "Contact & Company Details", icon: Building2 },
  { id: "registrations", label: "Business Registrations", icon: ShieldCheck },
  // { id: "brochure", label: "Brochure & Media", icon: Download },
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
      const url = await uploadFile(file, {
        section: "assets",
        identifier: "brochure",
        field: "file",
      });
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
        <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Site Settings"
        description="Configure contact details, export registrations, address, and brochure media."
        action={
          <Button onClick={save} loading={saving} size="lg" className="px-6 shadow-md shadow-purple-600/20">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        }
      />

      {/* Modern Rounded Segmented Control Tab Switcher */}
      <div className="p-1.5 bg-slate-200/60 rounded-2xl inline-flex flex-wrap gap-1 max-w-full">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <t.icon className={`w-4 h-4 ${active ? "text-purple-600" : "text-slate-400"}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "contact" && (
        <div className="space-y-6">
          {/* Card 1: Company Information */}
          <Card>
            <CardHeader className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">Company Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Company Name" value={contact.companyName} onChange={(e) => setContact({ ...contact, companyName: e.target.value })} placeholder="Videha Overseas" />
                <Input label="Brand Name" value={contact.brandName} onChange={(e) => setContact({ ...contact, brandName: e.target.value })} placeholder="Videha" />
                <div className="md:col-span-2">
                  <Input label="Brand Tagline" value={contact.tagline} onChange={(e) => setContact({ ...contact, tagline: e.target.value })} placeholder="Exporting Premium Bihar Makhana Worldwide" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Card 2: Contact Details */}
          <Card>
            <CardHeader className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">Contact Channels</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Email Address" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="info@videhaoverseas.com" />
                <Input label="Phone Number (tel: format)" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} hint="+919373923799" />
                <Input label="Phone Display Text" value={contact.phoneDisplay} onChange={(e) => setContact({ ...contact, phoneDisplay: e.target.value })} placeholder="+91 93739 23799" />
                <Input label="Copyright Tagline" value={contact.copyrightTagline} onChange={(e) => setContact({ ...contact, copyrightTagline: e.target.value })} placeholder="© 2026 Videha Overseas. All rights reserved." />
              </div>
            </CardBody>
          </Card>

          {/* Card 3: Address Details */}
          <Card>
            <CardHeader className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">Official Registered Address</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Address Lines</label>
              <div className="space-y-2.5">
                {contact.addressLines.map((line, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-1">
                      <Input value={line} onChange={(e) => {
                        const lines = [...contact.addressLines];
                        lines[i] = e.target.value;
                        setContact({ ...contact, addressLines: lines });
                      }} placeholder={`Line ${i + 1}`} />
                    </div>
                    <button type="button" onClick={() => setContact({ ...contact, addressLines: contact.addressLines.filter((_, idx) => idx !== i) })} className="text-rose-400 hover:text-rose-600 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setContact({ ...contact, addressLines: [...contact.addressLines, ""] })}>
                  <Plus className="w-3.5 h-3.5" /> Add Address Line
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Card 4: Social Links */}
          <Card>
            <CardHeader className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">Social Handles & WhatsApp</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Facebook URL" value={contact.social.facebook} onChange={(e) => setContact({ ...contact, social: { ...contact.social, facebook: e.target.value } })} />
                <Input label="Instagram URL" value={contact.social.instagram} onChange={(e) => setContact({ ...contact, social: { ...contact.social, instagram: e.target.value } })} />
                <Input label="LinkedIn URL" value={contact.social.linkedin} onChange={(e) => setContact({ ...contact, social: { ...contact.social, linkedin: e.target.value } })} />
                <Input label="WhatsApp Number" value={contact.social.whatsapp} onChange={(e) => setContact({ ...contact, social: { ...contact.social, whatsapp: e.target.value } })} hint="Digits only (e.g. 919373923799)" />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "registrations" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">Official Government & Trade Registrations</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <Textarea label="Certifications & Compliance Disclaimer" value={regDisclaimer} onChange={(e) => setRegDisclaimer(e.target.value)} rows={3} />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Registration Items ({regItems.length})
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Update labels and registration numbers, then click Save Changes</p>
                </div>

                <div className="space-y-3">
                  {regItems.map((item, i) => (
                    <div
                      key={item._key}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 items-end"
                    >
                      <div className="md:col-span-3">
                        <Input
                          label="Short label"
                          value={item.shortLabel}
                          onChange={(e) => updateReg(i, { shortLabel: e.target.value })}
                          placeholder="e.g. IEC"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Input
                          label="Full Description label"
                          value={item.label}
                          onChange={(e) => updateReg(i, { label: e.target.value })}
                          placeholder="e.g. IEC (Import Export Code)"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Input
                          label="Registration Value / Code"
                          value={item.value}
                          onChange={(e) => updateReg(i, { value: e.target.value })}
                          placeholder="AAMCV3205B"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end pb-1">
                        <button
                          type="button"
                          onClick={() => setRegItems((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-rose-400 hover:text-rose-600 p-2"
                          aria-label="Remove registration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addRegistration}>
                    <Plus className="w-3.5 h-3.5" /> Add Registration Item
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* {tab === "brochure" && (
        <Card>
          <CardHeader className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-slate-900 text-sm">PDF Brochure & Downloads</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-purple-50/60 rounded-xl border border-purple-100">
              <input
                type="checkbox"
                checked={brochure.enabled}
                onChange={(e) => setBrochure({ ...brochure, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-semibold text-purple-900">Enable "Download Brochure" button in navigation & site footer</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Button Display Label" value={brochure.label} onChange={(e) => setBrochure({ ...brochure, label: e.target.value })} placeholder="Download Brochure" />
              <Input label="Target Filename" value={brochure.fileName} onChange={(e) => setBrochure({ ...brochure, fileName: e.target.value })} placeholder="VIDEHA-OVERSEAS-BROCHURE.pdf" />
            </div>

            <Input label="Brochure Asset URL" value={brochure.url} onChange={(e) => setBrochure({ ...brochure, url: e.target.value })} hint="/brochure/VIDEHA-OVERSEAS.pdf or uploaded URL" />

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-white transition-colors">
              <FileText className="w-10 h-10 text-purple-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">Upload PDF Document</p>
              <p className="text-xs text-slate-400 mb-4">Choose a PDF file to update company brochure on the live website</p>
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
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {uploading ? "Uploading PDF…" : "Select PDF Brochure"}
                </span>
              </label>
            </div>
          </CardBody>
        </Card>
      )} */}
    </div>
  );
}

