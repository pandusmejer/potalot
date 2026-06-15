'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sprout, Wheat, CloudRain, Sun, Snowflake, Droplets, Leaf, Scissors } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import type { WeekSuggestion } from '@/lib/denne-uge'
import type { GardenAlert } from '@/actions/weather'

const sans = 'var(--font-manrope)'

interface Props {
  suggestions: WeekSuggestion[]
  alerts: GardenAlert[]
}

interface DayCard {
  /** "I dag" eller "Man 13." osv. */
  dateLabel: string
  isToday: boolean
  /** Botanisk eller vejr-ikon (lille, sekundær — handlingen er primær) */
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  iconColor: string
  /** Handlings-verbum i sætnings-versalering — "Udplant", "Så", "Høst" */
  action: string
  /** Linje 2 — plantenavn / objekt / hvornår */
  primary: string
  /** Linje 3 — sort / kort kontekst */
  secondary: string
  /** Vejr-relateret kort får lille top-markør i ochre */
  isWeatherWarning?: boolean
}

const MAANED_KORT = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
const DAG_KORT = ['SØN','MAN','TIR','ONS','TOR','FRE','LØR']

/**
 * "Denne uge i haven" — varmt papir-card med horisontal scroll af
 * day cards. Det er kalenderens vigtigste blok: ugerytme, ikke
 * task-manager. Hver day card er en lille observation om dagen,
 * ikke et completion-tracker.
 *
 * Indholdet genereres fra brugerens frøbank, aktive planter, vejr
 * og generelle sæson-gøremål — prioriteret efter:
 *   1. presserende vejrrelaterede ting
 *   2. brugerspecifikke plante-opgaver
 *   3. aktuelle så-/plantnings-vinduer
 *   4. generelle sæson-opgaver
 *   5. sanselig prompt (max én pr uge)
 */
export function DenneUgeIHaven({ suggestions, alerts }: Props) {
  const days = buildWeekDays(suggestions, alerts)

  return (
    <section
      style={{
        // Venstre kant flugter med Mine opgaver nedenfor. Højre kant
        // er trukket 34px (~9mm) indad så Denne uge ender lidt før
        // Mine opgaver på højre side — det skaber en blød asymmetri
        // og lader scroll-pilene få plads til at indikere flere kort.
        marginRight: 34,
        padding: '18px 16px',
        borderRadius: 24,
        background: 'rgba(246,243,235,0.94)',
        border: '1px solid rgba(36,48,31,0.08)',
        boxShadow: '0 8px 24px rgba(36,48,31,0.06)',
      }}
    >
      {/* Header — titel + se-hele-ugen-link */}
      <header
        className="flex items-center justify-between"
        style={{ marginBottom: 14 }}
      >
        <h2
          style={{
            fontFamily: sans,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#24301F',
            margin: 0,
          }}
        >
          Denne uge i haven
        </h2>
        <Link
          href="#mine-opgaver"
          className="inline-flex items-center"
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            color: '#24301F',
            gap: 6,
            textDecoration: 'none',
          }}
        >
          Ugens opgaver
          <ArrowRight width={16} height={16} strokeWidth={1.75} />
        </Link>
      </header>

      {days.length === 0 ? (
        <EmptyState />
      ) : (
        <DayCardsScroll days={days} />
      )}
    </section>
  )
}

/**
 * Horisontal scroll-container med custom progress-indikator i bunden.
 * Native scrollbars er upålidelige på tværs af platforme (Mac WebKit
 * skjuler dem som overlay efter inaktivitet); en JS-styret tynd bar
 * der følger scrollLeft giver konsekvent felt-bog-feeling og altid-
 * synlig affordance.
 */
function DayCardsScroll({ days }: { days: DayCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState({ thumbW: 100, thumbX: 0 })

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      if (scrollWidth <= clientWidth) {
        setProgress({ thumbW: 100, thumbX: 0 })
        return
      }
      // thumb-bredden = procent synligt af det totale scroll-area
      const thumbW = (clientWidth / scrollWidth) * 100
      // thumb-position 0..(100 - thumbW)
      const maxScroll = scrollWidth - clientWidth
      const thumbX = (scrollLeft / maxScroll) * (100 - thumbW)
      setProgress({ thumbW, thumbX })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [days.length])

  return (
    <div className="relative" style={{ marginRight: -8 }}>
      {/* Selve scroll-tracket — native scrollbar skjules,
          vi bruger custom indikator nedenfor */}
      <div
        ref={trackRef}
        className="denne-uge-track"
        style={{
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          WebkitOverflowScrolling: 'touch',
          paddingRight: 24,
          scrollbarWidth: 'none',
        }}
      >
        <style>{`
          .denne-uge-track::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="flex" style={{ gap: 10 }}>
          {days.map((d, i) => (
            <DayCardItem key={i} card={d} />
          ))}
        </div>
      </div>

      {/* Fade-overlay på højre kant — blender ind i papirbaggrunden */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: 0,
          right: 0,
          width: 40,
          bottom: 16,
          background:
            'linear-gradient(to right, rgba(246,243,235,0) 0%, rgba(246,243,235,0.94) 100%)',
        }}
      />

      {/* Custom scroll-indikator — altid synlig, tynd, dæmpet */}
      <div
        aria-hidden
        style={{
          position: 'relative',
          marginTop: 8,
          marginRight: 8,
          height: 4,
          background: 'rgba(36,48,31,0.07)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${progress.thumbX}%`,
            width: `${progress.thumbW}%`,
            background: 'rgba(36,48,31,0.30)',
            borderRadius: 999,
            transition: 'left 0.12s ease-out',
          }}
        />
      </div>
    </div>
  )
}

function DayCardItem({ card }: { card: DayCard }) {
  const Icon = card.Icon
  return (
    <article
      className="shrink-0 flex flex-col"
      style={{
        minWidth: 128,
        maxWidth: 128,
        // Kortere højde — 6mm (~23px) skåret af for at fjerne
        // luften under teksten. Indholdet er kun 3 linjer + ikon,
        // så vi behøver ikke 164px.
        height: 141,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.38)',
        border: card.isToday
          ? '1px solid rgba(90,111,68,0.14)'
          : '1px solid rgba(36,48,31,0.05)',
        padding: 10,
        scrollSnapAlign: 'start',
        position: 'relative',
      }}
    >
      {/* Lille vejr-warning-prik i toppen (kun ochre, aldrig rød) */}
      {card.isWeatherWarning && !card.isToday && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: 999,
            background: '#C89A35',
          }}
        />
      )}

      {/* Dato + lille ikon — top-rækken er kompakt så handlings-
          hierarkiet nedenfor får luft. Ikonet sidder til højre,
          dæmpet og lille (≈20% mindre end første pass), så det
          ikke længere stjæler fokus fra handlingen. */}
      <div className="flex items-center justify-between" style={{ gap: 5 }}>
        <div className="flex items-center" style={{ gap: 5 }}>
          {card.isToday && (
            <span
              aria-hidden
              className="inline-flex items-center justify-center"
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: '#7B9460',
              }}
            >
              <Leaf width={8} height={8} strokeWidth={1.5} style={{ color: '#FFFFFF' }} />
            </span>
          )}
          <span
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#24301F',
            }}
          >
            {card.dateLabel}
          </span>
        </div>
        <Icon
          width={20}
          height={20}
          strokeWidth={1.5}
          style={{ color: card.iconColor, opacity: 0.65, flexShrink: 0 }}
        />
      </div>

      {/* Linje 1 — HANDLING. Sætnings-versalering ("Udplant"),
          dæmpet olive, lille — det er system-rammen for kortet. */}
      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.01em',
          color: '#7B816F',
          marginTop: 16,
          marginBottom: 3,
        }}
      >
        {card.action}
      </p>

      {/* Linje 2 — PLANTE. Emotionel/genkendelig hovedinformation.
          Stor, mørk, høj kontrast. line-height 1.25 så descenders
          ("g", "p", "y", "ø") ikke skæres af overflow-clip. */}
      <p
        style={{
          fontFamily: sans,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          color: '#24301F',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {card.primary}
      </p>

      {/* Linje 3 — SORT. Mindre, dæmpet, identifikatoren der gør
          plantenavnet specifikt. Max 2 linjer for længere sortnavne
          som "California Wonder". Større marginTop så der er luft
          mellem linje 2's descenders og linje 3. */}
      <p
        style={{
          fontFamily: sans,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.2,
          color: '#7B816F',
          marginTop: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {card.secondary}
      </p>
    </article>
  )
}

function EmptyState() {
  return (
    <div style={{ paddingBlock: 8 }}>
      <p
        style={{
          fontFamily: sans,
          fontSize: 15,
          fontWeight: 700,
          color: '#24301F',
          marginBottom: 4,
        }}
      >
        Rolig uge i haven.
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.45,
          color: '#56604D',
          marginBottom: 10,
        }}
      >
        Der er ingen vigtige gøremål lige nu.
      </p>
      <p
        style={{
          fontFamily: sans,
          fontStyle: 'italic',
          fontSize: 13,
          fontWeight: 500,
          color: '#7B816F',
        }}
      >
        Gå en langsom runde og se hvad der har ændret sig.
      </p>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Indholds-generering
// ────────────────────────────────────────────────────────────────

/**
 * Botanisk ikon-mapping. INGEN TreePine — den fik ugen til at se
 * ud som om brugeren skulle plante grantræer i køkkenhaven. Alle
 * ikoner deler stroke-weight 1.5 så zoo'en forsvinder.
 *
 *   plant_out   → Sprout (spire der lige har slået rod)
 *   harvest     → Wheat (kurv/frugt-stand-in)
 *   sow         → Sprout (samme spire-symbolik som plant_out)
 *   tend/water  → Droplets (vand)
 *   prune       → Scissors (beskæresaks)
 *   observe     → Eye (se efter)
 *   bloom       → Flower2 (blomstrende observation)
 *   rest/sense  → Leaf (rolig sensorisk markør)
 *   weather     → CloudRain / Snowflake / Sun (vejr-specifikt)
 */
const SUGGESTION_ICONS: Record<WeekSuggestion['icon'], ComponentType<SVGProps<SVGSVGElement>>> = {
  Sprout,
  TreePine: Sprout, // overstyr lucides TreePine → spire-ikon
  Wheat,
  Droplets,
  Scissors,
  Leaf,
}

/**
 * Byg 7 day cards startende fra i dag.
 *
 * Regel (per design): mindst 6 af 7 dage SKAL være plante-relaterede
 * (Handling/Plante/Sort). Maksimalt 1 dag må være en blød sensorisk
 * note (som rytmeskift). Hvis brugerens egen frøbank/planter ikke
 * leverer nok suggestions trækker vi på en månedsspecifik fallback-
 * pulje (almindelige danske køkkenhave-opgaver pr. måned) — bedre at
 * vise generiske plante-relevante kort end soft notes.
 *
 * Layout-prioritet pr. dag:
 *   1. Vejrvarsel hvis kritisk (frost/skybrud) — tæller som dag 1
 *   2. Brugerens egne plant suggestions
 *   3. Månedsspecifik fallback-plante (cykler hvis tom)
 *   4. Soft note — KUN i 1 reserveret slot (fredag)
 */
function buildWeekDays(
  suggestions: WeekSuggestion[],
  alerts: GardenAlert[],
): DayCard[] {
  const days: DayCard[] = []
  const now = new Date()
  const currentMonth = now.getMonth() + 1

  // Vi reserverer ÉN slot (fredag, index 4) til en soft note som
  // mid-uge rytmeskift. Resten af slots skal være plante-relaterede.
  const softNoteSlot = 4

  // Kombineret pulje: brugerens egne suggestions først (mest relevant),
  // derefter månedsspecifik fallback. Cykler hvis tom.
  const fallback = SEASONAL_FALLBACK[currentMonth] ?? SEASONAL_FALLBACK[5]
  const userPlants: PlantSlot[] = suggestions.map(s => {
    const { plant, variety } = extractPlantAndVariety(s.title)
    return {
      kind: s.kind,
      icon: SUGGESTION_ICONS[s.icon] ?? Sprout,
      plant,
      variety,
    }
  })
  const pool: PlantSlot[] = userPlants.length > 0
    ? [...userPlants, ...fallback]
    : fallback

  let plantIdx = 0
  const nextPlant = (): PlantSlot => {
    const p = pool[plantIdx % pool.length]
    plantIdx++
    return p
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const isToday = i === 0
    const dateLabel = isToday
      ? 'I dag'
      : `${DAG_KORT[d.getDay()]} ${d.getDate()}`

    // Slot 1 (i morgen): vejrvarsel hvis kritisk
    if (i === 1 && alerts.length > 0) {
      const a = alerts[0]
      days.push({
        dateLabel,
        isToday: false,
        Icon: a.kind === 'frost' ? Snowflake : a.icon === 'CloudRain' ? CloudRain : Sun,
        iconColor: a.kind === 'frost' ? '#6F7563' : '#617345',
        action: a.kind === 'frost' ? 'Nattefrost' : 'Kraftig regn',
        primary: 'I nat',
        secondary: 'Beskyt sarte planter',
        isWeatherWarning: true,
      })
      continue
    }

    // Soft note kun i den ene reserverede slot (fredag)
    if (i === softNoteSlot) {
      days.push(softDayCard(dateLabel, isToday, i))
      continue
    }

    // Alle øvrige slots → plante-relateret kort (bruger først, derefter
    // sæson-fallback, cykler hvis nødvendigt)
    const p = nextPlant()
    days.push({
      dateLabel,
      isToday,
      Icon: p.icon,
      iconColor: pickColorForKind(p.kind),
      action: ACTION_FOR_KIND[p.kind],
      primary: p.plant,
      secondary: p.variety,
    })
  }

  return days
}

/**
 * Splitter en suggestion-titel som "Plant Tomat — Cherry Sweetie ud"
 * op i sit plantenavn og sin sort. Fjerner det ledende verbum og
 * trailing " ud", og splitter på em-dash.
 *
 *   "Plant Tomat — Cherry Sweetie ud"  → { plant: "Tomat", variety: "Cherry Sweetie" }
 *   "Så Agurk — Marketmore"            → { plant: "Agurk", variety: "Marketmore" }
 *   "Forspir Squash"                   → { plant: "Squash", variety: "" }
 */
function extractPlantAndVariety(title: string): { plant: string; variety: string } {
  const afterVerb = title.replace(/^\S+\s+/, '').replace(/\s+ud$/, '').trim()
  const parts = afterVerb.split(/\s+—\s+/)
  return {
    plant: parts[0]?.trim() ?? '',
    variety: parts[1]?.trim() ?? '',
  }
}

const ACTION_FOR_KIND: Record<WeekSuggestion['kind'], string> = {
  sow: 'Så',
  plant_out: 'Udplant',
  harvest: 'Høst',
  tend: 'Plej',
}

interface PlantSlot {
  kind: WeekSuggestion['kind']
  icon: ComponentType<SVGProps<SVGSVGElement>>
  plant: string
  variety: string
}

/**
 * Månedsspecifik fallback-pulje: typiske danske køkkenhave-opgaver
 * for hver måned. Bruges når brugerens egen frøbank/aktive planter
 * ikke giver nok suggestions til at fylde 6 af 7 day cards.
 *
 * Strikt format per linje: Handling / Plante / SORT. Linje 3 er
 * ALTID en faktisk sort (variety) — aldrig kontekst eller
 * instruktion. Hver entry skal læses som "Udplant / Tomat /
 * Cherry Sweetie" — tre informationsbits, ikke en pseudo-sætning.
 */
const SEASONAL_FALLBACK: Record<number, PlantSlot[]> = {
  1: [
    { kind: 'sow', icon: Sprout, plant: 'Chili', variety: 'Habanero' },
    { kind: 'sow', icon: Sprout, plant: 'Aubergine', variety: 'Black Beauty' },
    { kind: 'sow', icon: Sprout, plant: 'Peberfrugt', variety: 'Yolo Wonder' },
    { kind: 'tend', icon: Scissors, plant: 'Æble', variety: 'Ingrid Marie' },
    { kind: 'tend', icon: Scissors, plant: 'Pære', variety: 'Clara Frijs' },
    { kind: 'tend', icon: Scissors, plant: 'Ribs', variety: 'Rødt Hollandsk' },
  ],
  2: [
    { kind: 'sow', icon: Sprout, plant: 'Tomat', variety: 'Sungold' },
    { kind: 'sow', icon: Sprout, plant: 'Peberfrugt', variety: 'Padron' },
    { kind: 'sow', icon: Sprout, plant: 'Porre', variety: 'Bandit' },
    { kind: 'sow', icon: Sprout, plant: 'Tomat', variety: 'San Marzano' },
    { kind: 'tend', icon: Scissors, plant: 'Solbær', variety: 'Titania' },
    { kind: 'sow', icon: Sprout, plant: 'Selleri', variety: 'Mars' },
  ],
  3: [
    { kind: 'sow', icon: Sprout, plant: 'Salat', variety: 'Frisée' },
    { kind: 'sow', icon: Sprout, plant: 'Spinat', variety: 'Matador' },
    { kind: 'sow', icon: Sprout, plant: 'Squash', variety: 'Tromba' },
    { kind: 'sow', icon: Sprout, plant: 'Ærter', variety: 'Sukkerært' },
    { kind: 'sow', icon: Sprout, plant: 'Radise', variety: 'French Breakfast' },
    { kind: 'sow', icon: Sprout, plant: 'Rødbede', variety: 'Bull’s Blood' },
  ],
  4: [
    { kind: 'sow', icon: Sprout, plant: 'Radise', variety: 'French Breakfast' },
    { kind: 'sow', icon: Sprout, plant: 'Gulerod', variety: 'Nantes' },
    { kind: 'plant_out', icon: Sprout, plant: 'Løg', variety: 'Sturon' },
    { kind: 'sow', icon: Sprout, plant: 'Agurk', variety: 'Marketmore' },
    { kind: 'sow', icon: Sprout, plant: 'Bønne', variety: 'Blauhilde' },
    { kind: 'sow', icon: Sprout, plant: 'Rødbede', variety: 'Detroit' },
    { kind: 'sow', icon: Sprout, plant: 'Kålrabi', variety: 'Azur Star' },
  ],
  5: [
    { kind: 'plant_out', icon: Sprout, plant: 'Tomat', variety: 'Cherry Sweetie' },
    { kind: 'sow', icon: Sprout, plant: 'Squash', variety: 'Patty Pan' },
    { kind: 'plant_out', icon: Sprout, plant: 'Agurk', variety: 'Marketmore' },
    { kind: 'sow', icon: Sprout, plant: 'Bønne', variety: 'Borlotti' },
    { kind: 'plant_out', icon: Sprout, plant: 'Peberfrugt', variety: 'California Wonder' },
    { kind: 'sow', icon: Sprout, plant: 'Salat', variety: 'Lollo Rossa' },
    { kind: 'plant_out', icon: Sprout, plant: 'Tomat', variety: 'Sungold' },
  ],
  6: [
    { kind: 'tend', icon: Scissors, plant: 'Tomat', variety: 'San Marzano' },
    { kind: 'sow', icon: Sprout, plant: 'Grønkål', variety: 'Nero di Toscana' },
    { kind: 'harvest', icon: Wheat, plant: 'Salat', variety: 'Romana' },
    { kind: 'tend', icon: Leaf, plant: 'Agurk', variety: 'Telegraph' },
    { kind: 'sow', icon: Sprout, plant: 'Persille', variety: 'Mosskrøllet' },
    { kind: 'tend', icon: Droplets, plant: 'Peberfrugt', variety: 'Padron' },
  ],
  7: [
    { kind: 'harvest', icon: Wheat, plant: 'Ærter', variety: 'Sukkerært' },
    { kind: 'harvest', icon: Wheat, plant: 'Squash', variety: 'Gold Rush' },
    { kind: 'tend', icon: Scissors, plant: 'Tomat', variety: 'Black Krim' },
    { kind: 'harvest', icon: Wheat, plant: 'Timian', variety: 'Bredbladet' },
    { kind: 'sow', icon: Sprout, plant: 'Pak choi', variety: 'Joi Choi' },
    { kind: 'tend', icon: Scissors, plant: 'Tomat', variety: 'Cherry Sweetie' },
  ],
  8: [
    { kind: 'harvest', icon: Wheat, plant: 'Tomat', variety: 'Sungold' },
    { kind: 'harvest', icon: Wheat, plant: 'Bønne', variety: 'Helda' },
    { kind: 'sow', icon: Sprout, plant: 'Vinterportulak', variety: 'Claytonia' },
    { kind: 'harvest', icon: Wheat, plant: 'Agurk', variety: 'Marketmore' },
    { kind: 'tend', icon: Droplets, plant: 'Tomat', variety: 'San Marzano' },
    { kind: 'sow', icon: Sprout, plant: 'Spinat', variety: 'Giant Winter' },
  ],
  9: [
    { kind: 'harvest', icon: Wheat, plant: 'Æble', variety: 'Ingrid Marie' },
    { kind: 'harvest', icon: Wheat, plant: 'Kartoffel', variety: 'Asparges' },
    { kind: 'plant_out', icon: Sprout, plant: 'Hvidløg', variety: 'Therados' },
    { kind: 'harvest', icon: Wheat, plant: 'Græskar', variety: 'Hokkaido' },
    { kind: 'tend', icon: Leaf, plant: 'Grønkål', variety: 'Nero di Toscana' },
    { kind: 'sow', icon: Sprout, plant: 'Vintersalat', variety: 'Winter Density' },
  ],
  10: [
    { kind: 'harvest', icon: Wheat, plant: 'Pastinak', variety: 'Halblange' },
    { kind: 'tend', icon: Leaf, plant: 'Grønkål', variety: 'Russisk' },
    { kind: 'plant_out', icon: Sprout, plant: 'Hvidløg', variety: 'Messidor' },
    { kind: 'tend', icon: Scissors, plant: 'Æble', variety: 'Filippa' },
    { kind: 'harvest', icon: Wheat, plant: 'Pære', variety: 'Conference' },
    { kind: 'tend', icon: Leaf, plant: 'Rosmarin', variety: 'Officinalis' },
  ],
  11: [
    { kind: 'tend', icon: Scissors, plant: 'Frugttræ', variety: 'Cox Orange' },
    { kind: 'tend', icon: Scissors, plant: 'Solbær', variety: 'Titania' },
    { kind: 'tend', icon: Leaf, plant: 'Krydderurt', variety: 'Timian' },
    { kind: 'tend', icon: Leaf, plant: 'Hvidløg', variety: 'Therados' },
    { kind: 'tend', icon: Scissors, plant: 'Ribs', variety: 'Jonkheer van Tets' },
    { kind: 'tend', icon: Leaf, plant: 'Grønkål', variety: 'Russisk' },
  ],
  12: [
    { kind: 'tend', icon: Scissors, plant: 'Æble', variety: 'Ingrid Marie' },
    { kind: 'sow', icon: Sprout, plant: 'Chili', variety: 'Habanero' },
    { kind: 'sow', icon: Sprout, plant: 'Aubergine', variety: 'Black Beauty' },
    { kind: 'tend', icon: Scissors, plant: 'Pære', variety: 'Clara Frijs' },
    { kind: 'sow', icon: Sprout, plant: 'Peberfrugt', variety: 'Yolo Wonder' },
    { kind: 'tend', icon: Scissors, plant: 'Stikkelsbær', variety: 'Hinnonmäki' },
  ],
}

function pickColorForKind(kind: WeekSuggestion['kind']): string {
  switch (kind) {
    case 'sow': return '#617345'
    case 'plant_out': return '#5A6F44'
    case 'harvest': return '#C89A35'
    case 'tend': return '#617345'
  }
}

/**
 * Bløde sensoriske notes for dage uden konkrete opgaver. Hører
 * konceptuelt sammen med "Haven som sanctuary"-laget (Docs/);
 * her udelukkende i denne uge-overblikket som rolig vibe-fylder.
 *
 * Følger samme hierarki som handlings-cards: action (kort verbum) +
 * subject (objekt) + support (kort kontekst).
 */
const SOFT_NOTES = [
  { action: 'Gå',    primary: 'Langsom runde',    secondary: 'Uden telefon' },
  { action: 'Mærk',  primary: 'Jorden',           secondary: 'Før du vander' },
  { action: 'Lyt',   primary: 'To minutter',      secondary: 'Stå stille' },
  { action: 'Duft',  primary: 'Til urterne',      secondary: 'Gnid et blad' },
  { action: 'Brug',  primary: 'Hænderne',         secondary: 'Ikke redskaber' },
  { action: 'Stå',   primary: 'Et øjeblik',       secondary: 'Efter vanding' },
]

function softDayCard(dateLabel: string, isToday: boolean, dayIndex: number): DayCard {
  const note = SOFT_NOTES[dayIndex % SOFT_NOTES.length]
  return {
    dateLabel,
    isToday,
    Icon: Leaf,
    iconColor: '#A7B08A',
    action: note.action,
    primary: note.primary,
    secondary: note.secondary,
  }
}
