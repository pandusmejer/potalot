import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { Guide } from '@/lib/types'
import { SpoergGartneren } from './spoerg-gartneren'

const sans = 'var(--font-manrope)'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * Lille "Relateret"-blok højt på artsguiden (lige under hero/summary).
 * Ren GENVEJ — flytter/ombygger INTET: 2-3 sorter med "Se alle" der scroller
 * til den eksisterende Sortsvarianter-sektion (#sortsvarianter), + Spørg
 * gartneren. Teknik tilføjes her senere, når teknikguides findes (så findes
 * blokken bare ikke, hvis der intet er). Kun på artsguider (species).
 *
 * Filosofi (som resten af Potalot): vis en smagsprøve, link videre.
 */
export function ArtsguideRelateret({
  plantName,
  varieties,
  returnTo,
}: {
  plantName: string
  varieties: Guide[]
  /** returnTo-param (encoded) så sorten kan gå "tilbage" til artsguiden. */
  returnTo?: string
}) {
  const vis = varieties.slice(0, 3)
  return (
    <div className="px-3 sm:px-4">
      {varieties.length > 0 && (
        <div>
          <div
            aria-hidden
            className="mb-4 h-px"
            style={{ background: 'rgba(45,42,36,0.10)' }}
          />
          <p
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#7F8F6A',
              margin: 0,
            }}
          >
            Varianter af {plantName.toLowerCase()}
          </p>
          <div className="mt-2.5 space-y-0.5">
            {vis.map(v => (
              <Link
                key={v.id}
                href={returnTo ? `/guides/${v.id}?returnTo=${returnTo}` : `/guides/${v.id}`}
                className="group flex items-center gap-2 rounded-[10px] py-1.5 transition-colors hover:bg-[rgba(86,111,60,0.06)]"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{
                    fontFamily: plex,
                    fontWeight: 600,
                    fontSize: 17,
                    letterSpacing: '-0.01em',
                    color: '#2D2A24',
                  }}
                >
                  {v.variety ?? v.plantName}
                </span>
                <ArrowRight
                  className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ width: 15, height: 15, color: '#7F8F6A' }}
                  strokeWidth={2}
                />
              </Link>
            ))}
          </div>
          <a
            href="#sortsvarianter"
            className="group mt-2 inline-flex items-center gap-1"
            style={{
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 700,
              color: '#4E6138',
              textDecoration: 'none',
            }}
          >
            Se alle {varieties.length} {varieties.length === 1 ? 'sort' : 'sorter'}
            <ChevronDown
              className="transition-transform group-hover:translate-y-0.5"
              style={{ width: 15, height: 15 }}
              strokeWidth={2.25}
            />
          </a>
        </div>
      )}

      <div
        aria-hidden
        className="my-4 h-px"
        style={{ background: 'rgba(45,42,36,0.10)' }}
      />
      <SpoergGartneren />
    </div>
  )
}
