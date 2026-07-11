const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌿 SAMLING-PODIUM — editorial section header for "Min plantesamling".
 *
 * Anna (16/6 aften, retningsskift): "Min plantesamling" er en SAMLENDE
 * ramme — en introduktion/udstillingsvæg for alt det, brugeren har i gang.
 * Den skal have sit eget visuelle podium, men IKKE som endnu et kort
 * (ingen stor afrundet container, skygge, foto, CTA — så er vi tilbage i
 * "beige kasser for hele formuen"). Tænk herbarium-intro / arkivblad:
 * tone-i-tone-bånd, kicker + kapitelnummer, lodret accent-streg, stor
 * serif-titel, samlet meta, og en rolig divider-medaljon som overgang
 * ned til grupperne.
 *
 * 17/6: den romantiske bladillustration er erstattet af et diskret
 * tone-i-tone "samlingsindeks" (grid af små arkiv-/specimen-kort med
 * enkelte spirer) — det konnoterer kurateret samling, ikke vintage
 * botanisk brevpapir. Top- og bundkant er samme sand-tone, begge
 * kantstreger tyndere (1,4px); medaljonen overlapper båndets bundkant.
 */

/**
 * Diskret samlingsindeks (Anna 17/6: mere abstrakt end første forsøg —
 * større, lettere, mere beskåret, færre detaljer, "mønster" ikke "mini-UI").
 * Større herbarium-/specimen-kort, skubbet højre + beskåret, meget lav
 * opacitet. Blandede celler: nogle tomme, nogle med kun en label-linje,
 * et par med et delikat botanisk motiv (fern/sprig/blad).
 */
function SamlingsIndeks() {
  const W = 76
  const H = 100
  const GX = 92
  const GY = 116
  // Per-celle: blandet, så det læses som et samlingsindeks, ikke et grid
  // af identiske kort.
  const CELLS: Array<{ motif: 'fern' | 'sprig' | 'leaf' | null; label: boolean }> = [
    { motif: 'fern', label: true },
    { motif: null, label: true },
    { motif: 'sprig', label: true },
    { motif: 'leaf', label: true },
    { motif: 'sprig', label: true },
    { motif: null, label: false },
    { motif: null, label: true },
    { motif: 'leaf', label: true },
    { motif: null, label: false },
  ]

  function motifPaths(cx: number, cy: number, kind: 'fern' | 'sprig' | 'leaf'): string[] {
    if (kind === 'fern') {
      const hairs: string[] = []
      for (let i = 0; i < 5; i++) {
        const yy = cy + 16 - i * 9
        hairs.push(`M${cx} ${yy} L${cx - 8} ${yy - 5}`, `M${cx} ${yy} L${cx + 8} ${yy - 5}`)
      }
      return [`M${cx} ${cy + 20} C ${cx} ${cy + 4}, ${cx} ${cy - 10}, ${cx} ${cy - 22}`, ...hairs]
    }
    if (kind === 'sprig') {
      return [
        `M${cx} ${cy + 20} L${cx} ${cy - 20}`,
        `M${cx} ${cy - 12} C ${cx - 12} ${cy - 14}, ${cx - 11} ${cy - 26}, ${cx} ${cy - 20}`,
        `M${cx} ${cy} C ${cx + 12} ${cy - 2}, ${cx + 11} ${cy - 14}, ${cx} ${cy - 8}`,
        `M${cx} ${cy + 12} C ${cx - 12} ${cy + 10}, ${cx - 11} ${cy - 2}, ${cx} ${cy + 4}`,
      ]
    }
    return [
      `M${cx} ${cy + 20} C ${cx - 14} ${cy + 6}, ${cx - 14} ${cy - 14}, ${cx} ${cy - 22} C ${cx + 14} ${cy - 14}, ${cx + 14} ${cy + 6}, ${cx} ${cy + 20} Z`,
      `M${cx} ${cy + 16} L${cx} ${cy - 18}`,
    ]
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 260 348"
      className="pointer-events-none absolute"
      style={{ right: -54, top: '50%', transform: 'translateY(-50%) rotate(8deg)', transformOrigin: 'center', height: '158%', width: 'auto', opacity: 0.13 }}
      fill="none"
      stroke="#4B6138"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {CELLS.map((cell, i) => {
        const x = (i % 3) * GX
        const y = Math.floor(i / 3) * GY
        const cx = x + W / 2
        const cy = y + H / 2 - 6
        return (
          <g key={i}>
            <rect x={x} y={y} width={W} height={H} rx={9} />
            {cell.motif && motifPaths(cx, cy, cell.motif).map((d, j) => <path key={j} d={d} />)}
            {cell.label && <path d={`M${x + 14} ${y + H - 16} L${x + W - 18} ${y + H - 16}`} />}
          </g>
        )
      })}
    </svg>
  )
}

export function SamlingPodium({ planter, sorter }: { planter: number; sorter: number }) {
  const sand = 'rgba(184,154,74,0.5)'
  return (
    <div className="-mx-4">
      {/* Tone-i-tone podium-bånd. Ikke et kort — en redaktionel ramme.
          Sand top- og bundkant (1,4px); bundkanten ER sektionens bundlinje. */}
      <div
        className="relative"
        style={{
          // Varmere, mere sand/pergament + en anelse dybere end siden, så
          // podiet føles som sin egen redaktionelle flade (Anna 17/6) —
          // stadig ikke et card.
          background: 'linear-gradient(165deg, #EEE5CC 0%, #E5D8BA 100%)',
          borderTop: `1.4px solid ${sand}`,
        }}
      >
        {/* Diskret samlingsindeks-vandmærke — klippet til båndet, så
            medaljonen (sibling) ikke beskæres. */}
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <SamlingsIndeks />
        </div>

        <div className="relative px-5 pb-10 pt-8">
          {/* Lodret accent-streg til venstre for hele tekstblokken. */}
          <div style={{ borderLeft: `2px solid ${sand}`, paddingLeft: 18 }}>
            <p
              className="uppercase"
              style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.24em',
                color: 'rgba(36,48,31,0.5)',
                margin: 0,
              }}
            >
              Min samling
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'rgba(36,48,31,0.36)',
                margin: '4px 0 0',
              }}
            >
              01
            </p>
            <h2
              style={{
                fontFamily: serif,
                fontSize: 'clamp(32px, 9vw, 42px)',
                fontWeight: 600,
                lineHeight: 1.0,
                letterSpacing: '-0.01em',
                color: '#24301F',
                margin: '10px 0 0',
              }}
            >
              Min plantesamling
            </h2>
            <p
              style={{
                fontFamily: sans,
                fontSize: 15,
                fontWeight: 600,
                color: 'rgba(36,48,31,0.55)',
                margin: '10px 0 0',
              }}
            >
              {planter} {planter === 1 ? 'plante' : 'planter'} · {sorter} {sorter === 1 ? 'sort' : 'sorter'}
            </p>
          </div>
        </div>

        {/* Bundstreg i sand = sektionens bundkant. To segmenter med luft
            omkring medaljonen, så stregen ikke gennemskærer ikonet. */}
        <div aria-hidden className="absolute" style={{ left: 0, bottom: 0, height: 1.4, width: 'calc(50% - 35px)', background: sand }} />
        <div aria-hidden className="absolute" style={{ right: 0, bottom: 0, height: 1.4, width: 'calc(50% - 35px)', background: sand }} />

        {/* Medaljon — straddler bundkanten og overlapper det mørkere felt. */}
        <div
          className="absolute left-1/2 flex items-center justify-center rounded-full"
          style={{
            bottom: 0,
            transform: 'translate(-50%, 50%)',
            width: 46,
            height: 46,
            background: 'var(--background)',
            border: '1.5px solid rgba(184,154,74,0.65)',
          }}
        >
          {/* 2×2 samlings-grid (Anna 17/6) — konnoterer samling/overblik,
              ikke "ny vækst" som spiren. */}
          <svg width={19} height={19} viewBox="0 0 20 20" aria-hidden fill="#46562C">
            <rect x={1} y={1} width={8} height={8} rx={2.2} />
            <rect x={11} y={1} width={8} height={8} rx={2.2} />
            <rect x={1} y={11} width={8} height={8} rx={2.2} />
            <rect x={11} y={11} width={8} height={8} rx={2.2} />
          </svg>
        </div>
      </div>

      {/* Plads til medaljonens nederste halvdel + lidt luft før grupperne. */}
      <div style={{ height: 38 }} />
    </div>
  )
}
