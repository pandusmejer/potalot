/**
 * Kort dyrkningsguide + kommende opgaver for ÉN plante (MVP 1.0, fase 2).
 *
 * To små, stille kort øverst på plantens detaljeside: hvordan planten skal
 * passes (fra de eksisterende arts-/sortsguides), og hvad der kommer (fra de
 * eksisterende opgaver). Ingen nye tekster, intet nyt opgavesystem, og
 * opgaverne kan ikke afkrydses her — samling og forenkling af opgaver er
 * fase 3. Begge kort tier, når der ikke er noget at vise.
 *
 * Ren servervisning. Vises kun når MVP_PLANTER.dyrkningsKort er slået til.
 */

import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarCheck } from 'lucide-react'
import { formatDatoKort } from '@/lib/datetime'
import { erOpgaveForsinket, opgaverTilPlante } from '@/lib/plante-oversigt'
import type { KortGuide } from '@/lib/plante-kort-guide'
import type { CalendarTask } from '@/lib/types'

const sans = 'var(--font-manrope)'
const gabarito = 'var(--font-gabarito), var(--font-manrope), sans-serif'

const KORT_STIL = {
  background: '#FBF8EC',
  border: '1px solid rgba(36,48,31,0.10)',
  borderRadius: 20,
  padding: '16px 18px',
} as const

function Overskrift({ ikon, children }: { ikon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2
      className="flex items-center gap-2 text-[17px] text-foreground"
      style={{ fontFamily: gabarito, fontWeight: 600, margin: 0 }}
    >
      <span className="text-[#5A7038]" aria-hidden>{ikon}</span>
      {children}
    </h2>
  )
}

export function PlantKortGuide({
  guide,
  guideHref,
}: {
  guide: KortGuide
  /** Den eksisterende "Se guide"-rute (resolvePlantGuideHref). */
  guideHref: string
}) {
  const alle = [...guide.raekker, ...guide.sortRaekker]
  if (alle.length === 0) return null

  return (
    <section style={{ ...KORT_STIL, fontFamily: sans }}>
      <Overskrift ikon={<BookOpen className="h-[18px] w-[18px]" />}>Sådan dyrker du den</Overskrift>

      <dl className="mt-3 space-y-1.5">
        {guide.raekker.map((r) => (
          <Raekke key={r.label} label={r.label} value={r.value} />
        ))}
      </dl>

      {guide.sortRaekker.length > 0 && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Særligt for sorten
          </p>
          <dl className="space-y-1.5">
            {guide.sortRaekker.map((r) => (
              <Raekke key={r.label} label={r.label} value={r.value} />
            ))}
          </dl>
        </div>
      )}

      <p className="mt-3 text-[12.5px] leading-snug text-muted-foreground">
        {guide.kilde}.{guide.note ? ` ${guide.note}` : ''}
      </p>
      <Link
        href={guideHref}
        className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#3D5626] no-underline hover:underline"
      >
        Læs hele guiden <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  )
}

function Raekke({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[14px] leading-snug">
      <dt className="w-[92px] shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{value}</dd>
    </div>
  )
}

export function PlantOpgaverKort({
  tasks,
  today,
}: {
  /** ALLE plantens opgaver; kortet vælger selv de åbne. */
  tasks: CalendarTask[]
  today: string
}) {
  const { aabne, antalAabne, antalUdfoert } = opgaverTilPlante(tasks)
  if (antalAabne === 0 && antalUdfoert === 0) return null

  return (
    <section style={{ ...KORT_STIL, fontFamily: sans }}>
      <Overskrift ikon={<CalendarCheck className="h-[18px] w-[18px]" />}>Kommende opgaver</Overskrift>

      {aabne.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {aabne.map((t) => {
            const forsinket = erOpgaveForsinket(t, today)
            return (
              <li key={t.id} className="flex items-baseline gap-3 text-[14px] leading-snug">
                <span
                  className="w-[64px] shrink-0 tabular-nums"
                  style={{ color: forsinket ? '#8A5A1C' : undefined, fontWeight: forsinket ? 600 : 400 }}
                >
                  {formatDatoKort(t.date)}
                </span>
                <span className="min-w-0 flex-1 text-foreground">
                  {t.title}
                  {forsinket && <span className="ml-1.5 text-[12px] font-semibold" style={{ color: '#8A5A1C' }}>Forsinket</span>}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-3 text-[14px] text-muted-foreground">
          Ingen åbne opgaver — alle {antalUdfoert} er udført.
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 text-[12.5px] text-muted-foreground">
        <span>
          {antalAabne > aabne.length ? `+ ${antalAabne - aabne.length} flere · ` : ''}
          {antalUdfoert > 0 ? `${antalUdfoert} udført` : ''}
        </span>
        <Link
          href="/kalender"
          className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#3D5626] no-underline hover:underline"
        >
          Se alle opgaver <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
