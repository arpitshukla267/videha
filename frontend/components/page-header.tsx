import { SectionLabel } from "@/components/section-label"
import { Reveal, RevealText } from "@/components/reveal"

export function PageHeader({
  eyebrow,
  title,
  intro,
  index,
}: {
  eyebrow: string
  title: string
  intro?: string
  index?: string
}) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-48">
        <div className="flex items-center justify-between">
          <Reveal>
            <SectionLabel>{eyebrow}</SectionLabel>
          </Reveal>
          {index && (
            <Reveal delay={0.05}>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {index}
              </span>
            </Reveal>
          )}
        </div>

        <h1 className="mt-8 max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-foreground text-balance">
          <RevealText text={title} immediate />
        </h1>

        {intro && (
          <Reveal delay={0.15}>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
              {intro}
            </p>
          </Reveal>
        )}
      </div>
    </header>
  )
}
