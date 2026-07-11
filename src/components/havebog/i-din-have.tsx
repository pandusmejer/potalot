/**
 * "I DIN HAVE" — Havebogens åbningstal (11. juni 2026, Annas mockup).
 *
 * Forskudt big-number-stak direkte under heroens bølge:
 *
 *   I DIN HAVE
 *
 *   8  aktive sorter
 *         3  klar til udplantning
 *   11
 *      arter rigere end sidste år
 *
 * Det er afledningsmotoren i Havebog-stemmen: TILSTANDE formuleret
 * som tal + label (grænsereglen — bydeform hører til Kalender).
 * Forskydningen er bevidst asymmetri (reference-opslagets princip:
 * tallene må ikke stå på række som et regnskab).
 *
 * Stilhed ved datahuller: rækker uden data udelades — aldrig "0 klar
 * til udplantning". Hele sektionen udelades hvis der ingen sorter er
 * (heroens "din første sæson" bærer så åbningen alene).
 */

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

export interface IDinHaveProps {
  /** Antal aktive sorter (heroStats.varieties) */
  aktiveSorter: number
  /** Antal planter klar til udplantning — null/0 skjuler rækken */
  klarTilUdplantning?: number | null
  /** År-til-år: hvor mange arter rigere end sidste sæson — null skjuler */
  arterRigere?: number | null
}

export function IDinHave({
  aktiveSorter,
  klarTilUdplantning,
  arterRigere,
}: IDinHaveProps) {
  if (aktiveSorter <= 0) return null

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
          marginBottom: 18,
        }}
      >
        I din have
      </p>

      {/* Række 1 — det store tal, venstre */}
      <div className="flex items-baseline" style={{ gap: 14 }}>
        <span
          style={{
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(64px, 16cqw, 88px)',
            lineHeight: 0.82,
            letterSpacing: '-0.025em',
            color: '#24301F',
          }}
        >
          {aktiveSorter}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 500,
            color: 'rgba(36,48,31,0.70)',
          }}
        >
          aktive sorter
        </span>
      </div>

      {/* Række 2 — forskudt mod højre */}
      {klarTilUdplantning != null && klarTilUdplantning > 0 && (
        <div
          className="flex items-baseline"
          style={{ gap: 12, marginTop: 10, marginLeft: '26%' }}
        >
          <span
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 'clamp(44px, 11cqw, 60px)',
              lineHeight: 0.82,
              letterSpacing: '-0.02em',
              color: '#24301F',
            }}
          >
            {klarTilUdplantning}
          </span>
          <span
            style={{
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(36,48,31,0.70)',
            }}
          >
            klar til udplantning
          </span>
        </div>
      )}

      {/* Række 3 — tilbage mod venstre, label under tallet */}
      {arterRigere != null && arterRigere > 0 && (
        <div style={{ marginTop: 12, marginLeft: '8%' }}>
          <span
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 'clamp(38px, 9.5cqw, 52px)',
              lineHeight: 0.82,
              letterSpacing: '-0.02em',
              color: '#24301F',
              display: 'block',
            }}
          >
            {arterRigere}
          </span>
          <span
            style={{
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(36,48,31,0.70)',
              display: 'block',
              marginTop: 4,
            }}
          >
            arter rigere end sidste år
          </span>
        </div>
      )}
    </section>
  )
}
