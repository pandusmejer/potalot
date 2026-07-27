'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { Guide } from '@/lib/types'
import { Search, ChevronRight, ArrowUpRight, Leaf } from 'lucide-react'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { getRecentlyRead, type RecentRead } from '@/lib/guides/recently-read'
import { artsByCategory, type LibraryArt } from '@/lib/guides/library-arts'
import type { HaveCardData } from '@/lib/guides/min-have'
import { IDinHaveCarousel } from './i-din-have-carousel'
import { DineEgneGuides } from './dine-egne-guides'
import {
  LIBRARY_CATEGORY_ORDER,
  LIBRARY_CATEGORY_LABEL,
  LIBRARY_CATEGORY_GLYPH,
  type LibraryCategory,
} from '@/data/guide-library-categories'
import { SpoergGartneren } from './spoerg-gartneren'
import { layeredGuideSampleData } from './layered-guide'
import { KortForklaret } from './kort-forklaret'
import { guideKindFor } from './trust-badge'
import {
  POPULAERE_EMNER,
  type PopulaertEmne,
} from '@/data/guides-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
// Display-font på Guides = IBM Plex Sans Condensed (feltmanual/dyrkningsarkiv,
// ikke romantisk herbarium). Kun store overskrifter + arts-/kort-titler.
const plex = 'var(--font-plex-condensed), sans-serif'

interface Props {
  guides: Guide[]
  aiGuideIds: ReadonlySet<string> | null
  parentPlantNameById: Map<string, string>
  /**
   * "I DIN HAVE" — færdig-prioriteret udvalg af guide-objekt-kort (arts- OG
   * sortsguides), beregnet server-side (lib/guides/min-have). mineHaveTotal =
   * det fulde antal (til "Se alle N til din have"). Tom → fallback "Et godt
   * sted at starte".
   */
  mineHaveCards: HaveCardData[]
  mineHaveTotal: number
  /** Brugerens egne (private/AI) guides — "Dine egne guides"-indgangen nederst. */
  mineGuides: Guide[]
  /**
   * Atmospheric makro-billede til EditorialBleedCard-broen mellem
   * "Begynd her" og "Guides i felten". Resolved server-side i
   * /guides/page.tsx via resolvePotalotMacro. Hvis null/undefined
   * skjules broen helt (ingen død blok uden billede).
   */
  bridgeMacroSrc?: string | null
  bridgeMacroAlt?: string | null
}

export function GuidesBibliotek({
  guides,
  aiGuideIds,
  mineHaveCards,
  mineHaveTotal,
  mineGuides,
}: Props) {
  const [search, setSearch] = useState('')
  const [aktivtEmne, setAktivtEmne] = useState<PopulaertEmne | null>(null)
  // Senest læste guide-id'er fra localStorage (client-only → tom ved SSR,
  // fyldes efter mount). Ingen backend.
  const [recent, setRecent] = useState<RecentRead[]>([])
  useEffect(() => {
    setRecent(getRecentlyRead())
  }, [])

  // Delt af BÅDE quick-search (øverst) og biblioteks-søgning (nederst), så de
  // to inputs styrer præcis samme query. At skrive rydder et aktivt emne-filter.
  function handleSearch(v: string) {
    setSearch(v)
    setAktivtEmne(null)
  }

  function vaelgEmne(e: PopulaertEmne) {
    setAktivtEmne(curr => (curr?.matchPlantName === e.matchPlantName ? null : e))
    setSearch('')
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document.getElementById('guides-i-felten')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
  }

  const effectiveSearch = aktivtEmne?.matchPlantName ?? search

  const withKind = useMemo(() => {
    return guides.map(g => ({
      guide: g,
      kind: guideKindFor(g, aiGuideIds),
    }))
  }, [guides, aiGuideIds])

  const byId = useMemo(() => new Map(guides.map(g => [g.id, g])), [guides])

  // I DIN HAVE beregnes SERVER-side (sæson + prioritering, se lib/guides/
  // min-have) og kommer ind som færdige guide-objekt-kort via props.

  // ── SENEST LÆST ─────────────────────────────────────────────────
  // De guides brugeren senest har åbnet (localStorage), senest først. Max 3.
  // Kun guides der stadig findes i biblioteket. Tom → sektionen renderes ikke.
  const fortsaet = useMemo(() => {
    const out: { guide: Guide; at: number }[] = []
    for (const r of recent) {
      const g = byId.get(r.id)
      if (!g) continue
      out.push({ guide: g, at: r.at })
      if (out.length >= 3) break
    }
    return out
  }, [recent, byId])

  // Teknik-guider = eget register (handling, ikke planteidentitet). De må ALDRIG
  // ende i arts-matrixen (teknik har plantName: null → ville klumpe under en
  // tom art). Skilles ud her og vises i deres egen "Teknikguides"-værktøjskasse.
  const techniqueGuides = useMemo(
    () => guides.filter(g => g.guideLevel === 'technique'),
    [guides],
  )

  // Hele det redaktionelle 'potalot'-lag (arter + sorter) UDEN teknik.
  // Biblioteket nedenfor (UdforskBiblioteket) styrer selv chip-filtrering,
  // gruppering og søgning.
  const potalotAll = useMemo(
    () =>
      withKind
        .filter(x => x.kind === 'potalot' && x.guide.guideLevel !== 'technique')
        .map(x => x.guide),
    [withKind],
  )

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hurtig quick-search øverst: brugeren der VED hvad de leder efter kan
          søge med det samme uden at scrolle forbi hele udstillingen. Kun input,
          ingen chips/tællere/filtre — det fulde bibliotek ligger nederst. Deler
          samme search-state som biblioteks-søgningen. */}
      <QuickSearch value={search} onChange={handleSearch} />

      {/* Top-sektion: har brugeren guides der matcher frøbank/planter → personlig
          "I DIN HAVE" (kurateret udvalg af guide-objekter, swipe). Ellers falder
          vi tilbage til det redaktionelle "Et godt sted at starte". */}
      {mineHaveCards.length > 0 ? (
        <IDinHaveCarousel cards={mineHaveCards} total={mineHaveTotal} />
      ) : (
        <PopulaereEmner
          emner={POPULAERE_EMNER}
          aktivt={aktivtEmne}
          onVaelg={vaelgEmne}
        />
      )}

      {/* FORTSÆT DINE GUIDER — diskret genvej til det brugeren var i gang med.
          Små mini-editorials (foto + navn + "fortsæt"), meget lavere end
          hero-kortene. Renderes KUN når der er læste guides. */}
      {fortsaet.length > 0 && <FortsaetDineGuider items={fortsaet} />}

      {/* Lavmælt hjælpe-modul lige efter "Begynd her" — brugeren er stadig i
          "lær mig noget"-mode. Ikke chatbot, ikke stor sektion. */}
      <SpoergGartneren />

      {/* UDFORSK GUIDEBIBLIOTEKET — her skifter siden karakter fra rolig
          redaktionel indgang til effektivt ARKIV. Foldbare grupper (kun én åben
          ad gangen) → brugeren ser altid kun 8-15 elementer, selv ved hundreder
          af guides. Søgning overtager og viser flade resultater. */}
      <section id="guides-i-felten" className="scroll-mt-24">
        <UdforskBiblioteket
          guides={potalotAll}
          techniqueGuides={techniqueGuides}
          search={effectiveSearch}
        />
      </section>

      {/* DINE EGNE GUIDES — AI-genereret fallback-indhold, ÉN kompakt indgang.
          Bevidst over "Godt at vide", som lukker siden redaktionelt. */}
      <DineEgneGuides guides={mineGuides} />

      {/* GODT AT VIDE — ét redaktionelt "Kort forklaret"-kort som redaktionel
          afslutning på siden. */}
      <div className="pb-10">
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.62)',
            margin: '0 0 12px',
          }}
        >
          Godt at vide
        </p>
        <KortForklaret
          title="Chili eller peberfrugt?"
          teaser="To planter fra samme familie, men chili indeholder capsaicin."
          columns={layeredGuideSampleData.fact.columns}
        />
      </div>

      {/* Biblioteket viser kun det redaktionelle 'potalot'-lag. Egne
          guider og AI-udkast åbnes fra frø/plante/notifikation, ikke her. */}
    </div>
  )
}

/**
 * Kvadratisk foto-emnekort — DELT form mellem "Et godt sted at starte"
 * (default-emner, filter-knap) og "I DIN HAVE" (brugerens planter, link til
 * guiden). Formen er IDENTISK; kun indhold og klik-mål skifter (onClick vs href).
 */
export function TopicSquareCard({
  imageUrl,
  navn,
  byline,
  index,
  active = false,
  href,
  onClick,
}: {
  imageUrl: string
  navn: string
  byline?: string | null
  index: number
  active?: boolean
  href?: string
  onClick?: () => void
}) {
  const className = [
    'group relative isolate block overflow-hidden text-left transition-transform duration-200 ease-out hover:-translate-y-0.5',
    index % 2 === 0 ? 'translate-y-0' : 'translate-y-5',
  ].join(' ')
  const style = {
    borderRadius: index % 2 === 0 ? 24 : 18,
    aspectRatio: '4 / 3.35',
    border: active
      ? '1.5px solid rgba(61,90,38,0.75)'
      : '1px solid rgba(45,42,36,0.10)',
    background: '#F4F0E5',
  }
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(24,20,14,0.02) 20%, rgba(24,20,14,0.66) 100%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <h3
          style={{
            fontFamily: plex,
            fontWeight: 600,
            fontSize: 'clamp(24px, 7.4cqw, 33px)',
            lineHeight: 0.94,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 12px rgba(20,14,8,0.50)',
          }}
        >
          {navn}
        </h3>
        {byline && (
          <p
            className="mt-1 line-clamp-1"
            style={{
              fontFamily: sans,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.88)',
              margin: 0,
            }}
          >
            {byline}
          </p>
        )}
      </div>
    </>
  )
  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {inner}
    </button>
  )
}

/**
 * Ægte hukommelsesstøtte af HVORNÅR guiden sidst blev åbnet. Aldrig en
 * generisk linje: kender vi ikke tidspunktet (legacy/ældre end 2 uger),
 * returnerer vi null → kortet får INGEN undertitel (bedre end en tom floskel).
 */
function laestLabel(at: number): string | null {
  if (!at) return null
  const now = new Date()
  const then = new Date(at)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime()
  const days = Math.round((startToday - startThen) / 86_400_000)
  if (days <= 0) return 'Læst i dag'
  if (days === 1) return 'Læst i går'
  if (days < 7) return `Læst for ${days} dage siden`
  if (days < 14) return 'Læst i sidste uge'
  return null
}

/**
 * SENEST LÆST — diskret genkendelses-række (utility, IKKE featured content).
 * Bevidst nedtonet ift. "I din have": mindre eyebrow, ~74px rækker → føles som
 * historik/navigation, ikke en ny stor sektion. For sortsguider vises SORTENS
 * navn + foto (Sungold, ikke artens tomat) → hurtigere genkendelse.
 */
function FortsaetDineGuider({
  items,
}: {
  items: { guide: Guide; at: number }[]
}) {
  return (
    <section className="relative">
      <p
        style={{
          fontFamily: sans,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.55)',
          margin: '0 0 10px',
        }}
      >
        Senest læst
      </p>
      <div className="space-y-2.5">
        {items.map(({ guide: g, at }) => {
          const isVar = g.guideLevel === 'variety' || !!g.variety
          const { src } = resolvePotalotImage({
            guideId: g.id,
            speciesSlug: isVar ? g.parentGuideId : g.id,
            varietySlug: isVar ? g.id : null,
            role: isVar ? 'variety-hero' : 'species-hero',
            preferredSrc: g.primaryImageId,
          })
          const hasPhoto = !!g.primaryImageId
          const undertitel = laestLabel(at)
          return (
            <Link
              key={g.id}
              href={`/guides/${g.id}`}
              className="group flex items-center overflow-hidden rounded-[16px] border transition-colors duration-200 hover:border-[rgba(86,111,60,0.28)]"
              style={{
                height: 74,
                background: 'rgba(244,240,229,0.96)',
                borderColor: 'rgba(45,42,36,0.09)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div className="relative h-full w-[74px] shrink-0 overflow-hidden bg-[#EAE6D8]">
                {hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
                  />
                ) : (
                  // Bevidst blød creme-flade + diskret bladmotiv (ikke en død grå
                  // plante). Føles som et designvalg, ikke en manglende asset.
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background:
                        'radial-gradient(120% 120% at 30% 20%, #F1ECDC 0%, #E4E0CE 100%)',
                    }}
                  >
                    <Leaf
                      size={24}
                      strokeWidth={1.5}
                      style={{ color: 'rgba(86,111,60,0.32)', transform: 'rotate(-12deg)' }}
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 px-3.5">
                {/* Både sort OG art — bredden kalder på det: "Marketmore · agurk".
                    Arts-kortet viser bare artsnavnet. lineHeight 1.3 så "g"-
                    descenderen ikke klippes af truncate/overflow. */}
                <p
                  className="truncate"
                  style={{
                    fontFamily: plex,
                    fontWeight: 600,
                    fontSize: 18,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                    color: '#242019',
                    margin: 0,
                  }}
                >
                  {g.variety ? (
                    <>
                      {g.variety}
                      <span style={{ fontWeight: 500, color: 'rgba(36,48,31,0.45)' }}>
                        {' · '}
                        {g.plantName.toLowerCase()}
                      </span>
                    </>
                  ) : (
                    g.plantName
                  )}
                </p>
                {undertitel && (
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'rgba(36,48,31,0.5)',
                      margin: '2px 0 0',
                    }}
                  >
                    {undertitel}
                  </p>
                )}
              </div>
              <ChevronRight
                size={17}
                strokeWidth={2}
                className="mr-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                style={{ color: 'rgba(36,48,31,0.32)' }}
              />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function PopulaereEmner({
  emner,
  aktivt,
  onVaelg,
}: {
  emner: PopulaertEmne[]
  aktivt: PopulaertEmne | null
  onVaelg: (e: PopulaertEmne) => void
}) {
  return (
    <section className="relative -mt-2">
      <div className="relative z-10 mb-3">
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
          Et godt sted at starte
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {emner.map((e, index) => (
          <TopicSquareCard
            key={e.matchPlantName}
            index={index}
            active={aktivt?.matchPlantName === e.matchPlantName}
            onClick={() => onVaelg(e)}
            imageUrl={e.imageUrl}
            navn={e.navn}
            byline={e.byline}
          />
        ))}
      </div>
      {aktivt && (
        <p
          className="mt-8"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 500,
            color: 'rgba(36,48,31,0.58)',
            marginBottom: 0,
          }}
        >
          Viser {aktivt.navn.toLowerCase()}.{' '}
          <button
            type="button"
            onClick={() => onVaelg(aktivt)}
            className="underline underline-offset-4"
            style={{
              color: '#3D5A26',
              fontFamily: sans,
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            Vis alle
          </button>
        </p>
      )}
    </section>
  )
}

/**
 * Delt søge-input — samme rolige felt-index-stil for både quick-search (øverst)
 * og biblioteks-søgningen (nederst), så de to inputs ser ens ud og deler query.
 */
function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div
      className="relative"
      style={{
        borderRadius: 18,
        background: 'rgba(244,240,229,0.68)',
        border: '1px solid rgba(36,48,31,0.10)',
        padding: '3px 5px',
      }}
    >
      <Search
        aria-hidden
        className="absolute left-4 top-1/2 -translate-y-1/2"
        style={{ width: 15, height: 15, color: 'rgba(36,48,31,0.42)' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 500,
          color: '#24301F',
          padding: '11px 10px 11px 32px',
        }}
      />
    </div>
  )
}

/**
 * QuickSearch — hurtig indgang øverst (efter hero, før "Et godt sted at starte").
 * Bevidst let: lille sans-label + input. INGEN chips/tællere/filtre — det fulde
 * bibliotek med filtrering ligger nederst. Distinkt fra bibliotekets serif-intro.
 */
function QuickSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <section className="relative -mt-6">
      <SearchField
        value={value}
        onChange={onChange}
        placeholder="Søg guide til plante, sort eller problem"
      />
    </section>
  )
}

// ════════════════════════════════════════════════════════════════
// UDFORSK GUIDEBIBLIOTEKET — matrix (kategori → art → sort)
// ════════════════════════════════════════════════════════════════
// Ét hierarki, ikke to biblioteker: en SORT bor under en ART, en art under en
// bibliotekskategori (navigations-kategori, ikke botanik). Foldbare niveauer,
// kun ÉN åben ad gangen pr. niveau → altid kun få elementer synlige. Søgning
// overtager og viser flade resultater (Planter/Teknik). Teknik er parallelt.


function UdforskBiblioteket({
  guides,
  techniqueGuides,
  search,
}: {
  guides: Guide[]
  techniqueGuides: Guide[]
  search: string
}) {
  // Kategori → arter (delt model, samme tal som kategorisiden viser).
  const cats = useMemo(() => artsByCategory(guides), [guides])

  // ── Søgning overtager hele hierarkiet (flade resultater) ─────────
  const q = search.trim().toLowerCase()
  const searching = q.length > 0
  const matches = (g: Guide) =>
    g.plantName.toLowerCase().includes(q) ||
    (g.variety?.toLowerCase().includes(q) ?? false) ||
    (g.latinName?.toLowerCase().includes(q) ?? false) ||
    g.summary.toLowerCase().includes(q) ||
    g.tags.some(t => t.toLowerCase().includes(q))
  const planteHits = useMemo(
    () => (searching ? guides.filter(matches) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searching, guides, q],
  )
  const teknikHits = useMemo(
    () => (searching ? techniqueGuides.filter(matches) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searching, techniqueGuides, q],
  )

  return (
    <div>
      <Eyebrow>Udforsk guidebiblioteket</Eyebrow>
      <p
        style={{
          fontFamily: sans,
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.45,
          color: 'rgba(36,48,31,0.55)',
          margin: '6px 0 0',
        }}
      >
        Find guides efter det, du dyrker — eller det, du skal gøre.
      </p>

      {searching ? (
        planteHits.length + teknikHits.length === 0 ? (
          <div className="mt-6">
            <EmptyNote text="Ingen guide matcher. Prøv et andet ord." />
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {planteHits.length > 0 && (
              <div>
                <SectionLabel>Planter</SectionLabel>
                <div className="mt-3 space-y-2">
                  {planteHits.map(g => <BiblioRow key={g.id} guide={g} />)}
                </div>
              </div>
            )}
            {teknikHits.length > 0 && (
              <div>
                <SectionLabel tone="teknik">Teknik</SectionLabel>
                <div className="mt-3 space-y-2">
                  {teknikHits.map(g => <BiblioRow key={g.id} guide={g} teknik />)}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="mt-5 space-y-5">
          {/* Kategori-indgange: 2-kol grid, KUN kategorier med indhold (ingen
              "0 arter"-byggepladser). Hver → sin egen kategoriside. Brugeren ser
              hele bibliotekets struktur på ~én skærm og vælger, hvor de vil hen. */}
          <div className="grid grid-cols-2 gap-2.5">
            {LIBRARY_CATEGORY_ORDER.map(c => {
              const arts = cats.get(c) ?? []
              if (arts.length === 0) return null
              return <KategoriKort key={c} category={c} arts={arts} />
            })}
          </div>

          {/* Teknikguides — ÉN tydelig indgang (arbejde, ikke art) → egen side.
              De enkelte teknikguider bor IKKE på forsiden. */}
          {techniqueGuides.length > 0 && <TeknikIndgang count={techniqueGuides.length} />}
        </div>
      )}
    </div>
  )
}

/**
 * Kompakt kategori-kort (2-kol grid) → kategorisiden. Redaktionel botanisk
 * indgang, ikke database-række: navn + antal arter + afdæmpet soft-glyph som
 * vandmærke. INGEN chevron/arts-eksempler (hele kortet er klikbart; glyphen
 * giver identiteten). Glyphen er en EKSISTERENDE Potalot-glyph — ingen ny asset.
 */
function KategoriKort({ category, arts }: { category: LibraryCategory; arts: LibraryArt[] }) {
  const n = arts.length
  // Tæl KUN sorter med en kurateret sortsguide i biblioteket (variety-guides),
  // ikke alle frøbank-/taxonomy-sorter — ellers lover kortet indhold der ikke
  // kan findes.
  const sortCount = arts.reduce((sum, a) => sum + a.varieties.length, 0)
  const glyph = LIBRARY_CATEGORY_GLYPH[category]
  return (
    <Link
      href={`/guides/kategori/${category}`}
      className="group relative block overflow-hidden no-underline"
      style={{
        background: 'rgba(244,240,229,0.96)',
        border: '1px solid rgba(45,42,36,0.10)',
        borderRadius: 16,
        padding: '13px 14px',
        minHeight: 84,
        color: 'inherit',
      }}
    >
      {/* Afdæmpet botanisk vandmærke — større og placeret ekspansivt mod nederste
          højre hjørne, så det bevidst beskæres af kortets højre + nederste kant.
          Uændret lav styrke (~18 %) så kategorinavnet beholder første prioritet. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/glyphs/${glyph}.png`}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        style={{ width: 96, height: 96, right: -18, bottom: -20, opacity: 0.18, objectFit: 'contain' }}
      />
      <span className="relative">
        <span
          className="block"
          style={{
            fontFamily: plex,
            fontWeight: 600,
            fontSize: 17,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: '#242019',
          }}
        >
          {LIBRARY_CATEGORY_LABEL[category]}
        </span>
        <span
          className="mt-0.5 block"
          style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: 'rgba(36,48,31,0.5)' }}
        >
          {n} {n === 1 ? 'art' : 'arter'}
          {sortCount > 0 && ` · ${sortCount} ${sortCount === 1 ? 'sort' : 'sorter'}`}
        </span>
      </span>
    </Link>
  )
}

/**
 * TEKNIKGUIDES-indgang — ét bredere kort (grønlig tone, adskilt fra plante-
 * kategorierne) → tekniksiden.
 */
function TeknikIndgang({ count }: { count: number }) {
  return (
    <Link
      href="/guides/teknik"
      className="group relative block overflow-hidden no-underline"
      style={{
        background: 'linear-gradient(155deg, rgba(86,111,60,0.14) 0%, rgba(86,111,60,0.05) 68%)',
        border: '1px solid rgba(86,111,60,0.22)',
        borderRadius: 18,
        padding: '18px 18px 16px',
        minHeight: 132,
        color: 'inherit',
      }}
    >
      {/* Stor, beskåret grensaks-glyph som lavkontrast-vandmærke der blør ud over
          højre kant. Ingen ikon-boks — redaktionelt, ikke "indstilling". */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/glyphs/beskarersaks.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        style={{
          width: 158,
          height: 158,
          right: -34,
          top: '50%',
          transform: 'translateY(-50%) rotate(-8deg)',
          opacity: 0.14,
          objectFit: 'contain',
        }}
      />
      <ArrowUpRight
        size={18}
        strokeWidth={2}
        className="absolute right-4 top-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        style={{ color: 'rgba(75,102,54,0.6)' }}
      />
      {/* Editorial-hierarki: invitation (serif) → forklaring → eksempler → antal.
          Serif-titel adskiller "en anden indgang" fra kategoriernes plex-navne. */}
      <div className="relative" style={{ maxWidth: '76%' }}>
        <h3
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 26,
            lineHeight: 1.02,
            color: '#233019',
            margin: 0,
          }}
        >
          Hvad skal du gøre?
        </h3>
        <p
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'rgba(36,48,31,0.6)',
            margin: '5px 0 0',
          }}
        >
          Teknikguides til arbejdet i haven.
        </p>
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.5)',
            margin: '13px 0 0',
          }}
        >
          {['Så', 'Bind op', 'Beskær', 'Høst'].map((w, i) => (
            <span key={w}>
              {i > 0 && (
                <span
                  style={{
                    color: '#7F8F6A',
                    fontWeight: 700,
                    fontSize: 17,
                    lineHeight: 0,
                    verticalAlign: '-2px',
                    margin: '0 8px',
                  }}
                >
                  ·
                </span>
              )}
              {w}
            </span>
          ))}
        </p>
        <p
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            color: '#4E6138',
            margin: '6px 0 0',
          }}
        >
          {count} guides
        </p>
      </div>
    </Link>
  )
}

/** Slank art-række til kategorisidens A–Å-liste (serialiserer ikke fulde guides). */
export interface ArtRow {
  plantName: string
  /** Artsguidens id (species-hero, ellers første sort). */
  guideId: string
  sortCount: number
  /** Kuraterede sortsguider under arten (til accordion) — id + sortsnavn. */
  sorts: { id: string; variety: string }[]
}

/**
 * Art-node i "Alle arter"-listen (kategorisiden). Klik → artssamlingen (ikke
 * artsguiden): dér findes sorterne direkte. Viser sort-tal som hint.
 */
export function ArtNode({
  plantName,
  href,
  sortCount: n,
}: {
  plantName: string
  href: string
  sortCount: number
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-[12px] px-2.5 py-2.5 transition-colors hover:bg-white/50"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <span
        className="min-w-0 flex-1 truncate"
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: '-0.01em',
          color: '#242019',
        }}
      >
        {plantName}
      </span>
      {n > 0 && (
        <span
          style={{
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.42)',
          }}
        >
          {n} {n === 1 ? 'sort' : 'sorter'}
        </span>
      )}
      <ChevronRight
        size={16}
        strokeWidth={2}
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: 'rgba(36,48,31,0.3)' }}
      />
    </Link>
  )
}

function SectionLabel({
  children,
  tone,
}: {
  children: ReactNode
  tone?: 'teknik'
}) {
  return (
    <p
      style={{
        fontFamily: sans,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: tone === 'teknik' ? 'rgba(60,54,44,0.72)' : 'rgba(36,48,31,0.62)',
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}

/** Lille listekort — sortsguider + teknikguider. Thumbnail + navn + chevron. */
export function BiblioRow({ guide, teknik = false }: { guide: Guide; teknik?: boolean }) {
  const isVar = guide.guideLevel === 'variety' || !!guide.variety
  const { src } = resolvePotalotImage({
    guideId: guide.id,
    speciesSlug: isVar ? guide.parentGuideId : guide.id,
    varietySlug: isVar ? guide.id : null,
    role: isVar ? 'variety-hero' : 'species-hero',
    preferredSrc: guide.primaryImageId,
  })
  const hasPhoto = !!guide.primaryImageId
  // Teknikguider har title (plantName/variety = null) → title først.
  const titel = guide.title ?? guide.variety ?? guide.plantName
  return (
    <Link
      href={`/guides/${guide.id}`}
      className="group flex items-center overflow-hidden rounded-[13px] border transition-colors hover:border-[rgba(86,111,60,0.28)]"
      style={{
        height: 58,
        background: teknik ? 'rgba(58,54,44,0.055)' : 'rgba(244,240,229,0.96)',
        borderColor: 'rgba(45,42,36,0.09)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div className="relative h-full w-[58px] shrink-0 overflow-hidden bg-[#EAE6D8]">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                'radial-gradient(120% 120% at 30% 20%, #F1ECDC 0%, #E4E0CE 100%)',
            }}
          >
            <Leaf
              size={20}
              strokeWidth={1.5}
              style={{ color: 'rgba(86,111,60,0.32)', transform: 'rotate(-12deg)' }}
            />
          </div>
        )}
      </div>
      <p
        className="min-w-0 flex-1 truncate px-3"
        style={{
          fontFamily: plex,
          fontWeight: 600,
          fontSize: 16.5,
          letterSpacing: '-0.01em',
          color: '#242019',
          margin: 0,
        }}
      >
        {titel}
      </p>
      <ChevronRight
        size={16}
        strokeWidth={2}
        className="mr-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: 'rgba(36,48,31,0.3)' }}
      />
    </Link>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </p>
  )
}

function EmptyNote({ text }: { text: string }) {
  return (
    <p
      style={{
        fontFamily: serif,
        fontStyle: 'italic',
        fontSize: 16,
        lineHeight: 1.45,
        color: 'rgba(36,48,31,0.50)',
        margin: 0,
        maxWidth: 460,
      }}
    >
      {text}
    </p>
  )
}
