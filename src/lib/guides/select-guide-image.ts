export type MacroImageRole =
  | 'atmosphere'
  | 'detail'
  | 'structure'
  | 'flower'
  | 'fruit'
  | 'leaf'
  | 'seed'

export type MacroFocalPoint = 'center' | 'top' | 'bottom' | 'left' | 'right'

export type MacroImage = {
  src: string
  alt: string
  role?: MacroImageRole
  focalPoint?: MacroFocalPoint
}

export type GuideImages = {
  hero?: string
  seedCard?: string
  macro?: MacroImage[]
}

export type CropProfileName =
  | 'soft-left'
  | 'soft-right'
  | 'center-zoom'
  | 'top-band'
  | 'detail-close'

export type CropProfile = {
  objectPosition: string
  scale: number
  rotation: string
}

export type SelectedGuideImage = MacroImage & {
  objectPosition: string
  cropProfile: CropProfileName
  scale: number
  rotation: string
}

export const cropProfiles: Record<CropProfileName, CropProfile> = {
  'soft-left': {
    objectPosition: '35% 50%',
    scale: 1.08,
    rotation: '-1deg',
  },
  'soft-right': {
    objectPosition: '65% 50%',
    scale: 1.08,
    rotation: '1deg',
  },
  'center-zoom': {
    objectPosition: '50% 50%',
    scale: 1.18,
    rotation: '0deg',
  },
  'top-band': {
    objectPosition: '50% 28%',
    scale: 1.12,
    rotation: '0deg',
  },
  'detail-close': {
    objectPosition: '45% 55%',
    scale: 1.28,
    rotation: '-1deg',
  },
}

const cropOrder: CropProfileName[] = [
  'soft-left',
  'soft-right',
  'center-zoom',
  'top-band',
  'detail-close',
]

const focalPosition: Record<MacroFocalPoint, string> = {
  center: '50% 50%',
  top: '50% 28%',
  bottom: '50% 72%',
  left: '35% 50%',
  right: '65% 50%',
}

type SelectGuideImageArgs = {
  images?: MacroImage[] | null
  preferredRoles?: MacroImageRole[]
  avoidSrcs?: ReadonlySet<string>
  fallbackIndex?: number
  seed?: string
  cropProfile?: CropProfileName
}

export function selectGuideImage({
  images,
  preferredRoles = [],
  avoidSrcs,
  fallbackIndex = 0,
  seed = '',
  cropProfile,
}: SelectGuideImageArgs): SelectedGuideImage | null {
  if (!images || images.length === 0) return null

  const usable = images.filter(image => image.src)
  if (usable.length === 0) return null

  const roleMatches = preferredRoles.length
    ? usable.filter(image => image.role && preferredRoles.includes(image.role))
    : []

  const preferred = roleMatches.length > 0 ? roleMatches : usable
  const notAvoided = preferred.filter(image => !avoidSrcs?.has(image.src))
  const pool = notAvoided.length > 0 ? notAvoided : preferred

  const index = deterministicIndex(`${seed}:${fallbackIndex}`, pool.length)
  const image = pool[index]
  const profileName =
    cropProfile ?? cropOrder[deterministicIndex(`${seed}:${image.src}:crop`, cropOrder.length)]
  const profile = cropProfiles[profileName]

  return {
    ...image,
    objectPosition: image.focalPoint
      ? focalPosition[image.focalPoint]
      : profile.objectPosition,
    cropProfile: profileName,
    scale: profile.scale,
    rotation: profile.rotation,
  }
}

function deterministicIndex(seed: string, length: number) {
  if (length <= 1) return 0

  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash % length
}
