const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  /** Vævede takter — nutid → din have → inspiration → blik fremad */
  takter: string[]
}

/**
 * ILDSTEDET (V15) — "Havens stemme i dag".
 *
 * Havebogens centrum. Ikke en sektion blandt mange; det ene sted
 * der samler alt. De eksisterende motorer (nutidsanker, opdagelse,
 * inspiration, blik fremad) væves til ÉN flydende stemme — et
 * dagligt brev fra haven. Fylder næsten en hel viewport.
 *
 * Form (Annas brev/redaktørens-note-bud, V15):
 *   - Stor serif, massiv luft, én tanke ad gangen
 *   - Ingen boks, ingen kort, ingen eyebrow-label — ren stemme på
 *     creme. Det MÅ ikke ligne dashboard, widget, feed eller
 *     notifikation.
 *   - Første takt størst (brevets åbning), de øvrige træder en
 *     anelse tilbage — som stemmen falder til ro.
 *
 * Ændrer sig dagligt fordi takterne selv roterer (inspiration +
 * blik fremad vælges pr. dagsnummer i actionen). Ingen nye data.
 */
export function HavensStemme({ takter }: Props) {
  if (takter.length === 0) return null

  return (
    <section
      style={{
        // Ildstedet skal eje sin flade — generøs lodret luft, så det
        // står som et helt opslag, ikke en stribe mellem andre.
        paddingBlock: 'clamp(24px, 9vw, 64px) clamp(16px, 6vw, 40px)',
      }}
    >
      {takter.map((takt, i) => {
        const erAabning = i === 0
        return (
          <p
            key={i}
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: erAabning
                ? 'clamp(31px, 7.6vw, 50px)'
                : 'clamp(24px, 5.6vw, 35px)',
              lineHeight: erAabning ? 1.14 : 1.26,
              letterSpacing: '-0.015em',
              color: erAabning ? '#24301F' : 'rgba(36,48,31,0.78)',
              margin: 0,
              // Massiv luft mellem takterne — én tanke ad gangen
              marginTop: i === 0 ? 0 : 'clamp(28px, 8vw, 52px)',
              maxWidth: '20ch',
            }}
          >
            {takt}
          </p>
        )
      })}

      {/* Diskret signatur — brevet er fra haven, ikke fra appen.
          Ingen knap, ingen CTA; bare en afsender. */}
      <p
        style={{
          fontFamily: sans,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.4)',
          margin: 0,
          marginTop: 'clamp(32px, 9vw, 56px)',
        }}
      >
        Fra haven
      </p>
    </section>
  )
}
