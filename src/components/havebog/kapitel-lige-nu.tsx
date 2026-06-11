/**
 * Kapitel 1: "Lige nu" — bogens åbningskapitel (V5, havebog.md V2).
 *
 * Havebogen FORTÆLLER, den rapporterer ikke. Lobby-reglen:
 *   "14°"                   → "Jorden er nu varm nok til tomater og chili."
 *   "1 klar til udplantning" → "Dine første planter er klar til at komme udenfor."
 *   "8 aktive sorter"        → vises slet ikke (det er Planter-data)
 *
 * Ren prosa i Cormorant — ingen tal-typografi, ingen big numbers,
 * ingen kort. Erstatter både den gamle NaturenLigeNu (14°-tallet)
 * og IDinHave-stakken (tal-lobbyen).
 *
 * Stilhed ved datahuller: ingen sætninger → sektionen udelades helt.
 */

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  /** 1-3 fortællende sætninger om havens øjeblik */
  saetninger: string[]
}

export function KapitelLigeNu({ saetninger }: Props) {
  if (saetninger.length === 0) return null

  return (
    <section style={{ paddingTop: 4 }}>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
          marginBottom: 14,
        }}
      >
        Lige nu
      </p>

      <div className="space-y-3">
        {saetninger.map((s, i) => (
          <p
            key={i}
            style={{
              fontFamily: serif,
              fontWeight: 400,
              // Første sætning bærer kapitlet — en tand større.
              fontSize: i === 0 ? 'clamp(22px, 4.6vw, 28px)' : 'clamp(18px, 3.6vw, 22px)',
              lineHeight: 1.3,
              letterSpacing: '-0.005em',
              color: i === 0 ? '#24301F' : 'rgba(36,48,31,0.72)',
              margin: 0,
              maxWidth: '24ch',
            }}
          >
            {s}
          </p>
        ))}
      </div>
    </section>
  )
}
