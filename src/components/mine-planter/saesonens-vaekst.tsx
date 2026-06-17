const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface MaanedHistorie {
  maaned: string
  historie: string
}

/**
 * 🌱 FRA FRØ TIL NU (overskrift tidl. "Sæsonens vækst", 17/6) — sæsonen
 * som fortælling, ikke statistik.
 *
 * Anna (spec): "En enorm lodret tidslinje. Ikke diagram. Ikke statistik.
 * Historie. Stor serif. Meget luft. Meget få elementer." En lodret
 * sæson-strimmel hvor hver måned er én stor serif-overskrift + én rolig
 * linje. Den måned vi er i nu står fremhævet.
 *
 * Statisk fortælling i fase 1 (oplevelse før data) — udledes af
 * sæsonens hændelser senere.
 */
export function SaesonensVaekst({
  historik,
  nuMaaned,
}: {
  historik: MaanedHistorie[]
  nuMaaned: string
}) {
  if (historik.length === 0) return null

  return (
    <section>
      <h2
        className="uppercase px-0.5"
        style={{
          fontFamily: sans,
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'rgba(36,48,31,0.52)',
          margin: '0 0 16px',
        }}
      >
        Fra frø til nu
      </h2>

      <ol className="relative" style={{ paddingLeft: 26 }}>
        {/* Lodret rail. */}
        <span
          aria-hidden
          className="absolute"
          style={{ left: 5, top: 8, bottom: 14, width: 2, background: 'rgba(36,48,31,0.12)' }}
        />
        {historik.map((m) => {
          const erNu = m.maaned === nuMaaned
          return (
            <li key={m.maaned} className="relative" style={{ paddingBottom: 20 }}>
              {/* Måneds-prik på rail'en. */}
              <span
                aria-hidden
                className="absolute rounded-full"
                style={{
                  left: -26 + 5 - 4,
                  top: 10,
                  width: erNu ? 12 : 9,
                  height: erNu ? 12 : 9,
                  background: erNu ? '#617345' : 'var(--background)',
                  border: erNu ? '2px solid #617345' : '2px solid rgba(36,48,31,0.28)',
                  boxShadow: erNu ? '0 0 0 4px rgba(97,115,69,0.14)' : 'none',
                }}
              />
              <p
                style={{
                  fontFamily: serif,
                  fontWeight: 600,
                  fontSize: 'clamp(24px, 6.4vw, 30px)',
                  lineHeight: 1.0,
                  letterSpacing: '0.004em',
                  color: erNu ? '#24301F' : 'rgba(36,48,31,0.58)',
                  margin: 0,
                }}
              >
                {m.maaned}
              </p>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: sans,
                  fontSize: 14.5,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: erNu ? 'rgba(36,48,31,0.74)' : 'rgba(36,48,31,0.5)',
                  margin: '6px 0 0',
                }}
              >
                {m.historie}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
