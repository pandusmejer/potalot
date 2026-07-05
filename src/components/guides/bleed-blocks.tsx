import type { CSSProperties } from 'react'

const pageBackground = '#EAE6D8'
const ink = '#2D2A24'
const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'

type BleedTextTone = 'dark' | 'light'

interface BleedBlockProps {
  imageSrc: string
  alt: string
  label?: string
  description?: string
}

interface BleedBandProps extends BleedBlockProps {
  contained?: boolean
}

function BleedText({
  label,
  description,
  tone = 'dark',
  className,
  style,
}: {
  label?: string
  description?: string
  tone?: BleedTextTone
  className: string
  style?: CSSProperties
}) {
  if (!label && !description) {
    return null
  }

  const color = tone === 'light' ? '#F4F0E5' : ink

  return (
    <div
      className={`pointer-events-none absolute z-20 ${className}`}
      style={{ color, fontFamily: sans, ...style }}
    >
      {label && (
        <p
          className="m-0"
          style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          {label}
        </p>
      )}
      {description && (
        <p
          className="m-0 mt-0.5"
          style={{
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.35,
          }}
        >
          {description}
        </p>
      )}
    </div>
  )
}

function BleedImage({ imageSrc, alt }: Pick<BleedBlockProps, 'imageSrc' | 'alt'>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageSrc} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
  )
}

export function BleedFromLeft({ imageSrc, alt, label, description }: BleedBlockProps) {
  return (
    <figure
      className="relative my-5 mx-6 h-[176px] w-[calc(100vw-48px)] overflow-hidden rounded-[28px]"
      style={{ backgroundColor: pageBackground }}
    >
      <BleedImage imageSrc={imageSrc} alt={alt} />
      <div
        aria-hidden
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(234,230,216,0) 0%, rgba(234,230,216,0) 42%, rgba(234,230,216,0.65) 72%, #EAE6D8 100%)',
        }}
      />
      <BleedText
        label={label}
        description={description}
        className="bottom-6 right-6 max-w-[130px]"
      />
    </figure>
  )
}

export function BleedFromRight({ imageSrc, alt, label, description }: BleedBlockProps) {
  return (
    <figure
      className="relative my-5 mx-6 h-[176px] w-[calc(100vw-48px)] overflow-hidden rounded-[28px]"
      style={{ backgroundColor: pageBackground }}
    >
      <BleedImage imageSrc={imageSrc} alt={alt} />
      <div
        aria-hidden
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to left, rgba(234,230,216,0) 0%, rgba(234,230,216,0) 42%, rgba(234,230,216,0.65) 72%, #EAE6D8 100%)',
        }}
      />
      <BleedText
        label={label}
        description={description}
        tone="light"
        className="bottom-6 left-6 max-w-[150px]"
      />
    </figure>
  )
}

export function BleedBand({
  imageSrc,
  alt,
  label,
  description,
  contained = false,
}: BleedBandProps) {
  return (
    <figure
      className={[
        'relative my-6 h-[236px] overflow-hidden rounded-[28px]',
        contained
          ? 'mx-6 h-[208px] w-[calc(100vw-48px)]'
          : 'left-1/2 w-screen -translate-x-1/2',
      ].join(' ')}
      style={{ backgroundColor: pageBackground }}
    >
      <BleedImage imageSrc={imageSrc} alt={alt} />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-[42%]"
        style={{
          background:
            'linear-gradient(to bottom, #EAE6D8 0%, rgba(234,230,216,0.85) 10%, rgba(234,230,216,0) 28%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 h-[48%]"
        style={{
          background:
            'linear-gradient(to top, #EAE6D8 0%, rgba(234,230,216,0.85) 12%, rgba(234,230,216,0) 34%)',
        }}
      />
      <BleedText
        label={label}
        description={description}
        className="bottom-16 left-8 max-w-[190px]"
      />
    </figure>
  )
}

/**
 * GuideEvidenceImage — inline makro-BEVIS inde i et guideafsnit.
 *
 * Afløser de fade-tunge Bleed*-blokke i den levende artikel. Makrofotoet skal
 * være et konkret plantebevis (blad, stængel, frugt, fugt, struktur), ikke en
 * stemningspause mellem kapitler:
 *   - INTET top/bund-fade der æder teksturen — kun blød radius + hårfin border.
 *   - Kompakt højde (16:9) så det sparer scroll på mobil.
 *   - Sidder tæt under afsnittet det dokumenterer (wrappes sammen med kapitlet
 *     i saadan-dyrker-du, så sektions-rytmen kun adskiller kapitler).
 *
 * (Bleed*-komponenterne beholdes til QA/demo-sider.)
 */
export type EvidenceVariant = 'wide' | 'square' | 'tall'

/**
 * Formvalg pr. afsnit bryder den lineære "tekst → fuldbredde-billede"-rytme:
 *   - wide   = fuld bredde 16:9 (default, roligt bånd)
 *   - square = ~78% bredde 1:1, forskudt til en side (inline editorial insert)
 *   - tall   = ~62% bredde 3:4, forskudt (viser vækstform/plantearkitektur)
 * Forskydningen (align) veksler pr. billede, så to på hinanden følgende
 * bevisbilleder ikke lander ens.
 */
export function GuideEvidenceImage({
  imageSrc,
  alt,
  caption,
  variant = 'wide',
  align = 'right',
  float,
}: {
  imageSrc: string
  alt: string
  caption?: string
  variant?: EvidenceVariant
  align?: 'left' | 'right'
  /** Når sat: figuren flyder, og brødteksten ombrydes omkring den. */
  float?: 'left' | 'right'
}) {
  const aspect =
    variant === 'square' ? '1 / 1' : variant === 'tall' ? '3 / 4' : '16 / 9'

  // Float-tilstand: ægte tekst-ombrydning. Figuren tages ud af flow og
  // brødteksten løber rundt om den (som et magasin-opslag). Bruges til de
  // smalle former (kvadratisk/høj); brede billeder står som fuldbredde-blok.
  if (float) {
    const width = variant === 'tall' ? '44%' : '48%'
    // Mindre luft mod den ombrydende tekst (tekst-siden) så teksten kommer
    // tættere på billedet; behold lidt luft under.
    const margin =
      float === 'right' ? '3px 0 10px 11px' : '3px 11px 10px 0'
    return (
      <figure
        className="overflow-hidden rounded-[16px]"
        style={{
          float,
          width,
          margin,
          aspectRatio: aspect,
          border: '1px solid rgba(45,42,36,0.10)',
          backgroundColor: pageBackground,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={alt} className="h-full w-full object-cover" />
      </figure>
    )
  }

  const shape: CSSProperties =
    variant === 'square'
      ? { aspectRatio: '1 / 1', width: '78%' }
      : variant === 'tall'
        ? { aspectRatio: '3 / 4', width: '62%' }
        : { aspectRatio: '16 / 9', width: '100%' }
  // Forskyd smalle former til en side; fuld bredde står naturligt.
  const offset: CSSProperties =
    variant === 'wide'
      ? {}
      : align === 'left'
        ? { marginRight: 'auto' }
        : { marginLeft: 'auto' }

  return (
    <figure style={{ margin: '10px 0 0' }}>
      <div
        className="overflow-hidden rounded-[18px]"
        style={{
          ...shape,
          ...offset,
          border: '1px solid rgba(45,42,36,0.10)',
          backgroundColor: pageBackground,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={alt} className="h-full w-full object-cover" />
      </div>
      {caption && (
        <figcaption
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(36,48,31,0.5)',
            margin: '6px 0 0',
            textAlign: variant !== 'wide' && align === 'right' ? 'right' : 'left',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
