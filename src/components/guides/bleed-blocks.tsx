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
export function GuideEvidenceImage({
  imageSrc,
  alt,
  caption,
}: {
  imageSrc: string
  alt: string
  caption?: string
}) {
  return (
    <figure style={{ margin: '10px 0 0' }}>
      <div
        className="overflow-hidden rounded-[18px]"
        style={{
          aspectRatio: '16 / 9',
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
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
