import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Guide } from '@/lib/types'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { BiblioRow } from '@/components/guides/guides-bibliotek'
import {
  TECHNIQUE_TASK_ORDER,
  TECHNIQUE_TASK_LABEL,
  TECHNIQUE_TASK_INTRO,
  TECHNIQUE_TASK_GLYPH,
  TECHNIQUE_TASK_OF,
  type TechniqueTask,
} from '@/data/guide-technique-tasks'

// Ren indholdsside (kun IMPORTED_GUIDES, ingen brugerdata) — statisk ved
// build, serveres fra CDN uden serverfunktion. Skallen bages anonym; det er
// samme trade-off som forvandlinger-siderne.
export const dynamic = 'force-static'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * Tekniksiden — /guides/teknik. Organiseret efter ARBEJDE, ikke planteart: en
 * nybegynder ved ikke hvilken "teknikguide" de mangler; de ved bare "min tomat
 * vælter" → Bind op & støt. Kun opgaver MED indhold vises (ingen tomme grupper).
 */
export default async function TeknikPage() {
  const techniques = IMPORTED_GUIDES.filter(g => g.guideLevel === 'technique')

  const byTask = new Map<TechniqueTask, Guide[]>()
  for (const g of techniques) {
    const t = TECHNIQUE_TASK_OF[g.id]
    if (!t) continue // ukendt mapping → skjules hellere end at havne forkert
    const arr = byTask.get(t) ?? []
    arr.push(g)
    byTask.set(t, arr)
  }
  for (const arr of byTask.values()) {
    arr.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'da'))
  }
  const tasks = TECHNIQUE_TASK_ORDER.filter(t => (byTask.get(t)?.length ?? 0) > 0)

  return (
    <div className="relative -mx-4 -mt-6 min-h-screen bg-[#EAE6D8] px-4 pb-16 pt-6">
      <style>{`.app-canvas{background-color:#EAE6D8;}`}</style>

      <Link
        href="/guides"
        className="inline-flex items-center gap-1.5 no-underline"
        style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.6)' }}
      >
        <ArrowLeft size={15} strokeWidth={2.2} aria-hidden />
        Alle guides
      </Link>

      <header className="mt-4">
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.5)',
            margin: 0,
          }}
        >
          Teknikguider
        </p>
        <h1
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 'clamp(38px, 12vw, 52px)',
            lineHeight: 1.02,
            letterSpacing: '-0.01em',
            color: '#242019',
            margin: '6px 0 0',
          }}
        >
          Hvad skal du gøre?
        </h1>
        <p
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'rgba(36,48,31,0.6)',
            margin: '8px 0 0',
          }}
        >
          Vælg opgaven — ikke planten. Guiderne samler sig om det arbejde, du står
          med i haven.
        </p>
      </header>

      <div className="mt-7 space-y-8">
        {tasks.map(t => {
          const guides = byTask.get(t) ?? []
          return (
            <section key={t}>
              <div className="flex items-center gap-2.5">
                {/* Eksisterende Potalot-glyph pr. opgave — kun genbrug */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async"
                  src={`/images/glyphs/${TECHNIQUE_TASK_GLYPH[t]}.png`}
                  alt=""
                  aria-hidden="true"
                  className="shrink-0 select-none"
                  style={{ width: 30, height: 30, objectFit: 'contain' }}
                />
                <h2
                  style={{
                    fontFamily: serif,
                    fontWeight: 600,
                    fontSize: 24,
                    lineHeight: 1.1,
                    color: '#242019',
                    margin: 0,
                  }}
                >
                  {TECHNIQUE_TASK_LABEL[t]}
                </h2>
              </div>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 500,
                  lineHeight: 1.45,
                  color: 'rgba(36,48,31,0.55)',
                  margin: '2px 0 0',
                }}
              >
                {TECHNIQUE_TASK_INTRO[t]}
              </p>
              <div className="mt-3 space-y-2">
                {guides.map(g => (
                  <BiblioRow key={g.id} guide={g} teknik returnTo="%2Fguides%2Fteknik" />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
