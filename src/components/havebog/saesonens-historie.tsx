/**
 * Kapitel 3: "Sæsonens historie" — krøniken (V7, havebog.md V3).
 *
 * Havebogens VIGTIGSTE kapitel. Kapitel-tempo: CENTRERET, vertikal
 * tidslinje, stor afstand. Det skal føles som en fortælling, ikke
 * som logdata:
 *
 *          MARTS
 *   Du såede årets første tomater.
 *          │
 *          APRIL
 *   Chiliplanterne fik deres
 *   første rigtige blade.
 *          │
 *          ...
 *
 * V5's venstrestillede marginlinje er væk — alt i venstre kolonne
 * var én af de tre dødssynder. Månederne står nu midt på siden som
 * kapiteltitler i en bog, forbundet af korte lodrette streger.
 * Luften mellem månederne er bevidst stor.
 *
 * Linjerne kan senere skrives af AI; strukturen er låst.
 * Stilhed: ingen måneder med historie → kapitlet udelades.
 */

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

export interface SaesonMaanedLinje {
  maaned: string
  linje: string
}

interface Props {
  maaneder: SaesonMaanedLinje[]
}

export function SaesonensHistorie({ maaneder }: Props) {
  if (maaneder.length === 0) return null

  return (
    <section style={{ textAlign: 'center', paddingBlock: '8px 4px' }}>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
          marginBottom: 36,
        }}
      >
        Sæsonens historie
      </p>

      <div>
        {maaneder.map((m, i) => (
          <div key={m.maaned}>
            {/* Tidslinje-strege mellem månederne — kort, lodret,
                centreret. Forbinder uden at dominere. */}
            {i > 0 && (
              <div
                aria-hidden
                style={{
                  width: 1,
                  height: 44,
                  background: 'rgba(36,48,31,0.20)',
                  margin: '26px auto',
                }}
              />
            )}
            <p
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: 'rgba(36,48,31,0.55)',
                margin: 0,
              }}
            >
              {m.maaned}
            </p>
            <p
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 'clamp(20px, 4.2vw, 26px)',
                lineHeight: 1.3,
                color: '#24301F',
                margin: '8px auto 0',
                maxWidth: '22ch',
              }}
            >
              {m.linje}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
