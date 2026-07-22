'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { Guide } from '@/lib/types'
import { Search, ArrowRight, ChevronRight, Leaf } from 'lucide-react'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { getRecentlyRead, type RecentRead } from '@/lib/guides/recently-read'
import {
  foodCategoryOf,
  FOOD_CATEGORY_ORDER,
  FOOD_CATEGORY_LABEL,
  type FoodCategory,
} from '@/data/guide-food-categories'
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

/**
 * Arts- vs sortsguide — samme regel som kortenes egen type-chip (guideLevel med
 * variety-navn som fallback), så filtre og kort-mærkater altid er enige.
 */
function levelOf(g: Guide): 'species' | 'variety' {
  return g.guideLevel === 'variety' || g.variety ? 'variety' : 'species'
}

interface Props {
  guides: Guide[]
  aiGuideIds: ReadonlySet<string> | null
  parentPlantNameById: Map<string, string>
  iFroebankIds: ReadonlySet<string>
  /**
   * Atmospheric makro-billede til EditorialBleedCard-broen mellem
   * "Begynd her" og "Guides i felten". Resolved server-side i
   * /guides/page.tsx via resolvePotalotMacro. Hvis null/undefined
   * skjules broen helt (ingen død blok uden billede).
   */
  bridgeMacroSrc?: string | null
  bridgeMacroAlt?: string | null
  /**
   * Teknik-guides (forkultivering, opbinding, vanding …). Egen værktøjskasse
   * nederst i biblioteket — vises KUN når der findes mindst én. Tom nu → skjult.
   */
  techniqueGuides?: Guide[]
}

export function GuidesBibliotek({
  guides,
  aiGuideIds,
  iFroebankIds,
  techniqueGuides = [],
}: Props) {
  const [search, setSearch] = useState('')
  const [aktivtEmne, setAktivtEmne] = useState<PopulaertEmne | null>(null)
  const [visAlleMine, setVisAlleMine] = useState(false)
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

  // ── I DIN HAVE ──────────────────────────────────────────────────
  // De store hero-kort trækkes fra brugerens frøbank/planter, så de er
  // RELEVANTE (ikke redaktionelle default-emner). Match frøbank → guide og
  // LØFT til artsniveau: har brugeren 5 tomatsorter, vises ÉN tomat-artsguide,
  // ikke fem kort. Dedup på art. Kun 'potalot'-guides (kvalitetssikrede).
  const mineHave = useMemo(() => {
    const seen = new Set<string>()
    const out: Guide[] = []
    for (const id of iFroebankIds) {
      const g = byId.get(id)
      if (!g) continue
      const isVar = g.guideLevel === 'variety' || !!g.variety
      const speciesId =
        isVar && g.parentGuideId && byId.has(g.parentGuideId)
          ? g.parentGuideId
          : g.id
      if (seen.has(speciesId)) continue
      const target = byId.get(speciesId)
      if (!target || guideKindFor(target, aiGuideIds) !== 'potalot') continue
      seen.add(speciesId)
      out.push(target)
    }
    return out.sort((a, b) => a.plantName.localeCompare(b.plantName, 'da'))
  }, [iFroebankIds, byId, aiGuideIds])

  // ── FORTSÆT DINE GUIDES ─────────────────────────────────────────
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

  // Hele det redaktionelle 'potalot'-lag (arter + sorter). Biblioteket nedenfor
  // (UdforskBiblioteket) styrer selv chip-filtrering, gruppering og søgning.
  const potalotAll = useMemo(
    () => withKind.filter(x => x.kind === 'potalot').map(x => x.guide),
    [withKind],
  )

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hurtig quick-search øverst: brugeren der VED hvad de leder efter kan
          søge med det samme uden at scrolle forbi hele udstillingen. Kun input,
          ingen chips/tællere/filtre — det fulde bibliotek ligger nederst. Deler
          samme search-state som biblioteks-søgningen. */}
      <QuickSearch value={search} onChange={handleSearch} />

      {/* Top-sektion: hvis brugeren HAR noget i frøbank/planter der matcher en
          guide → personlig "I DIN HAVE" med store hero-kort. Ellers falder vi
          tilbage til det redaktionelle "Et godt sted at starte". */}
      {mineHave.length > 0 ? (
        <IDinHave
          guides={mineHave}
          visAlle={visAlleMine}
          onToggle={() => setVisAlleMine(v => !v)}
        />
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
          onSearch={handleSearch}
        />
      </section>

      {/* Sekundært lær-mere-lag NEDERST — ekstra læring efter find-en-guide-
          værktøjet, ikke en stopklods før søgningen. Bevidst nedtonet så den
          ikke konkurrerer med søgningen. Ekstra bundluft så bottom-nav ikke
          klemmer noten. */}
      <div className="pb-10">
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
function TopicSquareCard({
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
 * I DIN HAVE — personlig top-sektion. SAMME kvadratiske foto-kort som "Et godt
 * sted at starte", men indholdet trækkes fra brugerens frøbank/planter (mineHave
 * i parent) → relevante planter. Viser max 4; har brugeren flere, henvises
 * resten via "Se alle dine planteguides (N)". Klik → plantens guide.
 */
function IDinHave({
  guides,
  visAlle,
  onToggle,
}: {
  guides: Guide[]
  visAlle: boolean
  onToggle: () => void
}) {
  const shown = visAlle ? guides : guides.slice(0, 4)
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
            // En tand mørkere end "Et godt sted at starte" (0.72 → 0.85): den
            // personlige sektion vejer tungere.
            color: 'rgba(36,48,31,0.85)',
            margin: 0,
          }}
        >
          I din have
        </p>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: 15.5,
            lineHeight: 1.3,
            color: 'rgba(36,48,31,0.58)',
            margin: '5px 0 0',
          }}
        >
          Fortsæt med det, du allerede dyrker.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {shown.map((g, i) => {
          const isVar = g.guideLevel === 'variety' || !!g.variety
          const { src } = resolvePotalotImage({
            guideId: g.id,
            speciesSlug: isVar ? g.parentGuideId : g.id,
            varietySlug: isVar ? g.id : null,
            role: isVar ? 'variety-hero' : 'species-hero',
            preferredSrc: g.primaryImageId,
          })
          return (
            <TopicSquareCard
              key={g.id}
              index={i}
              href={`/guides/${g.id}`}
              imageUrl={src}
              navn={g.pluralName ?? g.plantName}
              byline={g.summary}
            />
          )
        })}
      </div>
      {guides.length > 4 && (
        <button
          type="button"
          onClick={onToggle}
          className="group mt-8 inline-flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#3D5A26',
          }}
        >
          {visAlle ? 'Vis færre' : `Se alle dine planteguides (${guides.length})`}
          <ArrowRight
            size={15}
            strokeWidth={2}
            className="transition-transform group-hover:translate-x-0.5"
            style={{ transform: visAlle ? 'rotate(-90deg)' : 'none' }}
          />
        </button>
      )}
    </section>
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
 * FORTSÆT DINE GUIDES — diskret genkendelses-række for senest læste guides.
 * Små mini-editorials (~74px): foto til venstre, plantenavn + hvornår-læst til
 * højre, lille chevron. For sortsguider vises SORTENS navn + foto (Sungold, ikke
 * artens tomat) → hurtigere genkendelse. Ingen resume, ingen latin. Samme creme
 * + typografi, bare meget lavere end hero-kortene.
 */
function FortsaetDineGuider({
  items,
}: {
  items: { guide: Guide; at: number }[]
}) {
  return (
    <section className="relative -mt-1">
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.72)',
          margin: '0 0 12px',
        }}
      >
        Fortsæt dine guides
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
          const titel = g.variety ?? g.plantName
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
                <p
                  className="truncate"
                  style={{
                    fontFamily: plex,
                    fontWeight: 600,
                    fontSize: 18,
                    lineHeight: 1.05,
                    letterSpacing: '-0.01em',
                    color: '#242019',
                    margin: 0,
                  }}
                >
                  {titel}
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
// UDFORSK GUIDEBIBLIOTEKET — arkivet (ikke et feed)
// ════════════════════════════════════════════════════════════════
// Foldbare grupper, kun ÉN åben ad gangen pr. sektion → brugeren ser altid kun
// 8-15 elementer, selv ved hundreder af guides. Arter = kvadratiske hero-kort
// (indgang/udstilling); sorter = små listekort (fordybelse); teknik = separat
// værktøjskasse. Søgning overtager og viser flade resultater (Planter/Teknik).

type BiblioChip = 'alle' | 'arter' | 'sorter' | 'teknik'
const FOLD_KEY = 'potalot:biblio-fold'

function UdforskBiblioteket({
  guides,
  techniqueGuides,
  search,
  onSearch,
}: {
  guides: Guide[]
  techniqueGuides: Guide[]
  search: string
  onSearch: (v: string) => void
}) {
  const [chip, setChip] = useState<BiblioChip>('alle')
  // Kun ÉN gruppe åben ad gangen pr. sektion; tilstanden huskes (localStorage).
  const [openCat, setOpenCat] = useState<FoodCategory | null>('groentsag')
  const [openArt, setOpenArt] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FOLD_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if ('cat' in s) setOpenCat(s.cat)
        if ('art' in s) setOpenArt(s.art)
      }
    } catch {
      // ignorér
    }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(FOLD_KEY, JSON.stringify({ cat: openCat, art: openArt }))
    } catch {
      // ignorér
    }
  }, [openCat, openArt])

  const arter = useMemo(() => guides.filter(g => levelOf(g) === 'species'), [guides])
  const sorter = useMemo(() => guides.filter(g => levelOf(g) === 'variety'), [guides])

  // ARTER grupperet i mad-kategorier (kurateret kort, ikke datamodel-felt).
  const arterByCat = useMemo(() => {
    const m = new Map<FoodCategory, Guide[]>()
    for (const g of arter) {
      const c = foodCategoryOf(g.plantName)
      const arr = m.get(c) ?? []
      arr.push(g)
      m.set(c, arr)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.plantName.localeCompare(b.plantName, 'da'))
    }
    return m
  }, [arter])

  // SORTER grupperet pr. art (plantName) — arten er indgangen, sorterne dybden.
  const sorterByArt = useMemo(() => {
    const m = new Map<string, Guide[]>()
    for (const g of sorter) {
      const arr = m.get(g.plantName) ?? []
      arr.push(g)
      m.set(g.plantName, arr)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => (a.variety ?? '').localeCompare(b.variety ?? '', 'da'))
    }
    return m
  }, [sorter])
  const artOrder = useMemo(
    () => [...sorterByArt.keys()].sort((a, b) => a.localeCompare(b, 'da')),
    [sorterByArt],
  )

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

  const chips: { id: BiblioChip; label: string }[] = [
    { id: 'alle', label: 'Alle' },
    { id: 'arter', label: 'Arter' },
    { id: 'sorter', label: 'Sorter' },
    ...(techniqueGuides.length > 0
      ? [{ id: 'teknik' as const, label: 'Teknik' }]
      : []),
  ]

  const visArter = chip === 'alle' || chip === 'arter'
  const visSorter = chip === 'alle' || chip === 'sorter'
  const visTeknik = (chip === 'alle' || chip === 'teknik') && techniqueGuides.length > 0

  const toggleExpanded = (key: string) =>
    setExpanded(e => ({ ...e, [key]: !e[key] }))

  return (
    <div>
      <Eyebrow>Udforsk guidebiblioteket</Eyebrow>
      <div className="mt-3">
        <SearchField value={search} onChange={onSearch} placeholder="Søg i biblioteket" />
      </div>

      {!searching && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChip(c.id)}
              style={chipStyle(chip === c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

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
        <div className="mt-6 space-y-8">
          {/* 🌱 PLANTEGUIDER — arter i mad-kategorier, hero-kort */}
          {visArter && (
            <div>
              <SectionLabel>Planteguider</SectionLabel>
              <div className="mt-3 space-y-2">
                {FOOD_CATEGORY_ORDER.filter(
                  c => (arterByCat.get(c)?.length ?? 0) > 0,
                ).map(c => {
                  const items = arterByCat.get(c)!
                  const open = openCat === c
                  const key = 'cat:' + c
                  const showAll = !!expanded[key]
                  const shown = showAll ? items : items.slice(0, 2)
                  return (
                    <GroupBlock
                      key={c}
                      label={FOOD_CATEGORY_LABEL[c]}
                      count={items.length}
                      open={open}
                      onToggle={() => setOpenCat(open ? null : c)}
                    >
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {shown.map((g, i) => (
                          <ArtHeroCard key={g.id} guide={g} index={i} />
                        ))}
                      </div>
                      {items.length > 2 && (
                        <VisAlleKnap onClick={() => toggleExpanded(key)}>
                          {showAll
                            ? 'Vis færre'
                            : `Vis alle ${FOOD_CATEGORY_LABEL[c].toLowerCase()} (${items.length})`}
                        </VisAlleKnap>
                      )}
                    </GroupBlock>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🌿 SORTSGUIDER — sorter pr. art, små listekort */}
          {visSorter && artOrder.length > 0 && (
            <div>
              <SectionLabel>Sortsguider</SectionLabel>
              <div className="mt-3 space-y-2">
                {artOrder.map(art => {
                  const items = sorterByArt.get(art)!
                  const open = openArt === art
                  const key = 'art:' + art
                  const showAll = !!expanded[key]
                  const shown = showAll ? items : items.slice(0, 5)
                  return (
                    <GroupBlock
                      key={art}
                      label={art}
                      count={items.length}
                      open={open}
                      onToggle={() => setOpenArt(open ? null : art)}
                    >
                      <div className="mt-2 space-y-2">
                        {shown.map(g => <BiblioRow key={g.id} guide={g} />)}
                      </div>
                      {items.length > 5 && (
                        <VisAlleKnap onClick={() => toggleExpanded(key)}>
                          {showAll
                            ? 'Vis færre'
                            : `Se alle ${art.toLowerCase()} (${items.length})`}
                        </VisAlleKnap>
                      )}
                    </GroupBlock>
                  )
                })}
              </div>
            </div>
          )}

          {/* 🛠 TEKNIKGUIDER — egen værktøjskasse, kun når de findes */}
          {visTeknik && (
            <div>
              <SectionLabel tone="teknik">Teknikguider</SectionLabel>
              <div className="mt-3 space-y-2">
                {techniqueGuides.map(g => <BiblioRow key={g.id} guide={g} teknik />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function chipStyle(active: boolean) {
  return {
    fontFamily: sans,
    fontSize: 12,
    fontWeight: 650,
    padding: '7px 14px',
    borderRadius: 999,
    background: active ? 'rgba(36,48,31,0.9)' : 'rgba(244,240,229,0.55)',
    color: active ? '#F6F3EB' : 'rgba(36,48,31,0.62)',
    border: active
      ? '1px solid rgba(36,48,31,0.9)'
      : '1px solid rgba(36,48,31,0.12)',
  } as const
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

/** Foldbar gruppe: header (chevron + navn + antal) + indhold når åben. */
function GroupBlock({
  label,
  count,
  open,
  onToggle,
  children,
}: {
  label: string
  count: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div
      className="overflow-hidden rounded-[16px] border transition-colors"
      style={{
        borderColor: open ? 'rgba(45,42,36,0.14)' : 'rgba(45,42,36,0.09)',
        background: open ? 'rgba(244,240,229,0.55)' : 'transparent',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <ChevronRight
          size={16}
          strokeWidth={2.25}
          className="shrink-0 transition-transform duration-200"
          style={{
            color: 'rgba(36,48,31,0.42)',
            transform: open ? 'rotate(90deg)' : 'none',
          }}
        />
        <span
          className="flex-1 truncate"
          style={{
            fontFamily: plex,
            fontWeight: 600,
            fontSize: 17,
            letterSpacing: '-0.01em',
            color: '#242019',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            color: 'rgba(36,48,31,0.42)',
          }}
        >
          {count}
        </span>
      </button>
      {open && <div className="px-3.5 pb-4">{children}</div>}
    </div>
  )
}

/** Arts-hero-kort i biblioteket — genbruger den kvadratiske form. */
function ArtHeroCard({ guide, index }: { guide: Guide; index: number }) {
  const { src } = resolvePotalotImage({
    guideId: guide.id,
    speciesSlug: guide.id,
    varietySlug: null,
    role: 'species-hero',
    preferredSrc: guide.primaryImageId,
  })
  return (
    <TopicSquareCard
      index={index}
      href={`/guides/${guide.id}`}
      imageUrl={src}
      navn={guide.pluralName ?? guide.plantName}
    />
  )
}

/** Lille listekort — sortsguider + teknikguider. Thumbnail + navn + chevron. */
function BiblioRow({ guide, teknik = false }: { guide: Guide; teknik?: boolean }) {
  const isVar = guide.guideLevel === 'variety' || !!guide.variety
  const { src } = resolvePotalotImage({
    guideId: guide.id,
    speciesSlug: isVar ? guide.parentGuideId : guide.id,
    varietySlug: isVar ? guide.id : null,
    role: isVar ? 'variety-hero' : 'species-hero',
    preferredSrc: guide.primaryImageId,
  })
  const hasPhoto = !!guide.primaryImageId
  const titel = guide.variety ?? guide.plantName
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

/** "Vis alle …"-genvej under en åben gruppe. */
function VisAlleKnap({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1"
      style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: '#3D5A26' }}
    >
      {children}
      <ArrowRight size={14} strokeWidth={2} />
    </button>
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
