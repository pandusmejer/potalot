'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Leaf } from 'lucide-react'
import { ArtNode, TopicSquareCard, type ArtRow } from '@/components/guides/guides-bibliotek'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const plex = 'var(--font-plex-condensed), sans-serif'

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
  const artCount = arts.length
  const sortCount = arts.reduce((s, a) => s + a.sortCount, 0)

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
        {/* Eyebrow bærer nu tællingen (metadata), så undertitlen kan være ren
            redaktionel tekst. Lille internt hierarki: label lidt mørkere end tal,
            samme størrelse/vægt. Altid én linje. */}
        <p
          className="truncate"
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          <span style={{ color: 'rgba(36,48,31,0.6)' }}>Guidebibliotek</span>
          <span style={{ color: 'rgba(36,48,31,0.4)' }}>
            {' · '}
            {artCount} {artCount === 1 ? 'art' : 'arter'}
            {sortCount > 0 && ` · ${sortCount} ${sortCount === 1 ? 'sort' : 'sorter'}`}
          </span>
        </p>
        <h1
          style={{
            fontFamily: plex,
            fontWeight: 600,
            fontSize: 'clamp(40px, 13vw, 58px)',
            lineHeight: 0.98,
            letterSpacing: '-0.01em',
            color: '#242019',
            margin: '9px 0 0',
          }}
        >
          {label}
        </h1>
        <p
          style={{
            fontFamily: serif,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'rgba(36,48,31,0.62)',
            margin: '8px 0 0',
          }}
        >
          {intro}
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
          {/* Samme forskudte + overlay-kort som på Guides-forsiden (TopicSquareCard). */}
          <div className="grid grid-cols-2 gap-3">
            {heroes.map((h, i) => (
              <TopicSquareCard
                key={h.guideId}
                index={i}
                href={`/guides/kategori/${slug}/${h.guideId}`}
                imageUrl={h.imageSrc ?? ''}
                navn={h.plantName}
                byline={h.sortCount > 0 ? `${h.sortCount} ${h.sortCount === 1 ? 'sort' : 'sorter'}` : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lille dekorativ skille-linje mellem AKTUELT NU og ALLE ARTER. mt-10
          rydder de forskudte korts overhæng. */}
      {heroes.length > 0 && !query && (
        <div className="mt-10 flex items-center gap-3" aria-hidden="true">
          <span
            className="h-px flex-1"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(45,42,36,0.16))' }}
          />
          <Leaf
            size={14}
            strokeWidth={1.6}
            style={{ color: 'rgba(86,111,60,0.55)', transform: 'rotate(-10deg)' }}
          />
          <span
            className="h-px flex-1"
            style={{ background: 'linear-gradient(90deg, rgba(45,42,36,0.16), transparent)' }}
          />
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
