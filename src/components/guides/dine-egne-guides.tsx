import Link from 'next/link'
import { ChevronDown, ChevronRight, Sprout } from 'lucide-react'
import type { Guide } from '@/lib/types'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * DINE EGNE GUIDES — brugerens PRIVATE/AI-genererede guides.
 *
 * Bevidst adskilt fra og RANGERET UNDER "I DIN HAVE" (Anna 25/7): "I din have"
 * er Potalots kvalitetssikrede bibliotek personaliseret til brugeren; "Dine
 * egne guides" er AI-genereret fallback-indhold til sorter, Potalot endnu ikke
 * har skrevet om. De to må aldrig ligne hinanden hierarkisk.
 *
 * Derfor: ÉN kompakt indgang (ikke N store kort top-of-mind). Foldet sammen som
 * standard — brugeren åbner den selv. Skjules helt uden egne guides.
 */
export function DineEgneGuides({ guides }: { guides: Guide[] }) {
  if (guides.length === 0) return null

  const sorted = [...guides].sort((a, b) =>
    // Nyeste øverst — den man lige har lavet/fået, er den man leder efter.
    (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt),
  )

  // Teaser: et par konkrete sortsnavne, så indgangen føles personlig uden at
  // folde hele listen ud. "Til bl.a. Gourmansun, Gardenberry og Jalapeño".
  const navne = sorted.map(g => g.variety ?? g.plantName)
  const teaserDele = navne.slice(0, 3)
  const teaser =
    teaserDele.length <= 1
      ? teaserDele.join('')
      : `${teaserDele.slice(0, -1).join(', ')} og ${teaserDele.at(-1)}`

  return (
    <section className="pt-2">
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.72)',
          margin: 0,
        }}
      >
        Dine egne guides
      </p>
      <p
        className="mt-1.5"
        style={{
          fontFamily: sans,
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.5,
          color: 'rgba(36,48,31,0.55)',
          maxWidth: 460,
          margin: 0,
        }}
      >
        Har du en sort, vi ikke har skrevet om endnu? Potalot laver en personlig
        guide ud fra det, du dyrker.
      </p>

      <details className="group mt-3">
        <summary
          className="flex cursor-pointer list-none items-center gap-3.5 [&::-webkit-details-marker]:hidden"
          style={{
            background: 'rgba(244,240,229,0.96)',
            border: '1px solid rgba(45,42,36,0.10)',
            borderRadius: 16,
            padding: '12px 14px',
          }}
        >
          <span
            className="flex shrink-0 items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 11, background: '#E7ECDD' }}
          >
            <Sprout className="h-5 w-5" style={{ color: '#5A7038' }} strokeWidth={1.9} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className="block"
              style={{ fontFamily: plex, fontWeight: 600, fontSize: 18, lineHeight: 1.1, color: '#24301F' }}
            >
              {guides.length} personlige {guides.length === 1 ? 'guide' : 'guides'}
            </span>
            {teaser && (
              <span
                className="mt-0.5 block truncate"
                style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: 'rgba(36,48,31,0.5)' }}
              >
                Til bl.a. {teaser}
              </span>
            )}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            style={{ color: 'rgba(36,48,31,0.45)' }}
            aria-hidden
          />
        </summary>

        <div className="mt-2.5 space-y-2">
          {sorted.map(g => (
            <Link
              key={g.id}
              href={`/guides/${g.id}`}
              className="flex items-center gap-3.5 no-underline transition-transform active:scale-[0.995]"
              style={{
                background: 'rgba(244,240,229,0.6)',
                border: '1px solid rgba(45,42,36,0.08)',
                borderRadius: 14,
                padding: '10px 13px',
                color: 'inherit',
              }}
            >
              <span
                className="flex shrink-0 items-center justify-center overflow-hidden"
                style={{ width: 44, height: 44, borderRadius: 10, background: '#E7ECDD' }}
              >
                {g.primaryImageId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.primaryImageId} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Sprout className="h-4 w-4" style={{ color: '#5A7038' }} strokeWidth={1.9} aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate"
                  style={{ fontFamily: plex, fontWeight: 600, fontSize: 17, lineHeight: 1.1, color: '#24301F' }}
                >
                  {g.plantName}
                  {g.variety && (
                    <span style={{ fontWeight: 500, color: 'rgba(36,48,31,0.55)' }}> · {g.variety}</span>
                  )}
                </span>
                <span
                  className="mt-1 inline-flex items-center gap-1"
                  style={{
                    fontFamily: sans,
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    color: '#6B5635',
                    background: 'rgba(216,196,160,0.30)',
                    border: '1px solid rgba(216,196,160,0.55)',
                    borderRadius: 999,
                    padding: '3px 9px',
                    lineHeight: 1,
                  }}
                >
                  <span aria-hidden>🌱</span> Personlig guide
                </span>
              </span>
              <ChevronRight
                className="h-[18px] w-[18px] shrink-0"
                style={{ color: 'rgba(36,48,31,0.35)' }}
                strokeWidth={2.2}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </details>
    </section>
  )
}
