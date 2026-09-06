import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive" | "outline" | "purple";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200/50",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/60",
    destructive: "bg-rose-50 text-rose-700 border border-rose-200/60",
    outline: "border border-slate-200 text-slate-600 bg-white",
    purple: "bg-purple-50 text-purple-700 border border-purple-200/60",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide", variants[variant], className)}>
      {children}
    </span>
  );
}

