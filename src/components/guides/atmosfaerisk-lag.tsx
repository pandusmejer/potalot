/**
 * AtmosfaeriskLag — V4 Lag 2 helper.
 *
 * Wrapper-komponent der placerer et makrofoto som baggrundslag bag
 * sine children. Fotoet:
 *   - stikker ud over wrapper-kanten (negative inset)
 *   - har lav opacity + mix-blend-mode multiply (smelter med papir)
 *   - har radial mask så kanterne fades naturligt — INGEN synlig kant
 *   - kan IKKE klikkes (pointer-events-none)
 *
 * Brugt fx omkring faktabokse: makrofotoet ligger bag, faktaboksen
 * føles som et papirark lagt ovenpå fotografiet.
 *
 * V4-spec: Docs/design-system/guides.md sektion -1, Lag 2.
 *
 * NB: Hvis du tegner en rektangulær boks rundt om makrofotoet, så
 * har du bygget en BotanicalBleed igen. Lad være.
 */

import type { ReactNode, CSSProperties } from 'react'

interface Props {
  /** Path til makrofoto. Hvis null/undefined renderes children alene. */
  src: string | null | undefined
  /** Position af motivet — hvor i frame'n. */
  focal?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  /** 0-1, default 0.45. Højere = mere synlig. */
  opacity?: number
  /** Hvor langt motivet stikker ud over wrapper-kanten i px. */
  bleed?: number
  /** Subtil rotation for "ikke-grid-feel". */
  rotate?: number
  /** Subtitle text for skærmlæsere — hvad motivet viser */
  alt?: string
  children: ReactNode
}

export function AtmosfaeriskLag({
  src,
  focal = 'center',
  opacity = 0.45,
  bleed = 32,
  rotate = 0,
  alt = '',
  children,
}: Props) {
  // Hvis intet billede er angivet — render children alene.
  if (!src) return <>{children}</>

  const focalPosition: Record<string, string> = {
    center: 'center center',
    top: 'center top',
    bottom: 'center bottom',
    left: 'left center',
    right: 'right center',
  }

  const layerStyle: CSSProperties = {
    position: 'absolute',
    top: -bleed,
    right: -bleed,
    bottom: -bleed,
    left: -bleed,
    backgroundImage: `url(${src})`,
    backgroundSize: 'cover',
    backgroundPosition: focalPosition[focal],
    backgroundRepeat: 'no-repeat',
    opacity,
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
    maskImage:
      'radial-gradient(ellipse 75% 85% at 50% 50%, black 25%, transparent 82%)',
    WebkitMaskImage:
      'radial-gradient(ellipse 75% 85% at 50% 50%, black 25%, transparent 82%)',
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
    zIndex: 0,
  }

  return (
    <div className="relative">
      <div role="presentation" aria-label={alt} style={layerStyle} />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

/**
 * Vælger en atmosfærisk makro for en given guide-slug.
 *
 * Bruges af guide-detail-siden til at finde et passende motiv som
 * baggrund bag faktabokse og hero. Mapping er bevidst eksplicit —
 * automatisk slug→path mapping er for upålideligt mens
 * makrobiblioteket er ujævnt fyldt.
 *
 * Returnerer null hvis ingen makro er valgt for slug'en.
 */
export function pickAtmosfaeriskMakro(slug: string): string | null {
  const MAP: Record<string, string> = {
    // Species
    tomat: '/images/makro/tomat/kondens.jpg',
    agurk: '/images/makro/agurk/blad.jpg',
    chili: '/images/makro/chili/blad-dug.jpg',
    peberfrugt: '/images/makro/peberfrugt-california-wonder/indre.jpg',
    // dahlia, hvidlog — ingen makros endnu, returnerer null

    // Varieties
    'tomat-san-marzano': '/images/makro/tomat-san-marzano/dug.jpg',
    'agurk-marketmore': '/images/makro/agurk/frugt-med-blomst.jpg',
    'chili-habanero-orange': '/images/makro/chili-habanero-orange/skin.jpg',
    'peberfrugt-california-wonder':
      '/images/makro/peberfrugt-california-wonder/indre.jpg',
    // peberfrugt-corno-di-toro-rosso — ingen makro endnu
    // dahlia-cafe-au-lait — ingen makro endnu
  }
  return MAP[slug] ?? null
}
