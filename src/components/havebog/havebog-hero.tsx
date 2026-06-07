import type { HeroStats, Tidslinje, HeroNarrative } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  stats: HeroStats | null
  tidslinje?: Tidslinje
  narrative?: HeroNarrative
}

/**
 * "Din Havebog" — eget hero-layout for Havebog.
 *
 * V2 (juni 2026): Anna's diagnose — heroen var en OVERSKRIFT, ikke
 * en FORTÆLLER. Den fortalte "Din dyrkningsrejse samlet ét sted" +
 * stats — administrativt sprog. V2 erstatter det med 3 lag:
 *
 *   Lag 1 (h1):        "Din Havebog"
 *   Lag 2 (eyebrow):   "Din første sæson" / "Juni i haven" / "Velkommen tilbage til juni"
 *                      — Cormorant italic, sæsonbaseret
 *   Lag 3 (narrative): 1-3 personlige linjer der placerer brugeren
 *                      i sin egen sæson
 *
 * Genereres server-side i actions/havebog.ts → buildHeroNarrative.
 *
 * Stats-linjen er nu skjult som default — den var "0 noter · 8 sorter
 * · 0 høster" for ny bruger, hvilket er præcis det administrative
 * sprog der gjorde heroen tom. Den vises kun hvis narrative.showStats
 * er sand (sat når brugeren har meningsfulde tal).
 *
 * Heroen bærer den tomhed brugeren ellers ville møde gentaget på
 * 5 sektioner længere nede. "Din første sæson er begyndt" gør det
 * meningsfuldt at Historik er tom — det er forklaringen på resten
 * af siden.
 *
 * Tidslinjen (Søndag d. 7. juni) er forbliveligt low-key under
 * narrativen — den er ren tidsorientering, ikke fortælling.
 *
 * IKKE en wrapper om PageHero. Havebog er den første side folk åbner;
 * den skal have sin egen identitet. Greeting-pattern ("Godaften Maj")
 * tilhører dashboard-verdenen og er bevidst fraværende her.
 */
export function HavebogHero({ stats, tidslinje, narrative }: Props) {
  const showStats = narrative?.showStats && stats !== null

  return (
    <section className="space-y-4 pt-2 sm:pt-3">
      <h1
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 'clamp(48px, 12vw, 84px)',
          lineHeight: 0.92,
          letterSpacing: '-0.025em',
          color: '#24301F',
          margin: 0,
        }}
      >
        Din Havebog
      </h1>

      {narrative && <SeasonLine text={narrative.seasonLine} />}
      {narrative && <PersonalNarrative lines={narrative.personalText} />}

      {/* Tidslinje + stats lever som sekundære, low-key signaler.
          De er ikke længere første-indtryk; de orienterer dem der
          har scrollet ind på siden uden at åbne en specifik sektion. */}
      <div className="space-y-2 pt-2">
        {tidslinje && <TidslinjeLine tidslinje={tidslinje} />}
        {showStats && stats && <StatsLine stats={stats} />}
      </div>
    </section>
  )
}

/**
 * Sæsonlinjen — Lag 2. Korte, sætningsagtige eyebrows i Cormorant
 * italic. Skiftet fra "tagline" til "season line" er det vigtigste
 * typografiske skred: brugeren læser nu en sætning der placerer
 * dem i tid og kontekst, ikke en marketing-tagline.
 *
 * Eksempler:
 *   "Din første sæson"
 *   "Juni i haven"
 *   "Velkommen tilbage til juni"
 */
function SeasonLine({ text }: { text: string }) {
  return (
    <p
      style={{
        fontFamily: serif,
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: 'clamp(22px, 4.4vw, 30px)',
        lineHeight: 1.2,
        letterSpacing: '-0.005em',
        color: 'rgba(36,48,31,0.78)',
        margin: 0,
        maxWidth: 460,
      }}
    >
      {text}
    </p>
  )
}

/**
 * Lag 3 — den personlige fortælling. 1-3 hele sætninger, hver med
 * eget afsnit. Cormorant regular (ikke italic, ikke bold) — det
 * læser som forfatter-prose, ikke metadata.
 *
 * Hvorfor adskilte <p> per linje: hver sætning er en selvstændig
 * narrativ beat. "Agurkerne har stået ude i 12 dage. Tomaterne
 * begynder at tage fart. Du har skrevet 3 noter denne uge." læser
 * meget mere fortællende som 3 linjer end som én lang sætning.
 */
function PersonalNarrative({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <p
          key={i}
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 'clamp(17px, 2.8vw, 20px)',
            lineHeight: 1.45,
            color: 'rgba(36,48,31,0.70)',
            margin: 0,
            maxWidth: 480,
          }}
        >
          {line}
        </p>
      ))}
    </div>
  )
}

/**
 * "Du er her"-linjen — én rolig editorial sætning med dato + milestone.
 *
 * V2-rolle: low-key tids-orientering UNDER narrativen. Den er ikke
 * længere første-indtryk; den siger bare hvilken dag det er, og
 * hvad der sidst skete af substans.
 */
function TidslinjeLine({ tidslinje }: { tidslinje: Tidslinje }) {
  const parts: string[] = [tidslinje.dateText]
  if (tidslinje.milestoneText) parts.push(tidslinje.milestoneText)
  if (tidslinje.weekNoteCount > 0) {
    parts.push(
      `${tidslinje.weekNoteCount} ${tidslinje.weekNoteCount === 1 ? 'note' : 'noter'} fra denne uge`,
    )
  }
  return (
    <p
      style={{
        fontFamily: sans,
        fontSize: 12.5,
        fontWeight: 500,
        lineHeight: 1.5,
        color: 'rgba(36,48,31,0.45)',
        letterSpacing: '0.01em',
        margin: 0,
        maxWidth: 520,
      }}
    >
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                marginInline: 8,
                opacity: 0.55,
              }}
            >
              ·
            </span>
          )}
          {part}
        </span>
      ))}
    </p>
  )
}

/**
 * Stats — kun vist hvis narrative.showStats er sand. Det skåner
 * ny bruger fra at se "0 noter · 8 sorter · 0 høster" som første
 * indtryk.
 */
function StatsLine({ stats }: { stats: HeroStats }) {
  const items: { value: number; label: string }[] = [
    { value: stats.notes, label: stats.notes === 1 ? 'note' : 'noter' },
    { value: stats.varieties, label: stats.varieties === 1 ? 'sort' : 'sorter' },
    {
      value: stats.harvests,
      label: `${stats.harvests === 1 ? 'høst' : 'høster'} i år`,
    },
  ]
  return (
    <p
      style={{
        fontFamily: sans,
        fontSize: 12.5,
        fontWeight: 600,
        color: 'rgba(36,48,31,0.45)',
        letterSpacing: '0.01em',
        margin: 0,
      }}
    >
      {items.map((it, i) => (
        <span key={it.label} className="inline-flex items-center gap-2.5">
          {i > 0 && (
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'currentColor',
                opacity: 0.5,
                marginInline: 6,
              }}
            />
          )}
          {it.value} {it.label}
        </span>
      ))}
    </p>
  )
}
