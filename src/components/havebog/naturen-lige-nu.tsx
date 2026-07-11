import type { NaturFakta } from '@/data/havebog-demo'

/**
 * "I haven lige nu" — V3.5 (Anna's magasin-typografi-feedback).
 *
 * Tre lige-store linjer er erstattet med ÉT STORT TAL + ÉN
 * EDITORIAL SÆTNING. Hierarki gennem størrelse, ikke gennem
 * farver, bokse eller badges.
 *
 * Anna: "Magasiner vælger én ting og hvisker resten. Det er
 * derfor de føles redaktionelle."
 *
 * Tre tekstniveauer i denne sektion:
 *   Niveau 1 (sjælden):   Cormorant 96-112px — det store tal
 *   Niveau 2 (statement): Cormorant 24-30px  — editorial sætning
 *   Niveau 3 (kicker):    Manrope 10.5px caps — sektion-label
 *
 * Sektionen er bevidst sparsom. Den ene mulige observation, vi
 * vælger at vise, læses på under et sekund — og forklares i én
 * sætning. Sammen med foto-prøven til højre danner det et
 * magasin-opslag frem for en data-rapport.
 */

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  fakta: NaturFakta
  /** Sti til lille makrofoto-prøve. Falder tilbage til chili/blad-dug.jpg. */
  herbariumPhoto?: string
}

export function NaturenLigeNu({
  fakta,
  herbariumPhoto = '/images/makro/chili/blad-dug.jpg',
}: Props) {
  return (
    <section className="relative" style={{ paddingBlock: '12px 8px', minHeight: 200 }}>
      {/* Foto-prøve højre side — herbarium-prøve fastgjort med tape */}
      <HerbariumProeve
        src={herbariumPhoto}
        className="absolute right-1 top-2 sm:right-3"
      />

      {/* Indhold — venstre del af sektionen. paddingRight giver
          foto-prøven plads. */}
      <div style={{ paddingRight: 96, maxWidth: 380 }}>
        <p
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.50)',
            margin: 0,
            marginBottom: 14,
          }}
        >
          Lige nu
        </p>

        {/* Det store tal — V3.7 (Annas præcise spec).
            font-size: clamp(72px, 20cqw, 124px) — fra max 112px → 124px.
            line-height: 0.82 — strammere så tallet "vejer" mere visuelt. */}
        <p
          style={{
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 'clamp(72px, 20cqw, 124px)',
            lineHeight: 0.82,
            letterSpacing: '-0.03em',
            color: '#24301F',
            margin: 0,
          }}
        >
          {fakta.value}
        </p>

        {/* Editorial statement — V3.7 (Annas spec):
            max-width: 15ch — meget smal kolonne, tvinger naturlig wrapping
            line-height: 1.2 — stram, læser som magasin-pull-quote */}
        <p
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: 'clamp(18px, 3.4cqw, 24px)',
            lineHeight: 1.2,
            color: 'rgba(36,48,31,0.72)',
            margin: 0,
            marginTop: 14,
            maxWidth: '15ch',
          }}
        >
          {fakta.statement}
        </p>
      </div>
    </section>
  )
}

/**
 * Lille makrofoto-prøve — som en presset blad-prøve fastgjort i et
 * herbarium. Smal, høj, let roteret, med antydet papirtape ovenpå.
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#EEE5CF',
          boxShadow: '0 1px 2px rgba(48,38,18,0.08), 0 6px 14px rgba(48,38,18,0.10)',
        }}
      />
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
          border: '1px solid rgba(180,160,120,0.20)',
        }}
      />
    </div>
  )
}
