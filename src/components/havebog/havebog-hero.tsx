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

  // Redaktionel datomarkering — magasin-forside-stil.
  // V3.6 (Anna): året er FJERNET. "Magasiner skriver sjældent 2026
  // med store typer. Redaktøren ved allerede hvad der er vigtigt.
  // Brugeren skal bare mærke dagen."
  const today = new Date()
  const dayNum = today.getDate()
  const monthShort = MAANED_KORT_UPPER[month - 1]

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

      {/* Redaktionel datomarkering øverst højre — V3.8 (Anna's
          asymmetri-spec).
          IKKE et badge, IKKE en chip, IKKE en dato-widget — magasinforside.
          Dagstallet er hovedpersonen, måneden er støttekarakter.
          Søjlen er centreret (JUN under 7's midte) og let skubbet
          mod højre kant — så datoen rører kanten frem for at sidde
          pænt inden for et grid. */}
      <div
        className="absolute z-10 flex flex-col items-center"
        style={{
          top: 24,
          right: 8,
          // Bredden bestemmes af det bredeste element (dagstallet).
          // JUN centreres horisontalt indenfor søjlen.
        }}
      >
        <span
          style={{
            fontFamily: serif,
            fontWeight: 400,
            // V3.8: dagstallet vokser yderligere — 88 → 104px max.
            fontSize: 'clamp(80px, 18vw, 104px)',
            lineHeight: 0.8,
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 2px 22px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.35)',
            // Stram letter-spacing for de typiske flertydige tal-glyfer.
            // Cormorant tal har naturlig bred kapside.
            letterSpacing: '-0.02em',
            display: 'block',
          }}
        >
          {dayNum}
        </span>
        <span
          style={{
            fontFamily: sans,
            // V3.8: 15 → 12px. Måneden er nu STØTTEKARAKTER, ikke
            // jævnbyrdig partner. "JUN" må ikke læses som lige så
            // vigtig som "7".
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.35em',
            // V3.8: positiv margin-top — der er nu LUFT mellem 7 og JUN.
            // Tidligere -4px læste som ét logo; +8px gør JUN til en
            // separat editorial note under tallet.
            marginTop: 8,
            // Korrigér letter-spacing-offset så "JUN" centreres optisk.
            paddingLeft: '0.35em', // tracker tilføjer space efter sidste char
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 1px 8px rgba(0,0,0,0.45)',
            display: 'block',
          }}
        >
          {monthShort}
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

          {/*
           * V3.4 (Anna's stripping-feedback): personalText FJERNET fra hero.
           *
           * Anna: "Magasiner forklarer ikke forsiden på forsiden."
           * Hero har kun ét budskab: titel + sæsonlinje. Det er det.
           *
           * For ny bruger lever de tekster der før var her ("Du dyrker
           * 8 sorter / Om lidt begynder de første minder...") nu nede
           * i DenneSæson FirstSeasonBlock — sektionen direkte under hero.
           *
           * For aktiv og år 2+ taler DenneSæson for sig selv via
           * fact-cards (seneste høst / note / billede).
           *
           * Datolinjen nederst er fjernet — den redaktionelle datomarkering
           * øverst højre har overtaget rollen.
           *
           * tidslinje-propen bevares som API-kontrakt men render'es ikke.
           */}
        </div>
      </div>
    </section>
  )
}
