/**
 * Kapitel 3: "Sæsonens historie" — krøniken (V5, havebog.md V2).
 *
 *   Marts — Du såede årets første tomater.
 *   April — Chiliplanterne fik deres første rigtige blade.
 *   Maj   — De første salater blev høstet.
 *
 * Måned for måned som en bogs kapitelliste, ikke en log. Linjerne
 * kan senere skrives af AI; strukturen er låst nu (Annas spec).
 *
 * Komposition (kompositions-reglen): tynd lodret krønike-linje til
 * venstre med måneds-punkter — adskiller sig fra Kapitel 1 (ren
 * prosa) og På denne dag (foto-stak). Som marginlinjen i en
 * gammel almanak.
 *
 * Stilhed: ingen måneder med historie → sektionen udelades.
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
    <section>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
          marginBottom: 18,
        }}
      >
        Sæsonens historie
      </p>

      {/* Krønike-linjen — tynd lodret streg som månederne hænger på */}
      <div
        style={{
          borderLeft: '1px solid rgba(36,48,31,0.16)',
          paddingLeft: 22,
          marginLeft: 4,
        }}
        className="space-y-6"
      >
        {maaneder.map(m => (
          <div key={m.maaned} style={{ position: 'relative' }}>
            {/* Måneds-punkt på linjen */}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: -26.5,
                top: 7,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'rgba(36,48,31,0.30)',
                border: '2px solid var(--background)',
              }}
            />
            <p
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
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
                fontSize: 'clamp(18px, 3.6vw, 22px)',
                lineHeight: 1.35,
                color: 'rgba(36,48,31,0.80)',
                margin: 0,
                marginTop: 4,
                maxWidth: '26ch',
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
