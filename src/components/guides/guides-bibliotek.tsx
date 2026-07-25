'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { Guide } from '@/lib/types'
import { Search, ArrowRight, ChevronRight, Leaf } from 'lucide-react'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { getRecentlyRead, type RecentRead } from '@/lib/guides/recently-read'
import { normalizeGuideKey } from '@/lib/guides/normalize-key'
import { artsByCategory, type LibraryArt } from '@/lib/guides/library-arts'
import {
  LIBRARY_CATEGORY_ORDER,
  LIBRARY_CATEGORY_LABEL,
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
  /**
   * Brugerens frøbank grupperet: normalizeGuideKey(plantenavn) → distinkte
   * sortsnavne. Vi matcher PÅ NAVN, ikke guide_id (frøbank-varer peger på
   * brugerens PRIVATE guide, hvis uuid aldrig findes i IMPORTED_GUIDES). Nøglen
   * tænder art-kortet i "I DIN HAVE"; værdierne bliver til sort-chips på kortet
   * (findes en kurateret sortsguide → chip er et link, ellers ren tekst).
   */
  iFroebankVarieties: ReadonlyMap<string, string[]>
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
  iFroebankVarieties,
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
  // Art-opslag på NAVNE-nøgle (ikke id): guide.id er en translittereret slug
  // ("soed-kartoffel"), mens normalizeGuideKey beholder æøå/mellemrum ("sød
  // kartoffel"). Frøbankens navn normaliseres med samme nøgle → sikkert match.
  const bySpeciesKey = useMemo(() => {
    const m = new Map<string, Guide>()
    for (const g of guides) {
      if (g.guideLevel !== 'species') continue // ekskl. variety + technique (plantName kan være null)
      if (guideKindFor(g, aiGuideIds) !== 'potalot') continue
      m.set(normalizeGuideKey(g.plantName), g)
    }
    return m
  }, [guides, aiGuideIds])

  const mineHave = useMemo(() => {
    const seen = new Set<string>()
    const out: Guide[] = []
    for (const key of iFroebankVarieties.keys()) {
      const g = bySpeciesKey.get(key)
      if (!g || seen.has(g.id)) continue
      seen.add(g.id)
      out.push(g)
    }
    return out.sort((a, b) => a.plantName.localeCompare(b.plantName, 'da'))
  }, [iFroebankVarieties, bySpeciesKey])

  // Sort-opslag til chips: `${artsnøgle}::${sortsnøgle}` → kurateret sortsguide.
  // Bruges til at afgøre om en frøbank-sort har en RIGTIG Potalot-sortsguide
  // (→ chip bliver et link) eller kun findes som brugerens AI-guide (→ ren
  // tekst). Regel: Potalot-indhold først, AI-indhold linkes ALDRIG herfra.
  const varietyGuideByKey = useMemo(() => {
    const m = new Map<string, Guide>()
    for (const g of guides) {
      if (levelOf(g) !== 'variety' || !g.variety) continue
      if (guideKindFor(g, aiGuideIds) !== 'potalot') continue
      const parent = g.parentGuideId ? byId.get(g.parentGuideId) : undefined
      const speciesName = parent?.plantName ?? g.plantName
      m.set(`${normalizeGuideKey(speciesName)}::${normalizeGuideKey(g.variety)}`, g)
    }
    return m
  }, [guides, byId, aiGuideIds])

  // I DIN HAVE-kort: art + brugerens KONKRETE sorter (chips). Kortet dedup'er på
  // art (ét Tomat-kort, ikke 6), men viser sorterne så "det du dyrker" faktisk
  // er det du dyrker — ikke bare abstraktionen ovenover.
  const mineHaveCards = useMemo(
    () =>
      mineHave.map(g => {
        const key = normalizeGuideKey(g.plantName)
        const varieties = (iFroebankVarieties.get(key) ?? []).map(name => {
          const vg = varietyGuideByKey.get(`${key}::${normalizeGuideKey(name)}`)
          return { name, href: vg ? `/guides/${vg.id}` : null }
        })
        return { guide: g, varieties }
      }),
    [mineHave, iFroebankVarieties, varietyGuideByKey],
  )

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

      {/* Top-sektion: hvis brugeren HAR noget i frøbank/planter der matcher en
          guide → personlig "I DIN HAVE" med store hero-kort. Ellers falder vi
          tilbage til det redaktionelle "Et godt sted at starte". */}
      {mineHaveCards.length > 0 ? (
        <IDinHave
          cards={mineHaveCards}
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
        />
      </section>

      {/* GODT AT VIDE — ét redaktionelt "Kort forklaret"-kort. Rykket op fra
          bunden og navngivet, så det er redaktionelt indhold, ikke en
          efterladenskab efter biblioteket. */}
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

/** Én sort i frøbanken: navn + (evt.) link til den kuraterede sortsguide. */
type HaveVariety = { name: string; href: string | null }
type HaveCard = { guide: Guide; varieties: HaveVariety[] }

/**
 * I DIN HAVE — personlig top-sektion. Kort på ARTSNIVEAU (dedup: ét Tomat-kort,
 * ikke 6), MEN kortet viser brugerens konkrete sorter som chips, så "det du
 * dyrker" faktisk er det du dyrker — ikke bare abstraktionen ovenover.
 *
 * Klik-mål: kortets hovedflade (foto + navn) → artsguiden. En sort-chip →
 * sortsguiden HVIS Potalot har en kurateret sådan (grøn chip = link). Har vi
 * den ikke endnu (kun brugerens AI-guide), er chippen ren tekst — vi linker
 * ALDRIG til AI-indhold herfra. Regel: Potalot-indhold først, AI som supplement.
 */
function IDinHave({
  cards,
  visAlle,
  onToggle,
}: {
  cards: HaveCard[]
  visAlle: boolean
  onToggle: () => void
}) {
  const shown = visAlle ? cards : cards.slice(0, 4)
  return (
    <section className="relative -mt-2">
      <div className="relative z-10 mb-3.5">
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
      <div className="space-y-2.5">
        {shown.map(card => (
          <HaveArtCard key={card.guide.id} card={card} />
        ))}
      </div>
      {cards.length > 4 && (
        <button
          type="button"
          onClick={onToggle}
          className="group mt-5 inline-flex items-center gap-1.5"
          style={{
            fontFamily: sans,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#3D5A26',
          }}
        >
          {visAlle ? 'Vis færre' : `Se alle ${cards.length} fra din have`}
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
 * Ét art-kort i "I DIN HAVE". KOMPAKT: foto til venstre, navn + antal + sort-chips
 * i ÉN tekstkolonne ved siden af (ikke en separat bund-etage → ingen tomme kort
 * for arter med få sorter). Højden følger indholdet.
 *
 * Klik-model uden nested links: et "stretched" link dækker hele kortet (→
 * artsguiden) og ligger BAGVED indholdet; indholdet har pointer-events: none, så
 * klik falder ned til art-linket — UNDTAGEN de kuraterede sort-chips, der får
 * pointer-events auto og fanger deres eget klik (→ sortsguiden). Grøn chip =
 * kurateret sortsguide; dæmpet chip = kun din egen (AI) sort, ingen link.
 */
function HaveArtCard({ card }: { card: HaveCard }) {
  const g = card.guide
  const { src } = resolvePotalotImage({
    guideId: g.id,
    speciesSlug: g.id,
    varietySlug: null,
    role: 'species-hero',
    preferredSrc: g.primaryImageId,
  })
  const n = card.varieties.length
  return (
    <div
      className="group relative overflow-hidden"
      style={{
        background: 'rgba(244,240,229,0.96)',
        border: '1px solid rgba(45,42,36,0.10)',
        borderRadius: 18,
      }}
    >
      {/* Stretched link → artsguiden (bag indholdet) */}
      <Link
        href={`/guides/${g.id}`}
        aria-label={g.plantName}
        className="absolute inset-0 z-0"
      />
      <div
        className="relative z-10 flex items-center gap-3.5 p-2.5"
        style={{ pointerEvents: 'none' }}
      >
        <span className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[13px] bg-[#EAE6D8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />
        </span>
        <div className="min-w-0 flex-1 pr-1">
          <span
            className="block truncate"
            style={{
              fontFamily: plex,
              fontWeight: 600,
              fontSize: 20,
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              color: '#242019',
            }}
          >
            {g.plantName}
          </span>
          {n > 0 && (
            <>
              <span
                className="mt-0.5 block"
                style={{
                  fontFamily: sans,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'rgba(36,48,31,0.5)',
                }}
              >
                {n} {n === 1 ? 'sort' : 'sorter'} i din have
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {card.varieties.map(v =>
                  v.href ? (
                    <Link
                      key={v.name}
                      href={v.href}
                      className="no-underline transition-colors hover:bg-[rgba(86,111,60,0.18)]"
                      style={{
                        pointerEvents: 'auto',
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#3D5A26',
                        background: 'rgba(86,111,60,0.11)',
                        border: '1px solid rgba(86,111,60,0.24)',
                        borderRadius: 999,
                        padding: '3px 10px',
                        lineHeight: 1.3,
                      }}
                    >
                      {v.name}
                    </Link>
                  ) : (
                    <span
                      key={v.name}
                      style={{
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'rgba(36,48,31,0.55)',
                        background: 'rgba(45,42,36,0.05)',
                        border: '1px solid rgba(45,42,36,0.08)',
                        borderRadius: 999,
                        padding: '3px 10px',
                        lineHeight: 1.3,
                      }}
                    >
                      {v.name}
                    </span>
                  ),
                )}
              </div>
            </>
          )}
        </div>
        <ChevronRight
          size={18}
          strokeWidth={2}
          className="shrink-0 self-center transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: 'rgba(36,48,31,0.3)' }}
        />
      </div>
    </div>
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
        <div className="mt-5 space-y-3">
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
 * Kompakt kategori-kort (2-kol grid) → kategorisiden. Navn + antal arter + en
 * lille smagsprøve. Erstatter de gamle fuldbredde-accordions.
 */
function KategoriKort({ category, arts }: { category: LibraryCategory; arts: LibraryArt[] }) {
  const n = arts.length
  const teaser = arts.slice(0, 3).map(a => a.plantName).join(', ')
  return (
    <Link
      href={`/guides/kategori/${category}`}
      className="group relative flex flex-col justify-between overflow-hidden no-underline"
      style={{
        background: 'rgba(244,240,229,0.96)',
        border: '1px solid rgba(45,42,36,0.10)',
        borderRadius: 16,
        padding: '13px 14px',
        minHeight: 92,
        color: 'inherit',
      }}
    >
      <div>
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
        </span>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-1.5">
        <span
          className="min-w-0 flex-1 truncate"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, color: 'rgba(36,48,31,0.42)' }}
        >
          {teaser}
        </span>
        <ChevronRight
          size={16}
          strokeWidth={2}
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: 'rgba(36,48,31,0.3)' }}
        />
      </div>
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
      className="group flex items-center gap-3.5 overflow-hidden no-underline"
      style={{
        background: 'linear-gradient(180deg, rgba(86,111,60,0.10) 0%, rgba(86,111,60,0.05) 100%)',
        border: '1px solid rgba(86,111,60,0.22)',
        borderRadius: 18,
        padding: '14px 15px',
        color: 'inherit',
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(86,111,60,0.14)' }}
      >
        <Leaf size={22} strokeWidth={1.7} style={{ color: '#4B6636' }} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block"
          style={{ fontFamily: plex, fontWeight: 600, fontSize: 19, lineHeight: 1.1, color: '#233019' }}
        >
          Få hjælp til arbejdet
        </span>
        <span
          className="mt-0.5 block"
          style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: 'rgba(36,48,31,0.55)' }}
        >
          Såning, opbinding, beskæring, høst … · {count} teknikguider
        </span>
      </span>
      <ChevronRight
        size={18}
        strokeWidth={2}
        className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: 'rgba(75,102,54,0.5)' }}
      />
    </Link>
  )
}

/** Slank art-række til kategorisidens A–Å-liste (serialiserer ikke fulde guides). */
export interface ArtRow {
  plantName: string
  guideId: string
  sortCount: number
}

/**
 * Art-node i "Alle arter"-listen (bruges på kategorisiden). ÉN destination: klik
 * åbner altid artens artsguide. Sorter/teknik bor inde på artsguiden —
 * biblioteket FINDER kun arten. Viser sort-tal som hint.
 */
export function ArtNode({ plantName, guideId, sortCount: n }: ArtRow) {
  return (
    <Link
      href={`/guides/${guideId}`}
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
