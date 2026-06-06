import type { GuideImages } from '@/lib/guides/select-guide-image'

/**
 * V4.1 — annoteret pr. rolle for at give selectGuideImage materiale
 * til VISUEL PROGRESSION på sortsguider.
 *
 * Princip:
 *   - 1-2 makros pr. guide med rolle 'atmosphere' (bag faktabokse,
 *     Vidste du, Potalot-tip)
 *   - Resten annoteret med ikke-atmosphere roller (structure /
 *     fruit / flower / leaf / seed / detail) — de tekniske
 *     sortsfotos der TILFØRER VIDEN inde i guiden
 *
 * Hvis en guide kun har atmosphere-roller, bliver sortsguiden
 * ensformig: "San Marzano ↓ San Marzano ↓ San Marzano". Det er den
 * fejl V4.1 låste regel C løser.
 *
 * Spec: Docs/design-system/guides.md sektion -2.A (de 3 lag) + -2.C
 * (visuel progression). Rolle-systemet: src/lib/guides/select-guide-image.ts.
 */
export const GUIDE_IMAGES_BY_ID: Record<string, GuideImages> = {
  // ── ARTSGUIDER ──────────────────────────────────────────────

  tomat: {
    hero: '/images/arts/tomat.jpg',
    macro: [
      { src: '/images/makro/tomat/blad-lys.jpg', alt: 'Tomatblad mod modlys', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/tomat/kondens.jpg', alt: 'Kondens på tomat', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/tomat/blad.jpg', alt: 'Tomatblad i nærbillede', role: 'leaf', focalPoint: 'left' },
      { src: '/images/makro/tomat/blomst.jpg', alt: 'Tomatblomst i fuld udfoldelse', role: 'flower', focalPoint: 'center' },
      { src: '/images/makro/tomat/blomster.jpg', alt: 'Flere tomatblomster på klase', role: 'flower', focalPoint: 'right' },
      { src: '/images/makro/tomat/top-haar.jpg', alt: 'Fine hår på tomatplantens top', role: 'detail', focalPoint: 'top' },
    ],
  },

  agurk: {
    hero: '/images/arts/agurk.jpg',
    macro: [
      { src: '/images/makro/agurk/blad.jpg', alt: 'Agurkeblad i nærbillede', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/agurk/blade.jpg', alt: 'Flere agurkeblade', role: 'leaf', focalPoint: 'center' },
      { src: '/images/makro/agurk/frugt.jpg', alt: 'Agurkefrugt på planten', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/agurk/frugt-med-blomst.jpg', alt: 'Agurkefrugt med vissen blomst', role: 'fruit', focalPoint: 'left' },
      { src: '/images/makro/agurk/slyngtraad-haar.jpg', alt: 'Slyngtråd på agurkeplante', role: 'structure', focalPoint: 'top' },
      { src: '/images/makro/agurk/udfoldet-blomst.jpg', alt: 'Udfoldet agurkeblomst', role: 'flower', focalPoint: 'center' },
    ],
  },

  chili: {
    hero: '/images/arts/chili.jpg',
    macro: [
      { src: '/images/makro/chili/blad-dug.jpg', alt: 'Dug på chiliblad', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/chili/blad.jpg', alt: 'Chiliblad i nærbillede', role: 'leaf', focalPoint: 'left' },
      { src: '/images/makro/chili/blomst.jpg', alt: 'Chiliblomst åben', role: 'flower', focalPoint: 'center' },
      { src: '/images/makro/chili/blomsterknop.jpg', alt: 'Chiliblomsterknop på spring', role: 'flower', focalPoint: 'top' },
      { src: '/images/makro/chili/knop.jpg', alt: 'Knop på chiliplante', role: 'structure', focalPoint: 'center' },
      { src: '/images/makro/chili/knop-2.jpg', alt: 'Knop på chiliplante, anden vinkel', role: 'structure', focalPoint: 'right' },
      { src: '/images/makro/chili/froe-1.jpg', alt: 'Chilifrø, fotograferet', role: 'seed', focalPoint: 'center' },
      { src: '/images/makro/chili/froe-2.jpg', alt: 'Chilifrø, anden komposition', role: 'seed', focalPoint: 'center' },
      { src: '/images/makro/chili/froe-3.jpg', alt: 'Chilifrø, tredje komposition', role: 'seed', focalPoint: 'center' },
    ],
  },

  // peberfrugt + dahlia: makro-mapperne er endnu tomme (V4.1 audit).
  // Tilføj entries her når makros lander, så selectGuideImage får
  // materiale.

  // ── SORTSGUIDER ─────────────────────────────────────────────

  'tomat-san-marzano': {
    hero: '/images/plantekort/tomat-san-marzano.jpg',
    seedCard: '/images/frokort/tomat-san-marzano.png',
    macro: [
      { src: '/images/makro/tomat-san-marzano/dug.jpg', alt: 'Dug på San Marzano tomat', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/blad-dug.jpg', alt: 'Dug på San Marzano-blad', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/klase.jpg', alt: 'Klase af San Marzano-frugter', role: 'structure', focalPoint: 'left' },
      { src: '/images/makro/tomat-san-marzano/y-led.jpg', alt: 'Forgreningspunkt på San Marzano-plante', role: 'structure', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/frugtknop.jpg', alt: 'Ung frugtknop på San Marzano', role: 'fruit', focalPoint: 'top' },
      { src: '/images/makro/tomat-san-marzano/single-umoden.jpg', alt: 'Én umoden San Marzano-frugt', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/umodne.jpg', alt: 'Flere umodne San Marzano-frugter', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/haar.jpg', alt: 'Fine hår på tomatplante', role: 'detail', focalPoint: 'center' },
    ],
  },

  'chili-habanero-orange': {
    hero: '/images/plantekort/chili-habanero-orange.jpg',
    seedCard: '/images/frokort/chili-habanero-orange.png',
    macro: [
      { src: '/images/makro/chili-habanero-orange/blad-dug.jpg', alt: 'Dug på Habanero-blad', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/skin.jpg', alt: 'Overflade på Habanero-frugt', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/blad.jpg', alt: 'Habanero-blad i nærbillede', role: 'leaf', focalPoint: 'left' },
      { src: '/images/makro/chili-habanero-orange/blomst-knop.jpg', alt: 'Habanero-blomsterknop', role: 'flower', focalPoint: 'top' },
      { src: '/images/makro/chili-habanero-orange/single.jpg', alt: 'Én moden Habanero', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/farver.jpg', alt: 'Habanero i forskellige modningsstadier', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/frugter.jpg', alt: 'Flere modne Habanero-frugter', role: 'fruit', focalPoint: 'right' },
      { src: '/images/makro/chili-habanero-orange/tvarsnit.jpg', alt: 'Tværsnit af Habanero', role: 'structure', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/tvarsnit-2.jpg', alt: 'Tværsnit af Habanero, anden vinkel', role: 'structure', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/y-stilk.jpg', alt: 'Y-formet stilk på Habanero', role: 'structure', focalPoint: 'top' },
      { src: '/images/makro/chili-habanero-orange/kerner.jpg', alt: 'Habanero-frø og frøkammer', role: 'seed', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/skiver.jpg', alt: 'Habanero i skiver', role: 'detail', focalPoint: 'center' },
    ],
  },

  'peberfrugt-corno-di-toro-rosso': {
    // Stub-entry: hero + seedCard er produceret, makros mangler endnu.
    // Når makros lander, udvid med rolle-annoterede entries.
    hero: '/images/plantekort/peberfrugt-corno-di-toro-rosso.jpg',
    seedCard: '/images/frokort/peberfrugt-corno-di-toro-rosso.png',
  },

  // agurk-marketmore, peberfrugt-california-wonder,
  // dahlia-cafe-au-lait: makros (og plantekort for California Wonder)
  // mangler endnu — V4.1 audit. Tilføj her når de lander.

  // ── DEMO (kompatibilitet med eksisterende demo-data) ───────

  'demo-guide-tomat-sm': {
    hero: '/images/plantekort/tomat-san-marzano.jpg',
    seedCard: '/images/frokort/tomat-san-marzano.png',
    macro: [
      { src: '/images/makro/tomat-san-marzano/dug.jpg', alt: 'Dug på San Marzano tomat', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/klase.jpg', alt: 'Klase af San Marzano-frugter', role: 'structure', focalPoint: 'left' },
      { src: '/images/makro/tomat-san-marzano/single-umoden.jpg', alt: 'Én umoden San Marzano-frugt', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/haar.jpg', alt: 'Fine hår på tomatplante', role: 'detail', focalPoint: 'center' },
    ],
  },
}

export function getGuideImages(guideId: string): GuideImages | null {
  return GUIDE_IMAGES_BY_ID[guideId] ?? null
}
