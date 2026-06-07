import type { HeroStats, Tidslinje, HeroNarrative } from '@/data/havebog-demo'
import { aktuelMaaned } from '@/lib/datetime'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const MAANED_SLUG = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
] as const

interface Props {
  /** Eksisterende men ikke længere renderet i V3 — bevaret som API-kontrakt */
  stats?: HeroStats | null
  tidslinje?: Tidslinje
  narrative?: HeroNarrative
}

/**
 * "Din Havebog" — V3-hero (juni 2026, Anna's arkitektur-ordre).
 *
 * VENDEPUNKTET: V2 var typografisk — creme baggrund, mørkegrøn tekst,
 * stack af fonte. Det læste som "smukt CMS". V3 er REDAKTIONELT —
 * fuldbredde sæsonfoto med tekst-overlay, som åbningen af et magasin.
 *
 * Anti-regler V3 håndhæver:
 *   - INGEN container, INGEN rounded corners, INGEN cards
 *   - Foto bryder app-layoutets 480px max-width via -mx-4
 *   - Tekst hvid på mørk overlay (fotografi som hovedperson)
 *   - 70-80vh høj — heroen ER første viewport, ikke første sektion
 *
 * Foto vælges per aktuel måned fra heroes-maaneder/. Samme pool som
 * Kalender bruger; identiske sæson-anker, forskellig komposition:
 * Kalender skriver om timing (over fotoet), Havebog skriver fortælling.
 *
 * Tekst-arkitektur (Anna's spec):
 *   Cormorant 72-88px       — "Din Havebog"
 *   Cormorant Italic 30-36px — sæsonlinje ("Juni i haven")
 *   Cormorant 22-26px        — narrative-linjer
 *   Manrope 13px             — dato/metadata
 *
 * Stats-linjen ("0 noter · 8 sorter · 0 høster") er FORBUDT i V3.
 * Hvis brugeren skal se tal, hører de hjemme inde i Historik-sektionen.
 * Hero er fortælling, ikke status.
 */
export function HavebogHero({ tidslinje, narrative }: Props) {
  const month = aktuelMaaned() // 1-12
  const fotoPath = `/images/heroes-maaneder/hero-${MAANED_SLUG[month - 1]}-foto.png`

  return (
    <section
      // -mx-4 bryder app-layoutets px-4
      // -mt-6 bryder app-layoutets py-6 (top)
      className="relative -mx-4 -mt-6 overflow-hidden"
      style={{
        // 70vh på mobil, lidt mere generøst på desktop hvor viewport
        // er højere. minHeight sikrer hero føles substantiel selv på
        // korte skærme.
        height: '75vh',
        minHeight: 560,
      }}
    >
      {/* Foto — fylder hele heroen, ingen subtilitet, ingen tilbageholdenhed */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url('${fotoPath}')`,
          backgroundPosition: 'center 38%',
        }}
      />

      {/* Tekstlæsbarheds-gradient.
          Mørkere nederst hvor teksten ligger, fader ud opad så fotoets
          øvre del beholder sin lysstyrke og farve. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, ' +
            'rgba(12,18,8,0.18) 0%, ' +
            'rgba(12,18,8,0.05) 28%, ' +
            'rgba(12,18,8,0.32) 55%, ' +
            'rgba(12,18,8,0.72) 88%, ' +
            'rgba(12,18,8,0.86) 100%)',
        }}
      />

      {/* Bund-fade ned mod sidens creme-baggrund — så heroen smelter
          ind i resten af siden uden hård kant. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0"
        style={{
          height: 80,
          background:
            'linear-gradient(180deg, rgba(234,230,216,0) 0%, rgba(234,230,216,0.85) 100%)',
        }}
      />

      {/* Tekst-blok nederst venstre. */}
      <div
        className="relative z-10 flex h-full flex-col justify-end"
        style={{
          // Padding skal afspejle papirets margin: generøs nederst,
          // venstre. paddingBottom = 96px holder teksten klart af
          // bund-faden uden at trække den væk fra magasin-feelet.
          padding: '0 24px 96px 24px',
        }}
      >
        <div className="space-y-4" style={{ maxWidth: 440 }}>
          {/* Lag 1: Titel */}
          <h1
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 'clamp(56px, 13vw, 88px)',
              lineHeight: 0.88,
              letterSpacing: '-0.025em',
              color: '#F4EFDC',
              textShadow: '0 2px 18px rgba(12,18,8,0.45), 0 1px 3px rgba(12,18,8,0.35)',
              margin: 0,
            }}
          >
            Din Havebog
          </h1>

          {/* Lag 2: Sæsonlinje (italic) */}
          {narrative && (
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(26px, 5.5vw, 36px)',
                lineHeight: 1.15,
                letterSpacing: '-0.005em',
                color: 'rgba(244,239,220,0.95)',
                textShadow: '0 1px 14px rgba(12,18,8,0.55)',
                margin: 0,
              }}
            >
              {narrative.seasonLine}
            </p>
          )}

          {/* Lag 3: Personlig narrativ */}
          {narrative && narrative.personalText.length > 0 && (
            <div className="space-y-1" style={{ maxWidth: 400 }}>
              {narrative.personalText.map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: serif,
                    fontWeight: 400,
                    fontSize: 'clamp(20px, 3.8vw, 26px)',
                    lineHeight: 1.35,
                    color: 'rgba(244,239,220,0.88)',
                    textShadow: '0 1px 12px rgba(12,18,8,0.55)',
                    margin: 0,
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* Metadata (Manrope, ren tekst). Tidslinjens dato + optional milestone. */}
          {tidslinje && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4,
                letterSpacing: '0.02em',
                color: 'rgba(244,239,220,0.65)',
                margin: 0,
                marginTop: 18,
              }}
            >
              {tidslinje.dateText}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
