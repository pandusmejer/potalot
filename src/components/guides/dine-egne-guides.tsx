import Link from 'next/link'
import { ChevronDown, ChevronRight, Sprout } from 'lucide-react'
import type { Guide } from '@/lib/types'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * DINE EGNE GUIDES — brugerens PRIVATE/AI-genererede guides. Lille editorial
 * feature (ikke card-i-card dropdown): et lille kig ind i "mine ting" via en
 * foto-collage af de sorter Potalot har lavet guides til + de konkrete
 * sortsnavne som BEVIS på personaliseringen. Rangeret klart UNDER "I din have"
 * (Potalot-kurateret) — AI-fallback må aldrig ligne det kuraterede lag.
 *
 * Foto-grammatik: personlige guides = collage af brugerens sorter (plantekort/
 * upload). Findes ingen ægte fotos → plante-ikon som fallback (aldrig stock).
 */
export function DineEgneGuides({
  guides,
  photos,
}: {
  guides: Guide[]
  photos: string[]
}) {
  if (guides.length === 0) return null

  const sorted = [...guides].sort((a, b) =>
    (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt),
  )
  const names = sorted.map(g => g.variety ?? g.plantName)
  const preview = names.slice(0, 3)
  const extra = names.length - preview.length
  const previewText = preview.join(' · ') + (extra > 0 ? ` · +${extra}` : '')

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

      <details className="group mt-3.5">
        <summary className="flex cursor-pointer list-none items-center gap-3.5 [&::-webkit-details-marker]:hidden">
          {/* Collage af ægte sort-fotos, ellers plante-ikon */}
          {photos.length > 0 ? (
            <span className="flex shrink-0 items-center">
              {photos.map((src, i) => (
                <span
                  key={i}
                  className="relative overflow-hidden"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    marginLeft: i === 0 ? 0 : -14,
                    border: '2px solid #EAE6D8',
                    background: '#E7ECDD',
                    zIndex: photos.length - i,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </span>
              ))}
            </span>
          ) : (
            <span
              className="flex shrink-0 items-center justify-center"
              style={{ width: 46, height: 46, borderRadius: 12, background: '#E7ECDD' }}
            >
              <Sprout className="h-5 w-5" style={{ color: '#5A7038' }} strokeWidth={1.9} aria-hidden />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span
              className="block"
              style={{ fontFamily: plex, fontWeight: 600, fontSize: 18, lineHeight: 1.1, color: '#24301F' }}
            >
              {guides.length} {guides.length === 1 ? 'guide' : 'guider'} lavet til dine sorter
            </span>
            {/* Konkrete sortsnavne = beviset. Mørkere end almindelig hjælpetekst. */}
            <span
              className="mt-1 block truncate"
              style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.72)' }}
            >
              {previewText}
            </span>
          </span>

          <span
            className="flex shrink-0 items-center gap-1 self-end pb-0.5"
            style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: '#3D5A26' }}
          >
            Se dine
            <ChevronDown
              className="h-4 w-4 transition-transform group-open:rotate-180"
              strokeWidth={2.2}
              aria-hidden
            />
          </span>
        </summary>

        <div className="mt-3 space-y-2">
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
