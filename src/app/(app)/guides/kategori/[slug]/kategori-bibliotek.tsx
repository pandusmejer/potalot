'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { ArtNode, type ArtRow } from '@/components/guides/guides-bibliotek'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * Kategoriside — hero + søg-i-kategori + I DIN HAVE + ALLE ARTER (A–Å). Den
 * lange alfabetiske liste hører hjemme HER: brugeren har aktivt valgt kategorien,
 * så listen er svar, ikke støj (modsat på forsiden).
 */
export function KategoriBibliotek({
  slug,
  label,
  intro,
  arts,
  heroes,
  mineArts,
}: {
  slug: string
  label: string
  intro: string
  arts: ArtRow[]
  heroes: { plantName: string; guideId: string; sortCount: number; imageSrc: string | null }[]
  mineArts: { plantName: string; guideId: string }[]
}) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const shown = useMemo(
    () => (query ? arts.filter(a => a.plantName.toLowerCase().includes(query)) : arts),
    [arts, query],
  )

  return (
    <div>
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
          Guidebibliotek
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
          {label}
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
          {intro} · {arts.length} {arts.length === 1 ? 'artsguide' : 'artsguider'}
        </p>
      </header>

      {/* Søg kun i denne kategori */}
      <div
        className="mt-5 flex items-center gap-2.5 rounded-[14px] px-3.5"
        style={{ background: 'rgba(244,240,229,0.7)', border: '1px solid rgba(45,42,36,0.12)', height: 48 }}
      >
        <Search size={17} strokeWidth={2} style={{ color: 'rgba(36,48,31,0.4)' }} aria-hidden />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={`Søg blandt ${label.toLowerCase()}`}
          className="min-w-0 flex-1 bg-transparent outline-none"
          style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 500, color: '#242019' }}
        />
      </div>

      {/* I DIN HAVE — kompakt linje af arter fra brugerens frøbank i denne kategori */}
      {mineArts.length > 0 && !query && (
        <div className="mt-6">
          <p
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(36,48,31,0.55)',
              margin: '0 0 8px',
            }}
          >
            I din have
          </p>
          <div className="flex flex-wrap gap-x-1.5 gap-y-1">
            {mineArts.map((m, i) => (
              <span key={m.guideId}>
                <Link
                  href={`/guides/kategori/${slug}/${m.guideId}`}
                  className="no-underline"
                  style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: '#3D5A26' }}
                >
                  {m.plantName}
                </Link>
                {i < mineArts.length - 1 && (
                  <span style={{ color: 'rgba(36,48,31,0.3)' }}> · </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AKTUELT NU — sæson-drevne arter som store visuelle indgange (arter der
          skal sås/plantes/høstes nu). Discovery, ikke 36 ens tekstrækker. */}
      {heroes.length > 0 && !query && (
        <div className="mt-7">
          <p
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(36,48,31,0.5)',
              margin: '0 0 10px',
            }}
          >
            Aktuelt nu
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {heroes.map(h => (
              <Link
                key={h.guideId}
                href={`/guides/kategori/${slug}/${h.guideId}`}
                className="group relative overflow-hidden no-underline"
                style={{
                  aspectRatio: '3 / 2.7',
                  borderRadius: 18,
                  border: '1px solid rgba(45,42,36,0.10)',
                  background: '#EAE6D8',
                  color: 'inherit',
                }}
              >
                {h.imageSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.imageSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(24,20,14,0.02) 40%, rgba(24,20,14,0.68) 100%)' }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <span
                    className="block"
                    style={{
                      fontFamily: 'var(--font-plex-condensed), sans-serif',
                      fontWeight: 600,
                      fontSize: 22,
                      lineHeight: 1,
                      color: '#FFF',
                      textShadow: '0 2px 12px rgba(20,14,8,0.5)',
                    }}
                  >
                    {h.plantName}
                  </span>
                  {h.sortCount > 0 && (
                    <span
                      className="mt-0.5 block"
                      style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}
                    >
                      {h.sortCount} {h.sortCount === 1 ? 'sort' : 'sorter'}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ALLE ARTER — A–Å */}
      <div className="mt-7">
        <p
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.5)',
            margin: '0 0 8px',
          }}
        >
          {query ? `${shown.length} ${shown.length === 1 ? 'art' : 'arter'}` : 'Alle arter'}
        </p>
        {shown.length === 0 ? (
          <p
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 15,
              color: 'rgba(36,48,31,0.45)',
              margin: '4px 0 0',
            }}
          >
            Ingen art matcher. Prøv et andet ord.
          </p>
        ) : (
          <div className="space-y-0.5">
            {shown.map(a => (
              <ArtNode
                key={a.guideId}
                plantName={a.plantName}
                href={`/guides/kategori/${slug}/${a.guideId}`}
                sortCount={a.sortCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
