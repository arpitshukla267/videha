import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { usePopoverPosition } from "./usePopoverPosition";

export type SearchableOption = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No results",
  disabled = false,
  allowClear = false,
  className = "",
}: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const coords = usePopoverPosition(open, triggerRef, 320);

  const selected = options.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    }
    setVisible(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel =
    open && coords
      ? createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: coords.openUp ? undefined : coords.top,
              bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
              left: coords.left,
              width: Math.max(coords.width, 220),
              zIndex: 9999,
            }}
            className={`rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-150 origin-top ${
              visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-1 scale-[0.98]"
            }`}
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-slate-400">{emptyLabel}</li>
              ) : (
                filtered.map((opt, idx) => {
                  const active = opt.value === value;
                  return (
                    <li
                      key={opt.value}
                      style={{ animationDelay: `${Math.min(idx, 12) * 18}ms` }}
                      className="crm-fade-option"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setOpen(false);
                          setQuery("");
                        }}
                        className={`w-full flex items-start gap-2 px-3 py-2 text-left text-xs transition-colors ${
                          active ? "bg-sky-50 text-sky-900" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <Check
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            active ? "opacity-100 text-sky-600" : "opacity-0"
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block font-medium truncate">{opt.label}</span>
                          {opt.description ? (
                            <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                              {opt.description}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <style>{`
              @keyframes crmFadeInOption {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .crm-fade-option {
                animation: crmFadeInOption 0.22s ease-out both;
              }
            `}</style>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-left text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${selected ? "text-slate-800" : "text-slate-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0 text-slate-400">
          {allowClear && value ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 rounded hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          ) : null}
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </span>
      </button>
      {panel}
    </div>
  );
}
