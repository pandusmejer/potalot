'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Guide } from '@/lib/types'
import { Search, ArrowRight, Sprout } from 'lucide-react'
import { GuideCardEditorial } from './guide-card-editorial'
import { SpoergGartneren } from './spoerg-gartneren'
import { KortForklaret } from './kort-forklaret'
import { layeredGuideSampleData } from './layered-guide'
import { guideKindFor } from './trust-badge'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const plex = 'var(--font-plex-condensed), sans-serif'

// Aktiv filterakse = guideLevel (art vs. sort). Mad-kategorier (grøntsag/blomst
// /frugt/urt) hører til en senere datamodel-opgave — de kan ikke udledes af de
// plantnings-baserede primaryCategoryId (fro/loeg/knolde/stauder).
type Filter = 'alle' | 'species' | 'variety'

function levelOf(g: Guide): 'species' | 'variety' {
  return g.guideLevel === 'variety' || g.variety ? 'variety' : 'species'
}

interface Props {
  guides: Guide[]
  aiGuideIds: ReadonlySet<string> | null
  parentPlantNameById: Map<string, string>
  /** Guide-id'er der matcher en sort/art i brugerens frøbank → "I din have". */
  iFroebankIds: ReadonlySet<string>
  bridgeMacroSrc?: string | null
  bridgeMacroAlt?: string | null
  /**
   * Teknik-guides (opbinding, forkultivering, kompost …). BETINGET sektion:
   * rendres kun når der findes mindst én. Tom nu → sektionen vises ikke, og
   * layout/spacing ændres ikke. Klar til vækst uden at belaste forsiden.
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
  const [filter, setFilter] = useState<Filter>('alle')
  const [visAlleMine, setVisAlleMine] = useState(false)

  const q = search.trim().toLowerCase()
  const searching = q.length > 0

  const byId = useMemo(() => new Map(guides.map(g => [g.id, g])), [guides])

  // ── I DIN HAVE ──────────────────────────────────────────────────
  // Match frøbank → guide, og LØFT til artsniveau: har brugeren 5 tomatsorter,
  // skal sektionen vise ÉN tomat-artsguide, ikke fem kort. Dedup på art.
  const mineHave = useMemo(() => {
    const seen = new Set<string>()
    const out: Guide[] = []
    for (const id of iFroebankIds) {
      const g = byId.get(id)
      if (!g) continue
      const isVar = g.guideLevel === 'variety' || !!g.variety
      const speciesId = isVar && g.parentGuideId && byId.has(g.parentGuideId)
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

  const mineShown = visAlleMine ? mineHave : mineHave.slice(0, 3)

  // ── Bibliotek (kompakt grid) ────────────────────────────────────
  const potalot = useMemo(
    () => guides.filter(g => guideKindFor(g, aiGuideIds) === 'potalot'),
    [guides, aiGuideIds],
  )

  const filtered = useMemo(() => {
    return potalot
      .filter(g => filter === 'alle' || levelOf(g) === filter)
      .filter(g => {
        if (!q) return true
        return (
          g.plantName.toLowerCase().includes(q) ||
          (g.variety?.toLowerCase().includes(q) ?? false) ||
          (g.latinName?.toLowerCase().includes(q) ?? false) ||
          g.summary.toLowerCase().includes(q) ||
          g.tags.some(t => t.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => {
        if (a.guideLevel !== b.guideLevel) return a.guideLevel === 'species' ? -1 : 1
        return a.plantName.localeCompare(b.plantName, 'da')
      })
  }, [potalot, filter, q])

  const antal: Record<Filter, number> = {
    alle: potalot.length,
    species: potalot.filter(g => levelOf(g) === 'species').length,
    variety: potalot.filter(g => levelOf(g) === 'variety').length,
  }

  // Pre-wired Spotlight-gruppering: søgeresultater kan opdeles i
  // PLANTEGUIDER + TEKNIKGUIDER. Teknik-gruppen fyldes kun ved søgning og kun
  // hvis der FINDES teknikguides (tom nu → gruppen renderes aldrig). Gruppe-
  // labels vises kun når mere end én gruppe har indhold (ellers redundant med
  // sektionsoverskriften). Klar til vækst uden tomme teknik-overskrifter.
  const teknikResultater = useMemo(() => {
    if (!searching) return []
    return techniqueGuides.filter(
      g =>
        g.plantName.toLowerCase().includes(q) ||
        (g.summary?.toLowerCase().includes(q) ?? false) ||
        g.tags.some(t => t.toLowerCase().includes(q)),
    )
  }, [searching, techniqueGuides, q])

  const resultGrupper = [
    { label: 'Planteguider', guides: filtered },
    { label: 'Teknikguider', guides: teknikResultater },
  ].filter(g => g.guides.length > 0)
  const visGruppeLabels = resultGrupper.length > 1

  const filterChips: { id: Filter; label: string }[] = [
    { id: 'alle', label: 'Alle' },
    { id: 'species', label: 'Artsguides' },
    { id: 'variety', label: 'Sortsguides' },
  ]

  return (
    <div className="space-y-9 sm:space-y-11">
      {/* ── I DIN HAVE ──────────────────────────────────────────
          Personlig forside: store editorial-kort for det brugeren dyrker.
          Skjules helt ved aktiv søgning (så resultater kommer direkte frem)
          og hvis der ingen matches er (ingen tom placeholder). */}
      {!searching && mineHave.length > 0 && (
        <section>
          <Eyebrow>I din have</Eyebrow>
          <Subtitle>Fortsæt med det, du allerede dyrker.</Subtitle>
          <div className="mt-4 space-y-7">
            {mineShown.map((g, i) => (
              <GuideCardEditorial
                key={g.id}
                guide={g}
                kind="potalot"
                offset={i % 3 === 1 ? 'right' : i % 3 === 2 ? 'left' : 'none'}
              />
            ))}
          </div>
          {mineHave.length > 3 && (
            <button
              type="button"
              onClick={() => setVisAlleMine(v => !v)}
              className="group mt-5 inline-flex items-center gap-1.5"
              style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: '#3D5A26' }}
            >
              {visAlleMine ? 'Vis færre' : `Se alle dine planteguider (${mineHave.length})`}
              <ArrowRight
                size={15}
                strokeWidth={2}
                className="transition-transform group-hover:translate-x-0.5"
                style={{ transform: visAlleMine ? 'rotate(-90deg)' : 'none' }}
              />
            </button>
          )}
        </section>
      )}

      {/* ── UDFORSK BIBLIOTEKET ─────────────────────────────────
          Søgning + chips + kompakt grid. Søgning/chips filtrerer HELE
          biblioteket (ikke kun den personlige sektion). */}
      <section id="guides-i-felten" className="scroll-mt-24">
        <Eyebrow>Udforsk planteguider</Eyebrow>
        <Subtitle>Find den plante, du står med.</Subtitle>

        <div className="mt-4">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Søg plante, sort eller problem"
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {filterChips.map(c => {
              const active = filter === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilter(c.id)}
                  style={{
                    fontFamily: sans,
                    fontSize: 11.5,
                    fontWeight: 650,
                    padding: '6px 11px',
                    borderRadius: 999,
                    background: active ? 'rgba(36,48,31,0.88)' : 'rgba(244,240,229,0.55)',
                    color: active ? '#F6F3EB' : 'rgba(36,48,31,0.6)',
                    border: active
                      ? '1px solid rgba(36,48,31,0.88)'
                      : '1px solid rgba(36,48,31,0.10)',
                  }}
                >
                  {c.label}
                  <span style={{ marginLeft: 6, opacity: 0.66 }}>{antal[c.id]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {resultGrupper.length === 0 ? (
          <div className="mt-6">
            <EmptyNote
              text={
                searching
                  ? 'Ingen guide matcher. Prøv et andet ord eller søg bredere.'
                  : 'Når der er kvalitetssikrede guides klar, dukker de op her.'
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {resultGrupper.map(grp => (
              <div key={grp.label}>
                {visGruppeLabels && <GroupLabel>{grp.label}</GroupLabel>}
                <div className="grid grid-cols-2 gap-3">
                  {grp.guides.map(g => (
                    <GuideCardCompact key={g.id} guide={g} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── TEKNIKGUIDES ────────────────────────────────────────
          BETINGET: kun når der findes mindst én. Ingen "kommer snart",
          ingen tom placeholder. Aktiveres når data-laget findes. */}
      {!searching && techniqueGuides.length > 0 && (
        <section>
          <Eyebrow>Teknikguides</Eyebrow>
          <Subtitle>Konkrete opgaver — opbinding, forkultivering, vanding.</Subtitle>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {techniqueGuides.map(g => (
              <GuideCardCompact key={g.id} guide={g} />
            ))}
          </div>
        </section>
      )}

      {/* ── Sekundære lær-mere-moduler (rolige, ingen kort-væg) ── */}
      <div className="space-y-9 pt-2">
        <SpoergGartneren />
        <div className="pb-10">
          <KortForklaret
            title="Chili eller peberfrugt?"
            teaser="To planter fra samme familie, men chili indeholder capsaicin."
            columns={layeredGuideSampleData.fact.columns}
          />
        </div>
      </div>
    </div>
  )
}

// ── Kompakt biblioteks-kort ─────────────────────────────────────
// Samme creme/Plex-sprog som GuideCardEditorial, men lav og fast højde:
// foto → arts/sort-label, navn, evt. latin, pil. INGEN summary (den gør
// kortene høje igen). Guides uden foto får en creme-fallback i SAMME højde.
function GuideCardCompact({ guide }: { guide: Guide }) {
  const isVariety = guide.guideLevel === 'variety' || !!guide.variety
  const { src: hero } = resolvePotalotImage({
    guideId: guide.id,
    speciesSlug: isVariety ? guide.parentGuideId : guide.id,
    varietySlug: isVariety ? guide.id : null,
    role: isVariety ? 'variety-hero' : 'species-hero',
    preferredSrc: guide.primaryImageId,
  })
  const hasPhoto = !!guide.primaryImageId
  const title = guide.variety ?? guide.plantName

  return (
    <Link
      href={`/guides/${guide.id}`}
      className="group block overflow-hidden rounded-[18px] border transition-transform duration-200 ease-out hover:-translate-y-0.5"
      style={{
        background: 'rgba(244,240,229,0.96)',
        borderColor: 'rgba(45,42,36,0.09)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div className="relative h-[104px] overflow-hidden bg-[#EAE6D8]">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sprout size={26} strokeWidth={1.5} style={{ color: 'rgba(86,111,60,0.32)' }} />
          </div>
        )}
        <span
          className="absolute left-2.5 top-2.5 inline-flex items-center rounded-full"
          style={{
            fontFamily: sans,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            background: 'rgba(250,247,237,0.82)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            border: '1px solid rgba(86,111,60,0.14)',
            color: '#4E6138',
          }}
        >
          {isVariety ? 'Sort' : 'Art'}
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <h3
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
            {title}
          </h3>
          {guide.latinName && (
            <p
              className="truncate"
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontSize: 12,
                color: '#2D2A24',
                opacity: 0.5,
                margin: 0,
                marginTop: 1,
              }}
            >
              {guide.latinName}
            </p>
          )}
        </div>
        <ArrowRight
          size={16}
          strokeWidth={1.75}
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: '#7F8F6A' }}
        />
      </div>
    </Link>
  )
}

// ── Delte små byggeklodser ──────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
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

// Gruppe-label til Spotlight-søgeresultater (PLANTEGUIDER / TEKNIKGUIDER).
// Vises kun når mere end én gruppe har resultater — ellers redundant.
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2.5 flex items-center gap-2"
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
      {children}
      <span aria-hidden className="h-px flex-1" style={{ background: 'rgba(45,42,36,0.12)' }} />
    </p>
  )
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: serif,
        fontStyle: 'italic',
        fontSize: 18,
        color: 'rgba(36,48,31,0.56)',
        margin: '4px 0 0',
      }}
    >
      {children}
    </p>
  )
}

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
