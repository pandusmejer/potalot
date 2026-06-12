/**
 * Kapitel 1: "I dag i haven" — bogens åbningskapitel (V9-navn;
 * V7-tempo, V8-indhold).
 *
 * Kapitel-tempo: tekst venstre, STOR typografi, meget luft.
 * ÉN indsigt. Ikke fem. Og helst en OPDAGELSE (V8) — indsigterne
 * udvikler sig gennem fire niveauer: 0 generel havevisdom →
 * 1 frøbank → 2 aktive planter → 3 historik. Ikke "vidste du at",
 * ikke "fun fact", ikke "tip" — det er internet anno 2012.
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
  // V10 (én daglig overraskelse): indsigten roterer dag for dag
  // gennem puljen i stedet for at stå fast på den første linje.
  // "Hvis jeg åbner siden fem dage i træk, hvad har ændret sig?"
  // Deterministisk på dagsnummer — ingen reload-lotteri.
  const now = new Date()
  const dagNr = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const indsigt = saetninger.length > 0
    ? saetninger[dagNr % saetninger.length]
    : undefined
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
        I dag i haven
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
