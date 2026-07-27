'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Leaf, ChevronDown, ChevronRight } from 'lucide-react'
import { TopicSquareCard, type ArtRow } from '@/components/guides/guides-bibliotek'

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
                  href={`/guides/${m.guideId}`}
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
                href={`/guides/${h.guideId}`}
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
              <ArtAccordionRow key={a.guideId} art={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Art-række i ALLE ARTER. FIND-navigation (ikke discovery): ren tekst, ingen
 * fotos. Har arten kuraterede sorter → foldbar (Artsguide + sortslinjer, hvert
 * et direkte link). Ingen sorter → rækken ER selv et direkte link til
 * artsguiden (ingen accordion med ét resultat).
 */
function ArtAccordionRow({ art }: { art: ArtRow }) {
  const [open, setOpen] = useState(false)
  const plantName = art.plantName

  if (art.sorts.length === 0) {
    return (
      <Link
        href={`/guides/${art.guideId}`}
        className="group flex items-center gap-2 rounded-[12px] px-2.5 py-2.5 transition-colors hover:bg-white/50"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <span
          className="min-w-0 flex-1 truncate"
          style={{ fontFamily: plex, fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em', color: '#242019' }}
        >
          {plantName}
        </span>
        <ChevronRight
          size={16}
          strokeWidth={2}
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: 'rgba(36,48,31,0.3)' }}
        />
      </Link>
    )
  }

  const n = art.sorts.length
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-[12px] px-2.5 py-2.5 text-left transition-colors hover:bg-white/50"
      >
        <span
          className="min-w-0 flex-1 truncate"
          style={{ fontFamily: plex, fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em', color: '#242019' }}
        >
          {plantName}
        </span>
        <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: 'rgba(36,48,31,0.42)' }}>
          {n} {n === 1 ? 'sort' : 'sorter'}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className="shrink-0 transition-transform duration-200"
          style={{ color: 'rgba(36,48,31,0.4)', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <div className="mb-1 ml-2.5 space-y-0.5 border-l pl-3" style={{ borderColor: 'rgba(45,42,36,0.12)' }}>
          <SortLink href={`/guides/${art.guideId}`} navn={plantName} type="Artsguide" />
          {art.sorts.map(s => (
            <SortLink key={s.id} href={`/guides/${s.id}`} navn={s.variety} type="Sortsguide" />
          ))}
        </div>
      )}
    </div>
  )
}

function SortLink({ href, navn, type }: { href: string; navn: string; type: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-[10px] px-2 py-2 transition-colors hover:bg-white/50"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <span
        className="min-w-0 flex-1 truncate"
        style={{ fontFamily: plex, fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: '#3A382F' }}
      >
        {navn}
      </span>
      <span
        style={{
          fontFamily: sans,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(86,111,60,0.7)',
        }}
      >
        {type}
      </span>
      <ChevronRight
        size={14}
        strokeWidth={2}
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: 'rgba(36,48,31,0.3)' }}
      />
    </Link>
  )
}
