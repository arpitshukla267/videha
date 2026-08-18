import { cn } from "@/lib/utils"

export function SectionLabel({
  children,
  className,
  tone = "muted",
}: {
  children: React.ReactNode
  className?: string
  tone?: "muted" | "light" | "accent"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em]",
        tone === "muted" && "text-muted-foreground",
        tone === "light" && "text-background/70",
        tone === "accent" && "text-accent",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-px w-8",
          tone === "light" ? "bg-background/40" : "bg-current opacity-40",
        )}
      />
      {children}
    </span>
  )
}
