/**
 * "Naturen lige nu" — V3 (juni 2026, Anna's arkitektur-ordre).
 *
 * IKKE et card. IKKE en boks. IKKE en border. IKKE en baggrund.
 * Tre observationer i kolonne, hver med et lille ikon. Til højre
 * ligger en botanisk stregillustration ved 10-15% opacity — som
 * pencilstreger i et gammelt planteatlas.
 *
 * Sætter den naturhistoriske tone for siden. Skal placeres direkte
 * under Hero så hele første viewport er fortælling, ikke data.
 *
 * Observationerne er sæson-relevante og roterer pr. måned. De er
 * ikke handlings-prompts; de er observations-prompts. Forskellen
 * mellem "vand tomaterne" og "duggen er væk klokken 9".
 */

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Observation {
  symbol: string         // emoji eller mini-SVG-ikon (bare brug emoji for nu)
  text: string
}

interface Props {
  observations: Observation[]
}

export function NaturenLigeNu({ observations }: Props) {
  return (
    <section className="relative" style={{ paddingBlock: '16px 8px' }}>
      {/* Botanisk stregillustration højre — yderst svag, som et
          motiv-anker for sektionen. Position 'absolute' fordi den
          ikke må påvirke layoutet af observations-listen.
          SVG inline så vi ikke afhænger af et asset der ikke findes. */}
      <BotaniskStreg className="absolute right-2 top-0 sm:right-4" />

      <div className="space-y-3">
        <p
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.50)',
            margin: 0,
          }}
        >
          Naturen lige nu
        </p>

        <ul className="space-y-2.5" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {observations.map((obs, i) => (
            <li
              key={i}
              className="flex items-start gap-3"
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 'clamp(17px, 2.8vw, 20px)',
                lineHeight: 1.45,
                color: 'rgba(36,48,31,0.78)',
                margin: 0,
                maxWidth: 340,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 22,
                  fontSize: 17,
                  lineHeight: 1.45,
                  flexShrink: 0,
                  // Lille top-margin for at ikonet visuelt sidder
                  // på linje med x-højden i serif-teksten.
                  marginTop: 1,
                }}
              >
                {obs.symbol}
              </span>
              <span>{obs.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * Botanisk stregillustration — minimal SVG der antyder en plante.
 * Bevidst SIMPEL (få streger) så den læser som baggrundsmotiv, ikke
 * forgrundselement. 10-12% opacity gør den til atmosfære snarere
 * end indhold.
 *
 * Motivet: en lille kvist med 4 blade og en knop øverst. Hentet
 * efter forsidet på Flora Danica's mindre planteatlas — minimal,
 * organisk, ingen perfekt symmetri.
 */
function BotaniskStreg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={92}
      height={140}
      viewBox="0 0 92 140"
      fill="none"
      stroke="rgba(36,48,31,0.30)"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ pointerEvents: 'none' }}
    >
      {/* Hovedstilk */}
      <path d="M48 138 C 48 110, 46 88, 49 60 C 51 38, 50 18, 50 6" />
      {/* Knop øverst */}
      <ellipse cx="50" cy="5" rx="4" ry="6" />
      {/* Blad 1 — venstre top */}
      <path d="M49 38 C 34 30, 22 28, 12 32 C 22 38, 38 42, 49 42" fill="rgba(36,48,31,0.06)" />
      {/* Blad 2 — højre øverste */}
      <path d="M50 58 C 64 50, 76 50, 86 56 C 76 62, 60 64, 50 62" fill="rgba(36,48,31,0.06)" />
      {/* Blad 3 — venstre nederste */}
      <path d="M47 84 C 32 76, 22 76, 10 82 C 22 90, 38 90, 47 88" fill="rgba(36,48,31,0.06)" />
      {/* Blad 4 — højre nederste */}
      <path d="M48 110 C 60 102, 74 102, 84 108 C 74 116, 60 116, 48 114" fill="rgba(36,48,31,0.06)" />
    </svg>
  )
}
