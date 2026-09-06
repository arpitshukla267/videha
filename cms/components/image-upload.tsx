"use client";
import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/api";
import type { UploadContext } from "@/lib/upload-context";
import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  uploadContext: UploadContext;
}

export function ImageUpload({ value, onChange, label, hint, uploadContext }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = value ? resolveMediaUrl(value) : null;

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (!uploadContext.identifier?.trim()) {
      toast.error("Set slug / ID first so the image is saved under the correct name.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file, uploadContext);
      onChange(url);
      toast.success("Image uploaded to Cloudinary");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
        </label>
      )}

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all",
          dragging ? "border-accent bg-[#F3E2D4]" : "border-slate-300 hover:border-slate-400",
          "cursor-pointer"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {uploading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : displayUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="preview"
              className="w-full h-40 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
            <Upload className="w-6 h-6" />
            <span className="text-xs">Click or drag to upload</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cloudinary URL or /images/... static path"
          className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <p className="text-[10px] text-slate-400 font-mono">
        {uploadContext.section}/{uploadContext.identifier}/{uploadContext.field}
      </p>
    </div>
  );
}
