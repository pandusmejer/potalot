/**
 * "Naturen lige nu" — V3.1 (juni 2026, Anna's herbarium-feedback).
 *
 * V3.0 brugte SVG-stregillustration højre side. Den læste som
 * "UI-illustration fra Figma" frem for "herbarium-prøve fra notesbog".
 * V3.1 erstatter den med en LILLE makrofoto-prøve — en beskåret
 * smal flade af et ægte makro (blad-dug), let roteret, holdt i
 * højre side med en antydet papirtape.
 *
 * IKKE et card. IKKE en boks. IKKE en border. Tre observationer
 * i kolonne, hver med et lille emoji-ikon. Til højre ligger
 * foto-prøven som hovedobjektet i sektionen.
 *
 * Anti-regel V3 håndhævet: hver sektion skal have ét visuelt
 * hovedobjekt. For NaturenLigeNu er hovedobjektet ikke teksten —
 * det er den lille foto-prøve.
 */

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Observation {
  symbol: string         // emoji
  text: string
}

interface Props {
  observations: Observation[]
  /** Sti til lille makrofoto-prøve. Falder tilbage til chili/blad-dug.jpg. */
  herbariumPhoto?: string
}

export function NaturenLigeNu({
  observations,
  herbariumPhoto = '/images/makro/chili/blad-dug.jpg',
}: Props) {
  return (
    <section className="relative" style={{ paddingBlock: '8px 8px', minHeight: 160 }}>
      {/* Foto-prøve højre side — som en presset blad-prøve fastgjort
          i et herbarium. Let rotation, smal kasse, papirtape ovenpå.
          IKKE midt på sektionen; sidder i højre side hvor den ikke
          forstyrrer læseflowet men giver øjet et objekt at lande på. */}
      <HerbariumProeve
        src={herbariumPhoto}
        className="absolute right-1 top-1 sm:right-3"
      />

      {/* Observations-liste fylder venstre 2/3 af sektionen.
          paddingRight giver foto-prøven plads til at trække vejret. */}
      <div className="space-y-3" style={{ paddingRight: 88, maxWidth: 360 }}>
        <p
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.50)',
            margin: 0,
          }}
        >
          Naturen lige nu
        </p>

        <ul className="space-y-2.5" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {observations.map((obs, i) => (
            <li
              key={i}
              className="flex items-start gap-3"
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 'clamp(17px, 2.8vw, 20px)',
                lineHeight: 1.45,
                color: 'rgba(36,48,31,0.78)',
                margin: 0,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 22,
                  fontSize: 17,
                  lineHeight: 1.45,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {obs.symbol}
              </span>
              <span>{obs.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * Lille makrofoto-prøve — som en presset blad-prøve fastgjort i et
 * herbarium. Smal, høj, let roteret, med antydet papirtape ovenpå.
 *
 * Specs:
 *   - 76×130 px (smal vertikal flade)
 *   - rotate(2.5deg) — den uregelmæssighed der signalerer "håndlavet"
 *   - Mat papirfarve rundt om fotoet (lille kant)
 *   - Tape: lille mørkere-creme rektangel øverst, tilt(-3deg)
 *
 * Visuelt: når du squinter, ser du IKKE en SVG. Du ser en lille
 * ægte prøve fastsat på siden.
 */
function HerbariumProeve({
  src,
  className,
}: {
  src: string
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        width: 78,
        height: 134,
        transform: 'rotate(2.2deg)',
        pointerEvents: 'none',
      }}
    >
      {/* Papir-baggrund — lidt bredere end fotoet, så der er en
          synlig matkant ligesom på en presset prøve fastgjort på
          herbarium-karton. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#EEE5CF',
          boxShadow: '0 1px 2px rgba(48,38,18,0.08), 0 6px 14px rgba(48,38,18,0.10)',
        }}
      />
      {/* Selve fotoet — beskåret indenfor papir-kanten (4px inset) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          position: 'absolute',
          inset: 4,
          width: 'calc(100% - 8px)',
          height: 'calc(100% - 8px)',
          objectFit: 'cover',
          filter: 'saturate(0.85) contrast(0.95)',
        }}
      />
      {/* Tape øverst — lille creme-strimmel med modsat rotation
          så det ser ud som om papiret er fastgjort der. */}
      <div
        style={{
          position: 'absolute',
          top: -6,
          left: '50%',
          width: 38,
          height: 12,
          background: 'rgba(245,236,210,0.78)',
          transform: 'translateX(-50%) rotate(-4deg)',
          boxShadow: '0 1px 2px rgba(48,38,18,0.10)',
          // Subtilt mat-look — som papirtape, ikke som plastik.
          border: '1px solid rgba(180,160,120,0.20)',
        }}
      />
    </div>
  )
}
