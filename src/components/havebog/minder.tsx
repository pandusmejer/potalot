import type { Minde } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  minder: Minde[]
}

/**
 * Kapitel 4: "Minder" — kuraterede højdepunkter (V7, havebog.md V3).
 *
 * Kapitel-tempo: ASYMMETRISK HØJRE. Efter tre venstre/foto/centreret-
 * kapitler skifter bogen side — hele blokken står højrestillet med
 * en tynd kant som spejlvender Kapitel 3's gamle marginlinje.
 *
 * Indholdet er KURATERET: Potalot vælger sæsonens førster (første
 * høst, første knop, første såning) — ikke alle logs, ikke et galleri.
 * Det er emotionelt indhold. Det første (nyeste) minde er størst.
 *
 * Ingen polaroider, ingen tape (kitsch-forbuddet) — ren typografi.
 * Stilhed: ingen minder endnu → kapitlet udelades helt. Luft er
 * bedre end et tomt løfte.
 */
export function Minder({ minder }: Props) {
  if (minder.length === 0) return null

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        textAlign: 'right',
      }}
    >
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
          marginBottom: 22,
        }}
      >
        Minder
      </p>

      {/* V8 (luft-balancen): bredere blok og mere luft INDE i
          kapitlet — minderne må ikke stå klemt i et hav af beige.
          Asymmetrien bevares; det er bredden der gav klemthed. */}
      <div
        style={{
          width: 'min(94%, 460px)',
          borderRight: '1px solid rgba(36,48,31,0.16)',
          paddingRight: 24,
        }}
        className="space-y-10"
      >
        {minder.map((m, i) => (
          <div key={`${m.titel}-${m.dato}`}>
            <p
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'rgba(36,48,31,0.45)',
                margin: 0,
              }}
            >
              {m.dato}
            </p>
            <p
              style={{
                fontFamily: serif,
                fontWeight: 500,
                // Det nyeste minde bærer kapitlet — en tydelig tand større.
                fontSize: i === 0 ? 'clamp(26px, 5.4vw, 34px)' : 'clamp(20px, 4vw, 25px)',
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                color: '#24301F',
                margin: 0,
                marginTop: 6,
              }}
            >
              {m.titel}
            </p>
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(15px, 3vw, 18px)',
                lineHeight: 1.4,
                color: 'rgba(36,48,31,0.62)',
                margin: 0,
                marginTop: 4,
              }}
            >
              {m.detalje}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
