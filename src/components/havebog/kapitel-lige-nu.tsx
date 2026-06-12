/**
 * Kapitel 1: "Lige nu" — bogens åbningskapitel (V7, havebog.md V3).
 *
 * Kapitel-tempo: tekst venstre, STOR typografi, meget luft.
 * ÉN indsigt. Ikke fem. (V5 viste 1-3 sætninger — V7 strammer til én;
 * den vigtigste sætning bærer hele kapitlet alene.)
 *
 * Havebogen FORTÆLLER, den rapporterer ikke. Lobby-reglen:
 *   "14°"                    → "Jorden er nu varm nok til tomater og chili."
 *   "1 klar til udplantning" → "Dine første planter er klar til at komme udenfor."
 *   "8 aktive sorter"        → vises slet ikke (det er Planter-data)
 *
 * Ingen kort, ingen statistik, ingen billeder.
 * Stilhed ved datahuller: ingen sætning → kapitlet udelades helt.
 */

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  /** Fortællende sætninger om havens øjeblik — kun den første vises */
  saetninger: string[]
}

export function KapitelLigeNu({ saetninger }: Props) {
  const indsigt = saetninger[0]
  if (!indsigt) return null

  return (
    <section style={{ paddingBlock: '20px 12px' }}>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
          marginBottom: 20,
        }}
      >
        Lige nu
      </p>

      <p
        style={{
          fontFamily: serif,
          fontWeight: 400,
          fontSize: 'clamp(27px, 6.4vw, 40px)',
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          color: '#24301F',
          margin: 0,
          maxWidth: '17ch',
        }}
      >
        {indsigt}
      </p>
    </section>
  )
}
