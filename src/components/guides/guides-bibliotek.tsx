'use client'

import { useMemo, useState } from 'react'
import type { Guide } from '@/lib/types'
import { Search } from 'lucide-react'
import { GuideCardEditorial } from './guide-card-editorial'
import { SpoergGartneren } from './spoerg-gartneren'
import { layeredGuideSampleData } from './layered-guide'
import { KortForklaret } from './kort-forklaret'
import { Dyrkningsforloeb } from './dyrkningsforloeb'
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

// Biblioteket viser kun det redaktionelle 'potalot'-lag, så en "Potalot"-chip
// ville vise præcis det samme som "Alle" (pynt forklædt som funktion). Den ægte,
// meningsfulde dimension her er guideLevel: art vs. sort.
type Filter = 'alle' | 'species' | 'variety'

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
}

export function GuidesBibliotek({
  guides,
  aiGuideIds,
  iFroebankIds,
  bridgeMacroSrc,
}: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('alle')
  const [aktivtEmne, setAktivtEmne] = useState<PopulaertEmne | null>(null)

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

  const filtered = useMemo(() => {
    const q = effectiveSearch.trim().toLowerCase()
    return withKind
      .filter(({ guide: g }) => filter === 'alle' || levelOf(g) === filter)
      .filter(({ guide: g }) => {
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
        if (a.guide.guideLevel !== b.guide.guideLevel) {
          return a.guide.guideLevel === 'species' ? -1 : 1
        }
        return a.guide.plantName.localeCompare(b.guide.plantName, 'da')
      })
  }, [withKind, effectiveSearch, filter])

  const potalot = filtered.filter(x => x.kind === 'potalot')

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hurtig quick-search øverst: brugeren der VED hvad de leder efter kan
          søge med det samme uden at scrolle forbi hele udstillingen. Kun input,
          ingen chips/tællere/filtre — det fulde bibliotek ligger nederst. Deler
          samme search-state som biblioteks-søgningen. */}
      <QuickSearch value={search} onChange={handleSearch} />

      {/* Layered section: topic papers overlap the hero's atmospheric photo field. */}
      <PopulaereEmner
        emner={POPULAERE_EMNER}
        aktivt={aktivtEmne}
        onVaelg={vaelgEmne}
      />

      {/* Lavmælt hjælpe-modul lige efter "Begynd her" — brugeren er stadig i
          "lær mig noget"-mode. Ikke chatbot, ikke stor sektion. */}
      <SpoergGartneren />

      {/*
       * Dyrkningsforløb-bro: kompakt feltguide-sektion der forklarer at Guides
       * følger planten gennem sæsonen (sortvalg → høst) og knytter inspirations-
       * delen til "Guides i felten"-kortene. Atmosfærisk bladfoto som baggrund.
       * Skjules hvis ingen makro kunne resolves (ingen død blok uden billede).
       */}
      {bridgeMacroSrc && (
        // Ren tekst-bro (bladfoto fjernet). -mt strammer fugen til "Spørg
        // gartneren", så zonen hænger sammen.
        <div className="-mt-[11px]">
          <Dyrkningsforloeb />
        </div>
      )}

      {/* Layered section: one trust signal, then mixed guide objects instead of repeated badges. */}
      {/* Guides i felten = fortsættelsen af Dyrkningsforløb-introen, ikke en ny
          tung sektion. -mt trækker den tættere på intro-kortet. POTALOT-GUIDE-
          pillen ligger på sin EGEN linje (brækker ikke) over eyebrow-teksten;
          den præcise type (arts/sort) ligger som metadata på selve kortene. */}
      {/* Ingen separat "Guides i felten"-overskrift: introen ovenfor forklarer
          guidesystemet og leder direkte ned i kortene. Én intro → kort, ikke to
          sektioner. id bevaret som scroll-anker fra "Begynd her". */}
      <section id="guides-i-felten" className="relative -mt-1 pt-0 scroll-mt-24">
        <AtmosphericGuideField />
        <div className="relative z-10">
          {potalot.length === 0 ? (
            <EmptyNote text={
              aktivtEmne || effectiveSearch
                ? 'Ingen guide matcher endnu. Prøv et andet emne eller søg bredere.'
                : 'Når der er kvalitetssikrede guides klar, dukker de op her.'
            } />
          ) : (
            <div className="space-y-7">
              {potalot.map(({ guide, kind }, index) => (
                <GuideCardEditorial
                  key={guide.id}
                  guide={guide}
                  kind={kind}
                  iFroebank={iFroebankIds.has(guide.id)}
                  offset={index % 3 === 1 ? 'right' : index % 3 === 2 ? 'left' : 'none'}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Det praktiske værktøj kommer FØRST efter guidekortene: brugeren er på
          Guides for at finde en konkret plante. Søgning + filtre, rolig felt-
          index-stil. */}
      <SoegBar
        search={search}
        onSearch={handleSearch}
        filter={filter}
        onFilter={setFilter}
        antal={{
          // Tællere over det viste 'potalot'-lag, ikke alle kinds — ellers
          // ville tallene love guides der aldrig vises i biblioteket.
          alle: withKind.filter(x => x.kind === 'potalot').length,
          species: withKind.filter(
            x => x.kind === 'potalot' && levelOf(x.guide) === 'species',
          ).length,
          variety: withKind.filter(
            x => x.kind === 'potalot' && levelOf(x.guide) === 'variety',
          ).length,
        }}
      />

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
        {emner.map((e, index) => {
          const erAktivt = aktivt?.matchPlantName === e.matchPlantName
          return (
            <button
              key={e.matchPlantName}
              type="button"
              onClick={() => onVaelg(e)}
              className={[
                'group relative isolate block overflow-hidden text-left transition-transform duration-200 ease-out hover:-translate-y-0.5',
                index % 2 === 0 ? 'translate-y-0' : 'translate-y-5',
              ].join(' ')}
              style={{
                borderRadius: index % 2 === 0 ? 24 : 18,
                aspectRatio: '4 / 3.35',
                border: erAktivt
                  ? '1.5px solid rgba(61,90,38,0.75)'
                  : '1px solid rgba(45,42,36,0.10)',
                background: '#F4F0E5',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.imageUrl}
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
                    fontSize: 'clamp(24px, 7.4vw, 33px)',
                    lineHeight: 0.94,
                    color: '#FFFFFF',
                    margin: 0,
                    letterSpacing: '-0.01em',
                    textShadow: '0 2px 12px rgba(20,14,8,0.50)',
                  }}
                >
                  {e.navn}
                </h3>
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
                  {e.byline}
                </p>
              </div>
            </button>
          )
        })}
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

function AtmosphericGuideField() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-4 h-72 w-72"
        style={{
          backgroundImage: 'url(/images/makro/agurk/blad.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
          mixBlendMode: 'multiply',
          transform: 'rotate(-7deg)',
          maskImage:
            'radial-gradient(ellipse 70% 64% at 50% 50%, black 20%, transparent 82%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 64% at 50% 50%, black 20%, transparent 82%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-[28rem] h-80 w-80"
        style={{
          backgroundImage: 'url(/images/makro/tomat-san-marzano/dug.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.09,
          mixBlendMode: 'multiply',
          transform: 'rotate(5deg)',
          maskImage:
            'radial-gradient(ellipse 66% 70% at 50% 50%, black 20%, transparent 84%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 66% 70% at 50% 50%, black 20%, transparent 84%)',
        }}
      />
    </>
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
    <section className="relative -mt-2">
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(36,48,31,0.62)',
          margin: '0 0 8px',
        }}
      >
        Find hurtigt en guide
      </p>
      <SearchField
        value={value}
        onChange={onChange}
        placeholder="Søg plante, sort eller problem"
      />
    </section>
  )
}

function SoegBar({
  search,
  onSearch,
  filter,
  onFilter,
  antal,
}: {
  search: string
  onSearch: (v: string) => void
  filter: Filter
  onFilter: (f: Filter) => void
  antal: Record<Filter, number>
}) {
  const filterChips: { id: Filter; label: string }[] = [
    { id: 'alle', label: 'Alle' },
    { id: 'species', label: 'Artsguides' },
    { id: 'variety', label: 'Sortsguides' },
  ]
  return (
    <section className="relative pt-6">
      <div
        aria-hidden
        className="absolute left-10 right-10 top-0 h-px bg-[#2D2A24]/10"
      />
      {/* Nederste søgning = det fulde bibliotek: egen sektionstitel + filtrering.
          Adskiller sig fra quick-searchen øverst (der kun er label + input). */}
      <p
        className="text-center"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.55)',
          margin: '0 0 6px',
        }}
      >
        Alle guides
      </p>
      <p
        className="mb-3 text-center"
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontSize: 18,
          color: 'rgba(36,48,31,0.56)',
          marginTop: 0,
        }}
      >
        Find den plante, du står med.
      </p>
      <SearchField
        value={search}
        onChange={onSearch}
        placeholder="Søg plante, sort eller problem"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {filterChips.map(c => {
          const active = filter === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onFilter(c.id)}
              style={{
                fontFamily: sans,
                fontSize: 11.5,
                fontWeight: 650,
                padding: '6px 10px',
                borderRadius: 999,
                background: active ? 'rgba(36,48,31,0.88)' : 'rgba(244,240,229,0.35)',
                color: active ? '#F6F3EB' : 'rgba(36,48,31,0.55)',
                border: active ? '1px solid rgba(36,48,31,0.88)' : '1px solid rgba(36,48,31,0.10)',
              }}
            >
              {c.label}
              <span style={{ marginLeft: 6, opacity: 0.66 }}>
                {antal[c.id]}
              </span>
            </button>
          )
        })}
      </div>
    </section>
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
