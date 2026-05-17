import { MONTHS_DA } from '@/lib/constants'
import { MAANEDS_STEMNING } from '@/lib/maaneds-stemning'
import { saeson } from '@/lib/datetime'

/**
 * Månedskapitel — et editorielt, fysisk "bog-kapitel" for måneden
 * i stedet for et generisk gradient-kort. Stor flad sæson-flade,
 * kæmpe måned, det poetiske stemnings-citat, lagdelt dybde og
 * botaniske labels. Asymmetrisk/venstrestillet. Samme props, så
 * KalenderClient er uændret.
 */
export function MaanedsHero({
  month, year, focusTags = [],
}: {
  month: number
  year: number
  focusTags?: string[]
}) {
  const monthName = MONTHS_DA[month - 1].full
  const stemning = MAANEDS_STEMNING[month]
  const sa = saeson(month)

  return (
    <div className="relative">
      {/* Bagvedliggende forskudt tone-blok — fysisk lagdeling */}
      <div
        aria-hidden
        className="absolute -right-2 -top-2 h-24 w-2/3 rounded-[2rem] bg-secondary"
      />

      {/* Selve månedskapitlet — flad sæson-flade. Asymmetriske
          hjørner giver organisk karakter uden at klippe tekst. */}
      <article
        className="relative overflow-hidden rounded-[2rem] rounded-tl-md rounded-br-md bg-primary px-6 pb-7 pt-7 text-primary-foreground"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-65">
          {sa} · {year}
        </p>

        {/* Kæmpe editoriel måned — venstrestillet, ikke centreret.
            Eksplicit lys farve: basis-h2-reglen ville ellers
            tvinge den mørk på den mørke flade. */}
        <h2 className="mt-1 font-sans text-6xl font-bold leading-[0.95] tracking-tight text-[color:var(--primary-foreground)]">
          {monthName}
        </h2>

        <p className="mt-4 text-lg font-semibold leading-snug">
          {stemning.tagline}
        </p>
        <p className="mt-2 max-w-md text-sm leading-relaxed opacity-80">
          {stemning.description}
        </p>

        {focusTags.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-55">
              Månedens fokus
            </span>
            {focusTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 text-sm font-medium capitalize"
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
