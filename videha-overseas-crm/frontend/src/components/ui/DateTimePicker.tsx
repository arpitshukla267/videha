import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { usePopoverPosition } from "./usePopoverPosition";

type Props = {
  value: string;
  onChange: (value: string) => void;
  includeTime?: boolean;
  placeholder?: string;
  className?: string;
  min?: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseValue(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDatePart(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimePart(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDisplay(value: string, includeTime: boolean): string {
  const d = parseValue(value);
  if (!d) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function DateTimePicker({
  value,
  onChange,
  includeTime = false,
  placeholder = "Pick a date",
  className = "",
  min,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = parseValue(value);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState(() => selected || new Date());
  const [time, setTime] = useState(() => (selected ? toTimePart(selected) : "09:00"));
  const coords = usePopoverPosition(open, triggerRef, 360);

  useEffect(() => {
    if (selected) {
      setView(selected);
      setTime(toTimePart(selected));
    }
  }, [value]);

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
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    for (let i = startPad - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month, -i), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        inMonth: false,
      });
    }
    return cells;
  }, [view]);

  const minDate = min ? parseValue(min) : null;

  const pickDay = (date: Date) => {
    if (minDate) {
      const cmp = new Date(date);
      cmp.setHours(0, 0, 0, 0);
      const floor = new Date(minDate);
      floor.setHours(0, 0, 0, 0);
      if (cmp < floor) return;
    }
    const datePart = toDatePart(date);
    if (includeTime) {
      onChange(`${datePart}T${time}`);
    } else {
      onChange(datePart);
      setOpen(false);
    }
  };

  const applyTime = (nextTime: string) => {
    setTime(nextTime);
    const base = selected || new Date();
    onChange(`${toDatePart(base)}T${nextTime}`);
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = new Date();

  const panel =
    open && coords
      ? createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: coords.openUp ? undefined : coords.top,
              bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
              left: Math.min(coords.left, window.innerWidth - 300),
              width: 288,
              zIndex: 9999,
            }}
            className={`rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-150 origin-top ${
              visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-1 scale-[0.98]"
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                className="p-1 rounded-lg hover:bg-white text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-800">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                className="p-1 rounded-lg hover:bg-white text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 px-2 pt-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-[10px] font-semibold text-slate-400 text-center py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 px-2 pb-2">
              {days.map(({ date, inMonth }) => {
                const selectedDay = selected && isSameDay(date, selected);
                const isToday = isSameDay(date, today);
                const disabled =
                  !!minDate &&
                  (() => {
                    const cmp = new Date(date);
                    cmp.setHours(0, 0, 0, 0);
                    const floor = new Date(minDate);
                    floor.setHours(0, 0, 0, 0);
                    return cmp < floor;
                  })();

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickDay(date)}
                    className={`h-8 rounded-lg text-[11px] font-medium transition-colors ${
                      selectedDay
                        ? "bg-sky-600 text-white shadow-sm"
                        : isToday
                          ? "bg-sky-50 text-sky-700"
                          : inMonth
                            ? "text-slate-700 hover:bg-slate-100"
                            : "text-slate-300"
                    } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {includeTime && (
              <div className="px-3 py-2.5 border-t border-slate-100 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => applyTime(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-semibold"
                >
                  Done
                </button>
              </div>
            )}

            <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  if (includeTime) onChange(`${toDatePart(now)}T${toTimePart(now)}`);
                  else onChange(toDatePart(now));
                  setOpen(false);
                }}
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-800"
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-left hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-600"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected ? formatDisplay(value, includeTime) : placeholder}
        </span>
      </button>
      {panel}
    </div>
  );
}
