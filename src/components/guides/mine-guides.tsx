import Link from 'next/link'
import { ChevronDown, ChevronRight, Sprout } from 'lucide-react'
import type { Guide } from '@/lib/types'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * MINE GUIDES — brugerens egne (private) guides, foldet ind øverst i biblioteket.
 *
 * Anna 16/7: /guides viste før KUN redaktionelle Potalot-guides; egne guides og
 * AI-udkast blev kun åbnet fra det konkrete frø/plante. Men når en bruger selv
 * har lavet (eller fået autogenereret) guides, skal de kunne finde dem ét sted.
 *
 * Klart adskilt fra Potalot-laget nedenunder:
 *   🌱 Min guide      = privat, kun for dig
 *   ⭐ Potalot-guide  = kvalitetssikret, redaktionens
 *
 * Foldet <details> (native, ingen JS): åben som standard så brugeren ser sine
 * guides, men kan klappes sammen så Potalot-biblioteket får plads. Skjules helt
 * hvis brugeren ingen egne guides har (ingen tom kasse).
 */
export function MineGuides({ guides }: { guides: Guide[] }) {
  if (guides.length === 0) return null

  const sorted = [...guides].sort((a, b) => {
    // Nyeste øverst — den man lige har lavet/fået, er den man leder efter.
    return (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt)
  })

  return (
    <details open className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5">
          <span
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(36,48,31,0.72)',
            }}
          >
            Mine guides
          </span>
          <span
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 700,
              color: '#6B5635',
              background: 'rgba(216,196,160,0.30)',
              border: '1px solid rgba(216,196,160,0.55)',
              borderRadius: 999,
              padding: '2px 8px',
              lineHeight: 1.3,
            }}
          >
            {guides.length}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 transition-transform group-open:rotate-180"
          style={{ color: 'rgba(36,48,31,0.45)' }}
          aria-hidden
        />
      </summary>

      <p
        className="mt-2"
        style={{
          fontFamily: sans,
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.5,
          color: 'rgba(36,48,31,0.58)',
          maxWidth: 460,
        }}
      >
        Dine guides er private for dig. Potalot-guides er kvalitetssikrede og
        vedligeholdes af redaktionen.
      </p>

      <div className="mt-4 space-y-2.5">
        {sorted.map(g => (
          <Link
            key={g.id}
            href={`/guides/${g.id}`}
            className="flex items-center gap-3.5 no-underline transition-transform active:scale-[0.995]"
            style={{
              background: '#F4F0E5',
              border: '1px solid rgba(45,42,36,0.10)',
              borderRadius: 18,
              padding: '12px 14px',
              color: 'inherit',
            }}
          >
            {/* Thumbnail eller blødt papir-felt */}
            <span
              className="flex shrink-0 items-center justify-center overflow-hidden"
              style={{ width: 52, height: 52, borderRadius: 12, background: '#E7ECDD' }}
            >
              {g.primaryImageId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" decoding="async" src={g.primaryImageId} alt="" className="h-full w-full object-cover" />
              ) : (
                <Sprout className="h-5 w-5" style={{ color: '#5A7038' }} strokeWidth={1.9} aria-hidden />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span
                className="block truncate"
                style={{ fontFamily: plex, fontWeight: 600, fontSize: 19, lineHeight: 1.05, color: '#24301F' }}
              >
                {g.plantName}
                {g.variety && (
                  <span style={{ fontWeight: 500, color: 'rgba(36,48,31,0.55)' }}> · {g.variety}</span>
                )}
              </span>
              {/* 🌱 Min guide — privat-mærkat, adskiller fra ⭐ Potalot-guide */}
              <span
                className="mt-1.5 inline-flex items-center gap-1"
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
                <span aria-hidden>🌱</span> Min guide
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
  )
}
