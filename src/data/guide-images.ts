import type { GuideImages } from '@/lib/guides/select-guide-image'

export const GUIDE_IMAGES_BY_ID: Record<string, GuideImages> = {
  'tomat-san-marzano': {
    hero: '/images/plantekort/tomat-san-marzano.jpg',
    seedCard: '/images/frokort/tomat-san-marzano.png',
    macro: [
      {
        src: '/images/makro/tomat-san-marzano/dug.jpg',
        alt: 'Makro af dug på San Marzano tomat',
        role: 'atmosphere',
        focalPoint: 'center',
      },
      {
        src: '/images/makro/tomat-san-marzano/klase.jpg',
        alt: 'Makro af San Marzano tomatklase',
        role: 'structure',
        focalPoint: 'left',
      },
      {
        src: '/images/makro/tomat-san-marzano/single.jpg',
        alt: 'Makro af moden San Marzano tomat',
        role: 'fruit',
        focalPoint: 'center',
      },
      {
        src: '/images/makro/tomat-san-marzano/frugtknop.jpg',
        alt: 'Makro af ung San Marzano frugtknop',
        role: 'detail',
        focalPoint: 'top',
      },
      {
        src: '/images/makro/tomat-san-marzano/bladdel.jpg',
        alt: 'Makro af San Marzano bladstruktur',
        role: 'leaf',
        focalPoint: 'right',
      },
      {
        src: '/images/makro/tomat-san-marzano/haar.jpg',
        alt: 'Makro af fine hår på tomatplante',
        role: 'detail',
        focalPoint: 'center',
      },
    ],
  },
  'demo-guide-tomat-sm': {
    hero: '/images/plantekort/tomat-san-marzano.jpg',
    seedCard: '/images/frokort/tomat-san-marzano.png',
    macro: [
      {
        src: '/images/makro/tomat-san-marzano/dug.jpg',
        alt: 'Makro af dug på San Marzano tomat',
        role: 'atmosphere',
        focalPoint: 'center',
      },
      {
        src: '/images/makro/tomat-san-marzano/klase.jpg',
        alt: 'Makro af San Marzano tomatklase',
        role: 'structure',
        focalPoint: 'left',
      },
      {
        src: '/images/makro/tomat-san-marzano/single.jpg',
        alt: 'Makro af moden San Marzano tomat',
        role: 'fruit',
        focalPoint: 'center',
      },
      {
        src: '/images/makro/tomat-san-marzano/bladdel.jpg',
        alt: 'Makro af San Marzano bladstruktur',
        role: 'leaf',
        focalPoint: 'right',
      },
    ],
  },
}

export function getGuideImages(guideId: string): GuideImages | null {
  return GUIDE_IMAGES_BY_ID[guideId] ?? null
}
