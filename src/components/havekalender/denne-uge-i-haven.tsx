'use client'

import Link from 'next/link'
import { ArrowRight, Sprout, Wheat, Droplets, Leaf, Scissors } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import type { WeekSuggestion } from '@/lib/denne-uge'
import type { GardenAlert } from '@/actions/weather'

const sans = 'var(--font-manrope)'

interface Props {
  suggestions: WeekSuggestion[]
  /** Bevares i signaturen (kalender-client sender den), men bruges ikke længere:
   *  vejret hører til vejr-pools, ikke til ugens rytme-fortolkning. */
  alerts?: GardenAlert[]
}

/**
 * "Denne uge i haven" — ugentlig HAVEFORTOLKNING, ikke en opgave-carousel.
 *
 * Ny rolle (Anna 18/6): de tre andre lag har hver sit job —
 *   Dagens fokus      = den ene vigtige handling NU
 *   Denne uge i haven = ugens rytme/temaer (HER)
 *   Det kan du gøre   = månedens bibliotek af muligheder
 *
 * Derfor ikke task cards: sektionen opsummerer ugens vigtigste TEMAER
 * (Plej / Så / Høst …) som rolige editorial-linjer. Indholdet afledes af
 * ugens data (computeWeekSuggestions); er den tom (fx demo uden egne planter)
 * bruges en månedsspecifik fallback, så fortolkningen altid har noget at sige.
 */
export function DenneUgeIHaven({ suggestions }: Props) {
  const month = new Date().getMonth() + 1
  const themes = buildThemes(suggestions, month)

  return (
    <section
      style={{
        padding: '16px 18px',
        borderRadius: 24,
        background: 'rgba(246,243,235,0.94)',
        border: '1px solid rgba(36,48,31,0.07)',
        boxShadow: '0 6px 18px rgba(36,48,31,0.05)',
      }}
    >
      <header className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <h2 style={{ fontFamily: sans, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#24301F', margin: 0 }}>
          Denne uge i haven
        </h2>
        <Link
          href="#mine-opgaver"
          className="inline-flex items-center"
          style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: '#24301F', gap: 6, textDecoration: 'none' }}
        >
          Ugens opgaver
          <ArrowRight width={16} height={16} strokeWidth={1.75} />
        </Link>
      </header>

      {themes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: '#6B7360', margin: '0 0 16px' }}>
            {introLine(themes.length)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {themes.map(t => (
              <div key={t.kind}>
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: sans, fontSize: 11.5, fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: t.color,
                    background: t.chipBg,
                    padding: '3px 11px',
                    borderRadius: 999,
                    marginBottom: 5,
                  }}
                >
                  {t.label}
                </span>
                <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 450, lineHeight: 1.45, color: '#3F4638', margin: 0 }}>
                  {t.line}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function EmptyState() {
  return (
    <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: '#56604D', margin: '6px 0 0' }}>
      Rolig uge i haven — gå en langsom runde og se hvad der har ændret sig.
    </p>
  )
}

// ────────────────────────────────────────────────────────────────
// Tema-afledning
// ────────────────────────────────────────────────────────────────

type Kind = WeekSuggestion['kind']

interface Theme {
  kind: Kind
  label: string
  line: string
  color: string
  chipBg: string
}

const THEME_LABEL: Record<Kind, string> = {
  tend: 'Plej', sow: 'Så', plant_out: 'Plant ud', harvest: 'Høst',
}

/** Prioritet ved uafgjort antal — så ugen læses som en rolig rytme. */
const THEME_ORDER: Kind[] = ['harvest', 'tend', 'plant_out', 'sow']

/**
 * Byg op til 3 uge-temaer fra ugens data. Grupperer planter pr. handlingstype,
 * vælger de temaer der "fylder mest" (flest planter), og formulerer hver som
 * én rolig sætning — ikke som en opgave.
 */
function buildThemes(suggestions: WeekSuggestion[], month: number): Theme[] {
  const slots: PlantSlot[] = suggestions.length
    ? suggestions.map(s => ({ kind: s.kind, ...extractPlantAndVariety(s.title), icon: Sprout }))
    : (SEASONAL_FALLBACK[month] ?? SEASONAL_FALLBACK[6])

  const byKind = new Map<Kind, string[]>()
  for (const s of slots) {
    if (!s.plant) continue
    const arr = byKind.get(s.kind) ?? []
    if (!arr.includes(s.plant)) arr.push(s.plant)
    byKind.set(s.kind, arr)
  }

  const kinds = [...byKind.keys()]
    .sort((a, b) => (byKind.get(b)!.length - byKind.get(a)!.length) || (THEME_ORDER.indexOf(a) - THEME_ORDER.indexOf(b)))
    .slice(0, 3)

  return kinds.map(kind => {
    const plants = byKind.get(kind)!.slice(0, 2)
    return {
      kind,
      label: THEME_LABEL[kind],
      line: themeLine(kind, plants),
      ...themeTone(kind),
    }
  })
}

function introLine(n: number): string {
  const word = n === 1 ? 'Én' : n === 2 ? 'To' : 'Tre'
  return `${word} ting fylder mest de næste dage.`
}

/** "Tomat" · "Tomat og Agurk" — definit/menneskelig nok til en rolig linje. */
function joinPlants(plants: string[]): string {
  if (plants.length === 0) return 'Haven'
  if (plants.length === 1) return plants[0]
  return `${plants[0]} og ${plants[1]}`
}

/** Ugens tema som én rolig sætning (ikke en opgave). */
function themeLine(kind: Kind, plants: string[]): string {
  const p = joinPlants(plants)
  switch (kind) {
    case 'tend': return `${p} skal passes lidt tættere — bind op og hold jorden jævnt fugtig.`
    case 'sow': return `${p} kan stadig nås, mens jorden er varm.`
    case 'plant_out': return `${p} er klar til at komme i jorden.`
    case 'harvest': return `Pluk ${p.toLowerCase()} løbende, før bladene mister sprødhed.`
  }
}

/** Dæmpede tone-i-tone chip-farver pr. tema. */
function themeTone(kind: Kind): { color: string; chipBg: string } {
  switch (kind) {
    case 'tend': return { color: '#4C6038', chipBg: 'rgba(80,104,52,0.12)' }
    case 'sow': return { color: '#5A6F44', chipBg: 'rgba(90,111,68,0.12)' }
    case 'plant_out': return { color: '#5A6F44', chipBg: 'rgba(90,111,68,0.12)' }
    case 'harvest': return { color: '#9A6A1E', chipBg: 'rgba(168,124,59,0.15)' }
  }
}

/**
 * Splitter en suggestion-titel ("Så Agurk — Marketmore", "Tilse Tomat Sweetie")
 * op i plantenavn (+ evt. sort). Fjerner ledende verbum og trailing " ud".
 */
function extractPlantAndVariety(title: string): { plant: string; variety: string } {
  const afterVerb = title.replace(/^\S+\s+/, '').replace(/\s+ud$/, '').trim()
  const parts = afterVerb.split(/\s+—\s+/)
  return { plant: parts[0]?.trim() ?? '', variety: parts[1]?.trim() ?? '' }
}

interface PlantSlot {
  kind: Kind
  icon: ComponentType<SVGProps<SVGSVGElement>>
  plant: string
  variety: string
}

/**
 * Månedsspecifik fallback: typiske danske køkkenhave-temaer pr. måned. Bruges
 * når ugens data er tom (fx demo uden egne planter), så fortolkningen altid
 * kan sige noget. Plant + kind er det relevante her (sort/ikon arves fra den
 * gamle struktur og er uskadelige).
 */
const SEASONAL_FALLBACK: Record<number, PlantSlot[]> = {
  1: [
    { kind: 'sow', icon: Sprout, plant: 'Chili', variety: 'Habanero' },
    { kind: 'sow', icon: Sprout, plant: 'Aubergine', variety: 'Black Beauty' },
    { kind: 'tend', icon: Scissors, plant: 'Æble', variety: 'Ingrid Marie' },
    { kind: 'tend', icon: Scissors, plant: 'Ribs', variety: 'Rødt Hollandsk' },
  ],
  2: [
    { kind: 'sow', icon: Sprout, plant: 'Tomat', variety: 'Sungold' },
    { kind: 'sow', icon: Sprout, plant: 'Peberfrugt', variety: 'Padron' },
    { kind: 'sow', icon: Sprout, plant: 'Porre', variety: 'Bandit' },
    { kind: 'tend', icon: Scissors, plant: 'Solbær', variety: 'Titania' },
  ],
  3: [
    { kind: 'sow', icon: Sprout, plant: 'Salat', variety: 'Frisée' },
    { kind: 'sow', icon: Sprout, plant: 'Spinat', variety: 'Matador' },
    { kind: 'sow', icon: Sprout, plant: 'Ærter', variety: 'Sukkerært' },
    { kind: 'sow', icon: Sprout, plant: 'Radise', variety: 'French Breakfast' },
  ],
  4: [
    { kind: 'sow', icon: Sprout, plant: 'Gulerod', variety: 'Nantes' },
    { kind: 'plant_out', icon: Sprout, plant: 'Løg', variety: 'Sturon' },
    { kind: 'sow', icon: Sprout, plant: 'Radise', variety: 'French Breakfast' },
    { kind: 'sow', icon: Sprout, plant: 'Bønne', variety: 'Blauhilde' },
  ],
  5: [
    { kind: 'plant_out', icon: Sprout, plant: 'Tomat', variety: 'Cherry Sweetie' },
    { kind: 'sow', icon: Sprout, plant: 'Squash', variety: 'Patty Pan' },
    { kind: 'plant_out', icon: Sprout, plant: 'Agurk', variety: 'Marketmore' },
    { kind: 'sow', icon: Sprout, plant: 'Salat', variety: 'Lollo Rossa' },
  ],
  6: [
    { kind: 'tend', icon: Scissors, plant: 'Tomat', variety: 'San Marzano' },
    { kind: 'tend', icon: Droplets, plant: 'Agurk', variety: 'Telegraph' },
    { kind: 'sow', icon: Sprout, plant: 'Grønkål', variety: 'Nero di Toscana' },
    { kind: 'sow', icon: Sprout, plant: 'Persille', variety: 'Mosskrøllet' },
    { kind: 'harvest', icon: Wheat, plant: 'Salat', variety: 'Romana' },
  ],
  7: [
    { kind: 'harvest', icon: Wheat, plant: 'Ærter', variety: 'Sukkerært' },
    { kind: 'harvest', icon: Wheat, plant: 'Squash', variety: 'Gold Rush' },
    { kind: 'tend', icon: Scissors, plant: 'Tomat', variety: 'Black Krim' },
    { kind: 'sow', icon: Sprout, plant: 'Pak choi', variety: 'Joi Choi' },
  ],
  8: [
    { kind: 'harvest', icon: Wheat, plant: 'Tomat', variety: 'Sungold' },
    { kind: 'harvest', icon: Wheat, plant: 'Bønne', variety: 'Helda' },
    { kind: 'tend', icon: Droplets, plant: 'Agurk', variety: 'Marketmore' },
    { kind: 'sow', icon: Sprout, plant: 'Spinat', variety: 'Giant Winter' },
  ],
  9: [
    { kind: 'harvest', icon: Wheat, plant: 'Æble', variety: 'Ingrid Marie' },
    { kind: 'harvest', icon: Wheat, plant: 'Græskar', variety: 'Hokkaido' },
    { kind: 'plant_out', icon: Sprout, plant: 'Hvidløg', variety: 'Therados' },
    { kind: 'tend', icon: Leaf, plant: 'Grønkål', variety: 'Nero di Toscana' },
  ],
  10: [
    { kind: 'harvest', icon: Wheat, plant: 'Pastinak', variety: 'Halblange' },
    { kind: 'tend', icon: Leaf, plant: 'Grønkål', variety: 'Russisk' },
    { kind: 'plant_out', icon: Sprout, plant: 'Hvidløg', variety: 'Messidor' },
    { kind: 'harvest', icon: Wheat, plant: 'Pære', variety: 'Conference' },
  ],
  11: [
    { kind: 'tend', icon: Scissors, plant: 'Frugttræ', variety: 'Cox Orange' },
    { kind: 'tend', icon: Scissors, plant: 'Solbær', variety: 'Titania' },
    { kind: 'tend', icon: Leaf, plant: 'Grønkål', variety: 'Russisk' },
  ],
  12: [
    { kind: 'tend', icon: Scissors, plant: 'Æble', variety: 'Ingrid Marie' },
    { kind: 'sow', icon: Sprout, plant: 'Chili', variety: 'Habanero' },
    { kind: 'sow', icon: Sprout, plant: 'Aubergine', variety: 'Black Beauty' },
  ],
}
