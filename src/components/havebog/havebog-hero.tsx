import type { HeroStats, Tidslinje, HeroNarrative } from '@/data/havebog-demo'
import { aktuelMaaned } from '@/lib/datetime'
import { pickHavebogHero } from '@/lib/havebog-hero-photo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

const MAANED_KORT_UPPER = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN',
  'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC',
] as const

interface Props {
  /** Eksisterende men ikke længere renderet i V3 — bevaret som API-kontrakt */
  stats?: HeroStats | null
  tidslinje?: Tidslinje
  narrative?: HeroNarrative
  /**
   * Override foto-stien — bruges i QA-routes for at vise specifikke
   * varianter side-om-side. I produktion sat til undefined så
   * pickHavebogHero(month, userState) vælger automatisk.
   */
  photoOverride?: string
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
 * V3.2 (juni 2026): Foto vælges nu fra heroes-havebog/-poolen via
 * pickHavebogHero(måned, userState). Havebog har sin EGEN foto-
 * arkitektur, separat fra Kalender's månedsheroes — minder og
 * observationer, ikke katalogfotos. Hvis ingen havebog-specifik
 * variant findes for måneden, falder vi tilbage til
 * heroes-maaneder/-poolen.
 *
 * Tekst-arkitektur (Anna's spec V3.2):
 *   Cormorant 72px max       — "Din Havebog"
 *   Cormorant Italic 40px max — sæsonlinje ("Juni i haven")
 *   Cormorant 28px max        — narrative-linjer
 *   Manrope 13px              — dato/metadata
 *
 * Stats-linjen ("0 noter · 8 sorter · 0 høster") er FORBUDT i V3.
 * Hvis brugeren skal se tal, hører de hjemme inde i Historik-sektionen.
 * Hero er fortælling, ikke status.
 */
export function HavebogHero({ tidslinje, narrative, photoOverride }: Props) {
  const month = aktuelMaaned() // 1-12
  const userState = narrative?.userState ?? 'active'
  const fotoPath = photoOverride ?? pickHavebogHero(month, userState)

  // Redaktionel datomarkering — uddrages fra tidslinjen.
  // Tidslinjens dateText er fx "Søndag d. 7. juni" — vi parser
  // dagstal ud. Måned/år tages fra serverens nuværende dato.
  const today = new Date()
  const dayNum = today.getDate()
  const monthShort = MAANED_KORT_UPPER[month - 1]
  const yearNum = today.getFullYear()

  return (
    <section
      // -mx-4 bryder app-layoutets px-4
      // -mt-6 bryder app-layoutets py-6 (top)
      className="relative -mx-4 -mt-6 overflow-hidden"
      style={{
        // 78vh — Anna's spec (75-80vh). Hero er åbningssiden i et
        // magasin; mere luft, færre ord, større billede. minHeight
        // sikrer hero føles substantiel selv på korte landscape-skærme.
        height: '78vh',
        minHeight: 600,
      }}
    >
      {/* Foto — fylder hele heroen.
          backgroundPosition justeret så stokrosens centrum (rødt
          element) ligger i højre 2/3, solen øverst, venstre side
          relativt rolig til tekst. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url('${fotoPath}')`,
          backgroundPosition: '60% center',
        }}
      />

      {/* Tekstlæsbarheds-gradient — Anna's spec V3.2.
          MEGET lettere end V3.1: top 8%, midte 18%, bund 42%.
          Bevidst at lade fotoet trække vejret. Mørkere bund alene
          giver tekst i nederste tredjedel nok kontrast. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, ' +
            'rgba(0,0,0,0.08) 0%, ' +
            'rgba(0,0,0,0.18) 35%, ' +
            'rgba(0,0,0,0.42) 100%)',
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

      {/* Redaktionel datomarkering øverst højre.
          IKKE et badge, IKKE en chip — bare typografi, som i en
          gammel havemagasin-forside eller avis-mastehoved.
          Tre lag: stort dagstal (Cormorant), månedsnavn (Manrope
          tracking-wide), år (Manrope smaller). */}
      <div
        className="absolute z-10 flex flex-col items-end"
        style={{
          top: 22,
          right: 24,
          gap: 2,
          textAlign: 'right',
        }}
      >
        <span
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 'clamp(48px, 11vw, 64px)',
            lineHeight: 0.85,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 2px 18px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.35)',
          }}
        >
          {dayNum}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.24em',
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 1px 8px rgba(0,0,0,0.45)',
            marginTop: 4,
          }}
        >
          {monthShort}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.16em',
            color: 'rgba(255,255,255,0.65)',
            textShadow: '0 1px 8px rgba(0,0,0,0.45)',
            marginTop: 2,
          }}
        >
          {yearNum}
        </span>
      </div>

      {/* Tekst-blok nederst venstre.
          Anna's spec: nederste tredjedel, venstre side. */}
      <div
        className="relative z-10 flex h-full flex-col justify-end"
        style={{ padding: '0 24px 60px 24px' }}
      >
        <div style={{ maxWidth: 460 }}>
          {/* Lag 1: Titel — Cormorant 72px max, hvid. */}
          <h1
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 'clamp(54px, 12vw, 72px)',
              lineHeight: 0.92,
              letterSpacing: '-0.022em',
              color: '#FFFFFF',
              textShadow: '0 2px 22px rgba(0,0,0,0.42), 0 1px 4px rgba(0,0,0,0.32)',
              margin: 0,
            }}
          >
            Din Havebog
          </h1>

          {/* Lag 2: Sæsonlinje — Cormorant Italic 40px max, hvid 92%. */}
          {narrative && (
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(28px, 6vw, 40px)',
                lineHeight: 1.15,
                letterSpacing: '-0.005em',
                color: 'rgba(255,255,255,0.92)',
                textShadow: '0 1px 16px rgba(0,0,0,0.50)',
                margin: 0,
                marginTop: 22,
              }}
            >
              {narrative.seasonLine}
            </p>
          )}

          {/* Lag 3: Brødtekst — Cormorant 28px max, hvid 88%. */}
          {narrative && narrative.personalText.length > 0 && (
            <div className="space-y-2" style={{ maxWidth: 420, marginTop: 28 }}>
              {narrative.personalText.map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: serif,
                    fontWeight: 400,
                    fontSize: 'clamp(22px, 4.4vw, 28px)',
                    lineHeight: 1.4,
                    color: 'rgba(255,255,255,0.88)',
                    textShadow: '0 1px 14px rgba(0,0,0,0.50)',
                    margin: 0,
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          )}

          {/*
           * Datolinjen nederst er FJERNET i V3.3 — den redaktionelle
           * datomarkering øverst højre har overtaget rollen.
           * tidslinje-propen bevares som API-kontrakt for fremtidige
           * milestone-tekster der måtte komme tilbage i hero-narrativen.
           */}
        </div>
      </div>
    </section>
  )
}
