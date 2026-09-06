"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "success" | "purple";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "default",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants = {
    default: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-600/25",
    purple: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-600/25",
    outline: "border border-slate-200 text-slate-700 bg-white hover:bg-purple-50/50 hover:border-purple-200 hover:text-purple-700 shadow-xs",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    destructive: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-sm font-semibold",
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

