import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Reveal } from "@/components/reveal"

export function SectionCta({
  href,
  label,
  className,
}: {
  href: string
  label: string
  className?: string
}) {
  return (
    <Reveal className={className}>
      <Link
        href={href}
        className="group inline-flex items-center gap-3 border-t border-border pt-8 text-[12px] font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:text-primary"
      >
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </Reveal>
  )
}
