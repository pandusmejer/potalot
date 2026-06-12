import type { Vendepunkt } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  vendepunkter: Vendepunkt[]
}

/**
 * Kapitel 3: "Sæsonens vendepunkter" (V8 — afløser måneds-krøniken).
 *
 * Havebogens VIGTIGSTE kapitel. Mennesker husker ikke deres have
 * som marts/april/maj — de husker begivenheder: første høst, første
 * blomst, ugen det regnede. Historien organiseres derfor omkring
 * vendepunkter:
 *
 *        SÆSONEN BEGYNDTE
 *    Tomaterne blev sået 18. marts.
 *             │
 *        VÆKSTEN TOG FART
 *    Chilierne fik deres første
 *      rigtige blade.
 *             │
 *           ...
 *
 * Komposition: V7-tempoet (centreret, vertikal, stor afstand)
 * beholdes — men V8's anti-dødheds-regel brydes ind: blokkene må
 * ikke have ens vægt. Det NYESTE vendepunkt er størst og mørkest
 * (det er dér, sæsonen ER), de tidligere træder gradvist tilbage —
 * sådan falmer minder også.
 *
 * Ingen emojis (Annas mockup havde 🌱🥬 som retning, ikke som krav):
 * i Cormorant-editorial ville de læse som chat, ikke som bog.
 * Titlerne bærer betydningen typografisk.
 *
 * Stilhed: ingen vendepunkter endnu → kapitlet udelades.
 */
export function Vendepunkter({ vendepunkter }: Props) {
  if (vendepunkter.length === 0) return null
  const sidste = vendepunkter.length - 1

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
          marginBottom: 32,
        }}
      >
        Sæsonens vendepunkter
      </p>

      <div>
        {vendepunkter.map((v, i) => {
          const erNyeste = i === sidste
          return (
            <div key={`${v.titel}-${i}`}>
              {i > 0 && (
                <div
                  aria-hidden
                  style={{
                    width: 1,
                    height: 36,
                    background: 'rgba(36,48,31,0.20)',
                    margin: '22px auto',
                  }}
                />
              )}
              <p
                className="uppercase"
                style={{
                  fontFamily: sans,
                  fontSize: erNyeste ? 12 : 11,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: erNyeste ? 'rgba(36,48,31,0.70)' : 'rgba(36,48,31,0.48)',
                  margin: 0,
                }}
              >
                {v.titel}
              </p>
              <p
                style={{
                  fontFamily: serif,
                  fontWeight: 400,
                  fontSize: erNyeste
                    ? 'clamp(23px, 4.8vw, 30px)'
                    : 'clamp(19px, 3.9vw, 24px)',
                  lineHeight: 1.28,
                  color: erNyeste ? '#24301F' : 'rgba(36,48,31,0.66)',
                  margin: '8px auto 0',
                  maxWidth: '22ch',
                }}
              >
                {v.detalje}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
