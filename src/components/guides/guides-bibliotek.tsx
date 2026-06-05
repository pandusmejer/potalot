'use client'

/**
 * GuidesBibliotek — bibliotek-orchestrator.
 *
 * Layout (per master-spec):
 *   1. Populære emner   ← redaktionelle indgange, ikke filter
 *   2. Potalot-guides   ← primær sektion, mest visuel vægt
 *   3. Søg + filtrer    ← efter inspiration, ikke før
 *   4. Egne guides      ← personlig
 *   5. AI-udkast        ← sekundært, klart markeret
 *
 * Filtre er læserens kvalitetsvalg: Alle guides · Potalot-guides ·
 * Egne guides · AI-udkast. Ingen Master/Mine/Promote/Flag/Clone.
 *
 * Klik på populært emne forfilterer listen (V1 — ingen separat
 * /guides/emne/[slug]-side endnu).
 */

import { useMemo, useState } from 'react'
import type { Guide } from '@/lib/types'
import { Search } from 'lucide-react'
import { GuideCardEditorial } from './guide-card-editorial'
import { TrustBadge, guideKindFor, type GuideKind } from './trust-badge'
import {
  POPULAERE_EMNER,
  type PopulaertEmne,
} from '@/data/guides-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

type Filter = 'alle' | 'potalot' | 'egen' | 'ai-udkast'

interface Props {
  guides: Guide[]
  /** IDs der i demo skal vises som AI-udkast (null for real-data) */
  aiGuideIds: ReadonlySet<string> | null
  /** Map fra guide.id til parent's plante-navn — bruges til lineage-tekst */
  parentPlantNameById: Map<string, string>
  /** Set af guide-IDs der er linket til brugerens frøbank — diskret kort-badge */
  iFroebankIds: ReadonlySet<string>
}

export function GuidesBibliotek({
  guides,
  aiGuideIds,
  parentPlantNameById,
  iFroebankIds,
}: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('alle')
  const [aktivtEmne, setAktivtEmne] = useState<PopulaertEmne | null>(null)

  function vaelgEmne(e: PopulaertEmne) {
    setAktivtEmne(curr => (curr?.matchPlantName === e.matchPlantName ? null : e))
    setSearch('')
    // Scroll til Potalot-sektionen så læseren ser resultatet
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document.getElementById('potalot-sektion')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
  }

  const effectiveSearch = aktivtEmne?.matchPlantName ?? search

  // Beregn kind pr. guide
  const withKind = useMemo(() => {
    return guides.map(g => ({
      guide: g,
      kind: guideKindFor(g, aiGuideIds),
    }))
  }, [guides, aiGuideIds])

  // Filter pr. søgning + kvalitets-filter
  const filtered = useMemo(() => {
    const q = effectiveSearch.trim().toLowerCase()
    return withKind
      .filter(({ kind }) => filter === 'alle' || kind === filter)
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
      .sort((a, b) => a.guide.plantName.localeCompare(b.guide.plantName, 'da'))
  }, [withKind, effectiveSearch, filter])

  const potalot = filtered.filter(x => x.kind === 'potalot')
  const egne = filtered.filter(x => x.kind === 'egen')
  const ai = filtered.filter(x => x.kind === 'ai-udkast')

  return (
    <div className="space-y-12 sm:space-y-14">
      {/* ── 1. POPULÆRE EMNER — redaktionelle indgange ── */}
      <PopulaereEmner
        emner={POPULAERE_EMNER}
        aktivt={aktivtEmne}
        onVaelg={vaelgEmne}
      />

      {/* ── 2. POTALOT-GUIDES — primær sektion ── */}
      <section id="potalot-sektion" className="space-y-4">
        <SektionEyebrow>
          <TrustBadge kind="potalot" size="sm" />
          <span className="ml-1.5">Kvalitetssikret af Potalot</span>
        </SektionEyebrow>
        <SektionTitel>
          {aktivtEmne ? `${aktivtEmne.navn}-guides` : 'Læs en guide'}
        </SektionTitel>
        {potalot.length === 0 ? (
          <EmptyNote text={
            aktivtEmne || effectiveSearch
              ? 'Ingen Potalot-guide matcher endnu — prøv et andet emne eller søg bredere.'
              : 'Når der er kvalitetssikrede guides klar, dukker de op her.'
          } />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {potalot.map(({ guide, kind }) => (
              <GuideCardEditorial
                key={guide.id}
                guide={guide}
                kind={kind}
                iFroebank={iFroebankIds.has(guide.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 3. SØG + FILTRER ── */}
      <SoegBar
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setAktivtEmne(null)
        }}
        filter={filter}
        onFilter={setFilter}
        antal={{
          alle: withKind.length,
          potalot: withKind.filter(x => x.kind === 'potalot').length,
          egen: withKind.filter(x => x.kind === 'egen').length,
          'ai-udkast': withKind.filter(x => x.kind === 'ai-udkast').length,
        }}
      />

      {/* ── 4. EGNE GUIDES — mindre vægt end Potalot ── */}
      {(filter === 'alle' || filter === 'egen') && (
        <section className="space-y-3">
          <SektionEyebrow>
            <TrustBadge kind="egen" size="sm" />
            <span className="ml-1.5">Dine egne erfaringer</span>
          </SektionEyebrow>
          {egne.length === 0 ? (
            <EmptyNote text="Når du tilpasser en Potalot-guide eller skriver din egen, finder du den her." />
          ) : (
            <div className="space-y-3">
              {egne.map(({ guide, kind }) => {
                const lineage = guide.parentGuideId
                  ? parentPlantNameById.get(guide.parentGuideId)
                  : null
                return (
                  <GuideCardEditorial
                    key={guide.id}
                    guide={guide}
                    kind={kind}
                    lineageText={
                      lineage
                        ? `Baseret på Potalot-guiden om ${lineage}`
                        : null
                    }
                    iFroebank={iFroebankIds.has(guide.id)}
                    size="compact"
                  />
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 5. AI-UDKAST — sekundært lag ── */}
      {(filter === 'alle' || filter === 'ai-udkast') && ai.length > 0 && (
        <section className="space-y-3">
          <SektionEyebrow>
            <TrustBadge kind="ai-udkast" size="sm" />
            <span className="ml-1.5">Udkast til inspiration</span>
          </SektionEyebrow>
          <div className="space-y-3">
            {ai.map(({ guide, kind }) => (
              <GuideCardEditorial
                key={guide.id}
                guide={guide}
                kind={kind}
                iFroebank={iFroebankIds.has(guide.id)}
                aiHelpText
                size="compact"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// Sub-komponenter
// ════════════════════════════════════════════════════════════════

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
    <section className="space-y-3">
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.55)',
          margin: 0,
        }}
      >
        Populære emner
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {emner.map(e => {
          const erAktivt = aktivt?.matchPlantName === e.matchPlantName
          return (
            <button
              key={e.matchPlantName}
              type="button"
              onClick={() => onVaelg(e)}
              className="group relative block overflow-hidden text-left transition-all duration-200 ease-out hover:-translate-y-0.5"
              style={{
                borderRadius: 24,
                aspectRatio: '5 / 3',
                boxShadow: erAktivt
                  ? '0 10px 30px rgba(26,34,22,0.18)'
                  : '0 8px 22px rgba(26,34,22,0.10)',
                outline: erAktivt ? '2.5px solid #3D5A26' : 'none',
                outlineOffset: '-2.5px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              />
              {/* Mørk-til-klar gradient i bunden så teksten er læsbar */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(20,14,8,0) 38%, rgba(20,14,8,0.62) 100%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3
                  style={{
                    fontFamily: serif,
                    fontWeight: 500,
                    fontSize: 'clamp(26px, 5.5vw, 34px)',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    color: '#FFFFFF',
                    margin: 0,
                    textShadow: '0 2px 12px rgba(20,14,8,0.6)',
                  }}
                >
                  {e.navn}
                </h3>
                <p
                  className="mt-1.5"
                  style={{
                    fontFamily: sans,
                    fontStyle: 'italic',
                    fontSize: 14,
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.92)',
                    margin: 0,
                    textShadow: '0 1px 8px rgba(20,14,8,0.55)',
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
          className="pt-1"
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 500,
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
          }}
        >
          Viser guides om {aktivt.navn.toLowerCase()}.{' '}
          <button
            type="button"
            onClick={() => onVaelg(aktivt)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#3D5A26',
              fontFamily: sans,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Vis alle
          </button>
        </p>
      )}
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
    { id: 'alle', label: 'Alle guides' },
    { id: 'potalot', label: 'Potalot-guides' },
    { id: 'egen', label: 'Egne guides' },
    { id: 'ai-udkast', label: 'AI-udkast' },
  ]
  return (
    <section className="space-y-3">
      <p
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.55)',
          margin: 0,
        }}
      >
        Søg i biblioteket
      </p>
      <div
        className="relative"
        style={{
          borderRadius: 18,
          background: 'var(--card)',
          border: '1px solid rgba(36,48,31,0.10)',
          boxShadow: '0 4px 14px rgba(26,34,22,0.05)',
          padding: '4px 6px 4px 6px',
        }}
      >
        <Search
          aria-hidden
          className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ width: 16, height: 16, color: 'rgba(36,48,31,0.45)' }}
        />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Søg plante, sort eller latinsk navn"
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 500,
            color: '#24301F',
            padding: '12px 12px 12px 34px',
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {filterChips.map(c => {
          const active = filter === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onFilter(c.id)}
              style={{
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '0.01em',
                padding: '7px 14px',
                borderRadius: 999,
                background: active ? '#24301F' : 'transparent',
                color: active ? '#F6F3EB' : 'rgba(36,48,31,0.65)',
                border: active ? '1px solid #24301F' : '1px solid rgba(36,48,31,0.18)',
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
            >
              {c.label}
              <span
                style={{
                  marginLeft: 8,
                  opacity: 0.75,
                  fontWeight: 500,
                }}
              >
                {antal[c.id]}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function SektionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {children}
    </div>
  )
}

function SektionTitel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: serif,
        fontWeight: 500,
        fontSize: 'clamp(26px, 5vw, 36px)',
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
        color: '#24301F',
        margin: 0,
      }}
    >
      {children}
    </h2>
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
