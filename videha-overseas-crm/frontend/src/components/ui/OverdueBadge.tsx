import React from "react";
import { AlertCircle, Clock } from "lucide-react";

type Props = {
  dueDate: string | Date;
  status?: string;
  isOverdue?: boolean;
  overdueDays?: number;
  className?: string;
};

function compute(dueDate: string | Date, status?: string, isOverdue?: boolean, overdueDays?: number) {
  const done = status === "Completed" || status === "Cancelled";
  if (done) return { kind: "done" as const, label: "Done" };

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return { kind: "none" as const, label: "" };

  const now = Date.now();
  const diffMs = due.getTime() - now;
  const overdue =
    typeof isOverdue === "boolean" ? isOverdue : diffMs < 0;

  if (overdue) {
    const days =
      overdueDays && overdueDays > 0
        ? overdueDays
        : Math.max(1, Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24)));
    return {
      kind: "overdue" as const,
      label: days === 1 ? "Overdue · 1 day" : `Overdue · ${days} days`,
    };
  }

  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  let label = "";
  if (days >= 1) label = days === 1 ? "Due in 1 day" : `Due in ${days} days`;
  else if (hours >= 1) label = hours === 1 ? "Due in 1 hour" : `Due in ${hours} hours`;
  else if (mins >= 1) label = mins === 1 ? "Due in 1 min" : `Due in ${mins} mins`;
  else label = "Due soon";

  return { kind: "remaining" as const, label };
}

/** Shows overdue OR remaining time until due date. Hidden when completed/cancelled. */
export const DueBadge: React.FC<Props> = ({
  dueDate,
  status,
  isOverdue,
  overdueDays,
  className = "",
}) => {
  const info = compute(dueDate, status, isOverdue, overdueDays);
  if (info.kind === "none" || info.kind === "done") return null;

  if (info.kind === "overdue") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap ${className}`}
      >
        <AlertCircle className="w-3 h-3" />
        {info.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap ${className}`}
    >
      <Clock className="w-3 h-3" />
      {info.label}
    </span>
  );
};

/** @deprecated use DueBadge */
export const OverdueBadge = DueBadge;
