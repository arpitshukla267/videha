"use client";

import { ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface ActiveToggleProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  loading?: boolean;
  showLabel?: boolean;
}

export function ActiveToggle({
  active,
  onToggle,
  disabled = false,
  loading = false,
  showLabel = true,
}: ActiveToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? "Active on site" : "Hidden from site"}
      disabled={disabled || loading}
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed group"
      title={active ? "Hide from site" : "Show on site"}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
        ) : (
          <>
            <ToggleRight
              className={`absolute h-5 w-5 text-emerald-600 transition-all duration-300 ease-out ${
                active ? "scale-100 opacity-100" : "scale-75 opacity-0"
              }`}
            />
            <ToggleLeft
              className={`absolute h-5 w-5 text-slate-400 transition-all duration-300 ease-out ${
                active ? "scale-75 opacity-0" : "scale-100 opacity-100"
              }`}
            />
          </>
        )}
      </span>
      {showLabel && (
        <span
          className={`text-[11px] transition-colors duration-200 ${
            active ? "text-emerald-700" : "text-slate-500"
          } group-hover:text-purple-600`}
        >
          {loading ? "Updating…" : active ? "Active" : "Hidden"}
        </span>
      )}
    </button>
  );
}
