import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Guide } from '@/lib/types'
import { guideHref } from '@/lib/guides/guide-href'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

// Fast redaktionelt "personlig guide"-motiv: ægte plante der fortsætter som
// botanisk blyantsskitse på cremet papir ("din plante → Potalots guide").
// Personlige guides opstår netop hvor Potalot IKKE har kurateret materiale — så
// der findes typisk heller ikke et plantekortfoto. Derfor ét fast motiv, ikke en
// foto-collage (der ville antyde verificerede sort-billeder vi ikke har).
const MOTIV = '/images/guides/personlig-guide.jpg'

/**
 * DINE EGNE GUIDES — brugerens PRIVATE/AI-genererede guides som lille editorial
 * feature. Fast motiv giver "din egen guide" en egen visuel stemme i grammatikken:
 * artsguide=artshero · sortsguide=plantekort · teknik=hænder i arbejde ·
 * personlig=plante der bliver til botanisk viden. Rangeret klart under "I din have".
 */
export function DineEgneGuides({ guides }: { guides: Guide[] }) {
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
        Har du en sort, vi ikke har skrevet om endnu?
        <br />
        Potalot laver en personlig guide ud fra det, du dyrker.
      </p>

      <details className="group mt-3.5">
        <summary
          className="flex cursor-pointer list-none items-stretch overflow-hidden [&::-webkit-details-marker]:hidden"
          style={{
            background: 'rgba(244,240,229,0.96)',
            border: '1px solid rgba(45,42,36,0.10)',
            borderRadius: 18,
          }}
        >
          {/* Motiv — smal vertikal flade, framet på den ægte plante der bliver
              til skitse */}
          <span
            className="relative shrink-0 self-stretch overflow-hidden"
            style={{ width: 108, background: '#E7E2D2' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async"
              src={MOTIV}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: '26% 50%' }}
            />
          </span>

          <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3.5">
            <span
              style={{ fontFamily: plex, fontWeight: 600, fontSize: 18, lineHeight: 1.1, color: '#24301F' }}
            >
              {guides.length} {guides.length === 1 ? 'guide' : 'guider'} lavet til dine sorter
            </span>
            {/* Konkrete sortsnavne = beviset. Mørkere end almindelig hjælpetekst. */}
            <span
              className="truncate"
              style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.72)' }}
            >
              {previewText}
            </span>
            <span
              className="mt-0.5 inline-flex items-center gap-1"
              style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: '#3D5A26' }}
            >
              Se dine guides
              <ChevronDown
                className="h-4 w-4 transition-transform group-open:rotate-180"
                strokeWidth={2.2}
                aria-hidden
              />
            </span>
          </span>
        </summary>

        <div className="mt-3 space-y-2">
          {sorted.map(g => (
            <Link
              key={g.id}
              href={guideHref(g.id)}
              className="flex items-center gap-3.5 overflow-hidden no-underline transition-transform active:scale-[0.995]"
              style={{
                background: 'rgba(244,240,229,0.6)',
                border: '1px solid rgba(45,42,36,0.08)',
                borderRadius: 14,
                padding: '10px 13px',
                color: 'inherit',
              }}
            >
              {/* Lille botanisk markør — beskåret skitse-del af samme motiv */}
              <span
                className="relative shrink-0 overflow-hidden"
                style={{ width: 44, height: 44, borderRadius: 10, background: '#E7E2D2' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async"
                  src={MOTIV}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: '62% 42%' }}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate"
                  style={{ fontFamily: plex, fontWeight: 600, fontSize: 17, lineHeight: 1.1, color: '#24301F' }}
                >
                  {g.variety ?? g.plantName}
                </span>
                <span
                  className="mt-0.5 block truncate"
                  style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: 'rgba(36,48,31,0.55)' }}
                >
                  {g.variety ? `${g.plantName} · ` : ''}Personlig guide
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
