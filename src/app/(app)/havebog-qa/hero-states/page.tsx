import { HavebogHero } from '@/components/havebog/havebog-hero'
import type { HeroStats, Tidslinje, HeroNarrative } from '@/data/havebog-demo'

/**
 * QA-route: Havebog hero i alle tre bruger-tilstande.
 *
 * Side-om-side sammenligning af hvordan HavebogHero rendrer for:
 *   1. Ny bruger        (0 noter, 8 sorter)         → "Din første sæson"
 *   2. Lidt data        (3 noter denne uge)         → "Juni i haven"
 *   3. År 1+            (har historik fra 2025)     → "Velkommen tilbage til juni"
 *
 * Bevidst ikke i navigation — kun til intern visuel QA.
 * Modsvarer mønstret fra /guides/qa/sort-full /art-full /components.
 *
 * Data er hardcodede mock-states; ingen kald til havebog-action.
 * Det isolerer hero-renderingen fra database-tilstand.
 */
export default function HavebogHeroStatesPage() {
  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      <header className="space-y-2 border-b border-foreground/10 pb-6">
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
          }}
        >
          QA · Havebog hero
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 500,
            fontSize: 'clamp(28px, 5vw, 40px)',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            color: '#24301F',
            margin: 0,
          }}
        >
          Hero i tre bruger-tilstande
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 14,
            color: 'rgba(36,48,31,0.62)',
            margin: 0,
            maxWidth: 520,
          }}
        >
          Samme komponent, tre forskellige bruger-tilstande. Demo-data
          hardcodet pr. tilstand så rendering er stabil uafhængigt af
          server-tid. Ikke i navigation.
        </p>
      </header>

      <StateBlock
        label="State 1 — Ny bruger (år 0, ingen noter)"
        note='Forventet eyebrow: "Din første sæson" · Forventet narrative: 2 linjer · Stats skjult'
        stats={NEW_USER_STATS}
        tidslinje={NEW_USER_TIDSLINJE}
        narrative={NEW_USER_NARRATIVE}
      />

      <StateBlock
        label="State 2 — Lidt data (samme år, har skrevet noter)"
        note='Forventet eyebrow: "Juni i haven" · Forventet narrative: 3 linjer · Stats vist'
        stats={MEDIUM_STATS}
        tidslinje={MEDIUM_TIDSLINJE}
        narrative={MEDIUM_NARRATIVE}
      />

      <StateBlock
        label="State 3 — År 1+ (har historik fra tidligere sæson)"
        note='Forventet eyebrow: "Velkommen tilbage til juni" · Forventet narrative: på-denne-dag + uge-noter'
        stats={EXPERIENCED_STATS}
        tidslinje={EXPERIENCED_TIDSLINJE}
        narrative={EXPERIENCED_NARRATIVE}
      />
    </div>
  )
}

function StateBlock({
  label,
  note,
  stats,
  tidslinje,
  narrative,
}: {
  label: string
  note: string
  stats: HeroStats
  tidslinje: Tidslinje
  narrative: HeroNarrative
}) {
  return (
    <section className="space-y-4">
      <div
        style={{
          padding: '8px 14px',
          background: 'rgba(36,48,31,0.04)',
          borderLeft: '3px solid rgba(36,48,31,0.25)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.75)',
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: 12,
            color: 'rgba(36,48,31,0.55)',
            margin: '4px 0 0 0',
          }}
        >
          {note}
        </p>
      </div>
      <HavebogHero stats={stats} tidslinje={tidslinje} narrative={narrative} />
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Mock-data pr. tilstand
// ─────────────────────────────────────────────────────────

const NEW_USER_STATS: HeroStats = {
  notes: 0,
  varieties: 8,
  harvests: 0,
}
const NEW_USER_TIDSLINJE: Tidslinje = {
  dateText: 'Søndag d. 7. juni',
  milestoneText: null,
  weekNoteCount: 0,
}
const NEW_USER_NARRATIVE: HeroNarrative = {
  seasonLine: 'Din første sæson',
  personalText: [
    'Du dyrker 8 sorter i år.',
    'Om lidt begynder de første minder at samle sig her.',
  ],
  showStats: false,
}

const MEDIUM_STATS: HeroStats = {
  notes: 24,
  varieties: 8,
  harvests: 3,
}
const MEDIUM_TIDSLINJE: Tidslinje = {
  dateText: 'Søndag d. 7. juni',
  milestoneText: '12 dage siden du satte agurkerne ud',
  weekNoteCount: 3,
}
const MEDIUM_NARRATIVE: HeroNarrative = {
  seasonLine: 'Juni i haven',
  personalText: [
    'Agurkerne har stået ude i 12 dage.',
    'Tomaterne begynder at tage fart.',
    'Du har skrevet 3 noter denne uge.',
  ],
  showStats: true,
}

const EXPERIENCED_STATS: HeroStats = {
  notes: 142,
  varieties: 12,
  harvests: 7,
}
const EXPERIENCED_TIDSLINJE: Tidslinje = {
  dateText: 'Søndag d. 7. juni',
  milestoneText: '5 dage siden du høstede første salat',
  weekNoteCount: 4,
}
const EXPERIENCED_NARRATIVE: HeroNarrative = {
  seasonLine: 'Velkommen tilbage til juni',
  personalText: [
    'På denne tid sidste år noterede du om Dahlia Café au Lait.',
    'Du har skrevet 4 noter denne uge.',
  ],
  showStats: true,
}
