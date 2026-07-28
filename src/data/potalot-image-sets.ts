import type { PotalotImageSet } from '@/lib/images/types'

/**
 * Canonical Potalot image sets — én sandhed pr. guideId.
 *
 * V4.2 — restruktureret pr. Annas image-pipeline-instruktion (juni 2026).
 * Tidligere `GuideImages` (hero + seedCard + macro) er erstattet af
 * `PotalotImageSet` med fire distinkte hero-roller:
 *
 *   - speciesHero  (arter)
 *   - varietyHero  (sorter — visning i sortsguider/sortskort)
 *   - plantCard    (sorter — visning på Mine planter/Kalender/vækst)
 *   - seedCard     (sorter — Primary acquisition card image for seeds,
 *                   bulbs, tubers, sets and similar propagation material.
 *                   Vises i Frøbank/frødetalje. ÉN rolle dækker alle
 *                   indkøbskort — ingen separat bulb-card.)
 *
 * For nu peger plantCard og varietyHero på samme fysiske fil
 * (typisk /images/plantekort/<slug>.jpg). Forskellen er ROLLEN.
 *
 * Princip for macro:
 *   - 1-2 makros pr. guide med rolle 'atmosphere' (bag faktabokse,
 *     Vidste du, Potalot-tip).
 *   - Resten annoteret med ikke-atmosphere roller (structure / fruit
 *     / flower / leaf / seed / detail) — de tekniske sortsfotos der
 *     tilfører viden inde i guiden.
 *
 *   Hvis en guide kun har atmosphere-roller, bliver sortsguiden
 *   ensformig: "San Marzano ↓ San Marzano ↓ San Marzano". Det er den
 *   fejl V4.1 låste regel C løser.
 *
 * Spec:
 *   - Docs/design-system/guides.md sektion -2.A (de 3 lag) + -2.C
 *     (visuel progression)
 *   - src/lib/images/types.ts (PotalotImageSet)
 *   - src/lib/images/resolve-potalot-image.ts (læser denne fil)
 */
export const POTALOT_IMAGE_SETS_BY_ID: Record<string, PotalotImageSet> = {
  // ── ARTSGUIDER ──────────────────────────────────────────────

  tomat: {
    speciesHero: { src: '/images/arts/tomat.jpg', alt: 'Tomatmark — artsfoto' },
    macro: [
      { src: '/images/makro/tomat/blad-draaber.jpg', alt: 'Regndråber på tomatblad', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/tomat/blad-y-stilk.jpg', alt: 'Tomatblad ved forgreningen', role: 'leaf', focalPoint: 'left' },
      { src: '/images/makro/tomat/blomst-closeup.jpg', alt: 'Tomatblomst helt tæt på', role: 'flower', focalPoint: 'center' },
      { src: '/images/makro/tomat/blomster.jpg', alt: 'Flere tomatblomster på klase', role: 'flower', focalPoint: 'right' },
      { src: '/images/makro/tomat/blomst-haar.jpg', alt: 'Fine hår på tomatblomst', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/tomat/krone-closeup.jpg', alt: 'Grøn krone på tomat', role: 'detail', focalPoint: 'top' },
      { src: '/images/makro/tomat/top-stilk.jpg', alt: 'Tomatplantens top og stængel', role: 'structure', focalPoint: 'top' },
      { src: '/images/makro/tomat/klase-modne.jpg', alt: 'Klase af modne tomater', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat/modne-baer.jpg', alt: 'Modne tomater i nærbillede', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat/et-baer.jpg', alt: 'Én tomat på planten', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat/umodne-baer.jpg', alt: 'Umodne, grønne tomater', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat/forspiring.jpg', alt: 'Tomat-forspiring', role: 'detail', focalPoint: 'center' },
    ],
  },

  agurk: {
    speciesHero: { src: '/images/arts/agurk.jpg', alt: 'Agurk — artsfoto' },
    macro: [
      { src: '/images/makro/agurk/blad.jpg', alt: 'Agurkeblad i nærbillede', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/agurk/frugt.jpg', alt: 'Agurkefrugt på planten', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/agurk/frugt-med-blomst.jpg', alt: 'Agurk med vissen blomst', role: 'fruit', focalPoint: 'left' },
      { src: '/images/makro/agurk/slyngtraad-haar.jpg', alt: 'Slyngtråd med fine hår', role: 'structure', focalPoint: 'top' },
      { src: '/images/makro/agurk/plante-jord.jpg', alt: 'Ung agurkeplante i jorden', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/agurk/spirer.jpg', alt: 'Agurke-spirer', role: 'detail', focalPoint: 'center' },
    ],
  },

  chili: {
    speciesHero: { src: '/images/arts/chili.jpg', alt: 'Chili — artsfoto' },
    macro: [
      { src: '/images/makro/chili/blad-dug.jpg', alt: 'Dug på chiliblad', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/chili/blade-supercloseup.jpg', alt: 'Chiliblade helt tæt på', role: 'leaf', focalPoint: 'center' },
      { src: '/images/makro/chili/blomst.jpg', alt: 'Åben chiliblomst', role: 'flower', focalPoint: 'center' },
      { src: '/images/makro/chili/knop.jpg', alt: 'Chili-blomsterknop på spring', role: 'flower', focalPoint: 'top' },
      { src: '/images/makro/chili/top.jpg', alt: 'Chiliplantens top', role: 'structure', focalPoint: 'top' },
      { src: '/images/makro/chili/toerrede-froe.jpg', alt: 'Tørrede chilifrø', role: 'seed', focalPoint: 'center' },
    ],
  },

  dahlia: {
    // V4.3 — arts-makros er nu klassificeret som "botaniske referencefotos"
    // (Annas vidensniveau-skel): vis dem hvis de findes, kræv dem ikke.
    // Dahlia-arts handler om vækstform + knold som genkendelsestegn —
    // disse 4 fotos viser præcis det.
    speciesHero: { src: '/images/arts/dahlia.jpg', alt: 'Dahlia — artsfoto' },
    macro: [
      { src: '/images/makro/dahlia/knold.jpg',            alt: 'Dahliaknold — overvintringsform',        role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/dahlia/knold-closeup.jpg',    alt: 'Dahliaknold helt tæt på',                role: 'structure',  focalPoint: 'center' },
      { src: '/images/makro/dahlia/knold-skud.jpg',       alt: 'Spirende skud på dahliaknold',           role: 'structure',  focalPoint: 'top' },
      { src: '/images/makro/dahlia/knold-skud-groen.jpg', alt: 'Grønt skud bryder frem på knolden',      role: 'detail',     focalPoint: 'center' },
    ],
  },

  // peberfrugt: makro-mappen er endnu tom (V4.1 audit).
  // Per V4.3 vidensniveau-skel er det IKKE et krav — arts-makros er
  // valgfrie bonusfotos. Tilføj entry her hvis billeder lander.

  // ── NYE ARTS-MAKRO-SÆT (27. juli 2026) ──────────────────────
  // Botaniske makro-sæt for arter uden (endnu) fuld guide/arts-hero.
  // speciesHero udelades bevidst → resolveren falder til asset-
  // convention (/images/arts/<slug>.jpg) hvis en arts-hero lander.
  // Makros vises på guiden når/hvis den kommer; ellers bonus-referencefotos.

  asparges: {
    macro: [
      { src: '/images/makro/asparges/bundt.jpg', alt: 'Bundt af friske asparges', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/asparges/hoveder.jpg', alt: 'Aspargeshoveder tæt på', role: 'structure', focalPoint: 'top' },
    ],
  },

  basilikum: {
    macro: [
      { src: '/images/makro/basilikum/oppefra.jpg', alt: 'Basilikum set oppefra', role: 'atmosphere', focalPoint: 'top' },
    ],
  },

  boenne: {
    macro: [
      { src: '/images/makro/boenne/planter.jpg', alt: 'Bønneplanter i vækst', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/boenne/blomst.jpg', alt: 'Bønneblomst', role: 'flower', focalPoint: 'center' },
      { src: '/images/makro/boenne/baelge.jpg', alt: 'Bønnebælge på planten', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/boenne/slyngtraad.jpg', alt: 'Bønnens slyngtråd', role: 'structure', focalPoint: 'top' },
    ],
  },

  dild: {
    macro: [
      { src: '/images/makro/dild/dug-2.jpg', alt: 'Dug på dild', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/dild/oppefra.jpg', alt: 'Dild set oppefra', role: 'atmosphere', focalPoint: 'top' },
      { src: '/images/makro/dild/skaerm.jpg', alt: 'Dild-blomsterskærm', role: 'structure', focalPoint: 'center' },
      { src: '/images/makro/dild/skaerm-closeup.jpg', alt: 'Dild-blomsterskærm tæt på', role: 'structure', focalPoint: 'center' },
      { src: '/images/makro/dild/skaerme.jpg', alt: 'Flere dild-blomsterskærme', role: 'structure', focalPoint: 'center' },
      { src: '/images/makro/dild/led-stilk.jpg', alt: 'Dild-stængel ved led', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/dild/kvist.jpg', alt: 'Fjerformet dild-kvist', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/dild/closeup-straa.jpg', alt: 'Dild-strå helt tæt på', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/dild/draber.jpg', alt: 'Dråber på dild', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/dild/dug-3.jpg', alt: 'Dugdråber på dild', role: 'detail', focalPoint: 'center' },
    ],
  },

  squash: {
    macro: [
      { src: '/images/makro/squash/blomst.jpg', alt: 'Squashblomst', role: 'atmosphere', focalPoint: 'center' },
    ],
  },

  palmekaal: {
    macro: [
      { src: '/images/makro/palmekaal/blad.jpg', alt: 'Palmekål-blad i nærbillede', role: 'atmosphere', focalPoint: 'center' },
    ],
  },

  citron: {
    macro: [
      { src: '/images/makro/citron/frugter.jpg', alt: 'Citroner på grenen', role: 'atmosphere', focalPoint: 'center' },
    ],
  },

  ananas: {
    macro: [
      { src: '/images/makro/ananas/skal.jpg', alt: 'Ananas-skal tæt på', role: 'atmosphere', focalPoint: 'center' },
    ],
  },

  hindbaer: {
    macro: [
      { src: '/images/makro/hindbaer/frugt.jpg', alt: 'Modne hindbær', role: 'atmosphere', focalPoint: 'center' },
    ],
  },

  // ── SORTSGUIDER ─────────────────────────────────────────────
  // plantCard og varietyHero peger på samme fil — to roller, samme aktiv.

  'tomat-san-marzano': {
    plantCard:   { src: '/images/plantekort/tomat-san-marzano.jpg', alt: 'San Marzano tomat — plantekort' },
    varietyHero: { src: '/images/plantekort/tomat-san-marzano.jpg', alt: 'San Marzano tomat — sortsfoto' },
    seedCard:    { src: '/images/frokort/tomat-san-marzano.png',    alt: 'San Marzano tomat — frøkort' },
    macro: [
      { src: '/images/makro/tomat-san-marzano/blad.jpg', alt: 'San Marzano-blad i nærbillede', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/klase-modne.jpg', alt: 'Klase af modne San Marzano', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/klase-umodne.jpg', alt: 'Klase af umodne San Marzano', role: 'structure', focalPoint: 'left' },
      { src: '/images/makro/tomat-san-marzano/led-haar.jpg', alt: 'Fine hår ved San Marzano-forgrening', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/overflade.jpg', alt: 'Overflade på San Marzano-frugt', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/sigle-umoden.jpg', alt: 'Én umoden San Marzano', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/tidlig-frugt.jpg', alt: 'Ung San Marzano-frugt', role: 'fruit', focalPoint: 'top' },
    ],
  },

  'chili-habanero-orange': {
    plantCard:   { src: '/images/plantekort/chili-habanero-orange.jpg', alt: 'Habanero Orange — plantekort' },
    varietyHero: { src: '/images/plantekort/chili-habanero-orange.jpg', alt: 'Habanero Orange — sortsfoto' },
    seedCard:    { src: '/images/frokort/chili-habanero-orange.png',    alt: 'Habanero Orange — frøkort' },
    macro: [
      { src: '/images/makro/chili-habanero-orange/blad-dug.jpg', alt: 'Dug på Habanero-blad', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/blad-indre.jpg', alt: 'Habanero-blad, underside', role: 'leaf', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/blad-stilk-led.jpg', alt: 'Habanero-blad ved stængel-led', role: 'structure', focalPoint: 'top' },
      { src: '/images/makro/chili-habanero-orange/blomst.jpg', alt: 'Åben Habanero-blomst', role: 'flower', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/to-frugter.jpg', alt: 'To modne Habanero-frugter', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/klase.jpg', alt: 'Klase af Habanero-frugter', role: 'structure', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/overflade.jpg', alt: 'Overflade på Habanero-frugt', role: 'detail', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/indre-froe.jpg', alt: 'Frø inde i Habanero', role: 'seed', focalPoint: 'center' },
      { src: '/images/makro/chili-habanero-orange/kernehus.jpg', alt: 'Habanero-kernehus', role: 'seed', focalPoint: 'center' },
    ],
  },

  'peberfrugt-corno-di-toro-rosso': {
    plantCard:   { src: '/images/plantekort/peberfrugt-corno-di-toro-rosso.jpg', alt: 'Corno di Toro Rosso — plantekort' },
    varietyHero: { src: '/images/plantekort/peberfrugt-corno-di-toro-rosso.jpg', alt: 'Corno di Toro Rosso — sortsfoto' },
    seedCard:    { src: '/images/frokort/peberfrugt-corno-di-toro-rosso.png',    alt: 'Corno di Toro Rosso — frøkort' },
    macro: [
      // Rolle-fordeling efter audit-task 1A: 5 makro-filer fundet på disk
      // (blomst, kerner, led, moden-frugt, ny-knop) annoteret med distinkte
      // roller så Corno-guiden får bleed-blokke og signatur-baggrund på
      // niveau med Tomat-SM og Habanero. ny-knop valgt som atmosphere så
      // R3 (visuel progression) er opfyldt — alle 5 makros får hver sin
      // rolle, ingen dubletter.
      { src: '/images/makro/peberfrugt-corno-di-toro-rosso/ny-knop.jpg',     alt: 'Spirende blomsterknop på Corno-plante',     role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/peberfrugt-corno-di-toro-rosso/blomst.jpg',     alt: 'Åben Corno-blomst',                          role: 'flower',     focalPoint: 'center' },
      { src: '/images/makro/peberfrugt-corno-di-toro-rosso/led.jpg',        alt: 'Forgreningspunkt på Corno-plante',           role: 'structure',  focalPoint: 'top' },
      { src: '/images/makro/peberfrugt-corno-di-toro-rosso/moden-frugt.jpg', alt: 'Moden Corno di Toro Rosso-frugt',           role: 'fruit',      focalPoint: 'center' },
      { src: '/images/makro/peberfrugt-corno-di-toro-rosso/kerner.jpg',     alt: 'Corno-frø og frøkammer',                    role: 'seed',       focalPoint: 'center' },
    ],
  },

  'agurk-marketmore': {
    plantCard:   { src: '/images/plantekort/agurk-marketmore.jpg', alt: 'Marketmore agurk — plantekort' },
    varietyHero: { src: '/images/plantekort/agurk-marketmore.jpg', alt: 'Marketmore agurk — sortsfoto' },
    seedCard:    { src: '/images/frokort/agurk-marketmore.png',    alt: 'Marketmore agurk — frøkort' },
    macro: [
      // Audit 2.A: 5 makro-filer fundet — annoteret med distinkte roller
      // så Marketmore-sortsguiden får bleed-blokke på niveau med Tomat-SM
      // og Habanero. blad valgt som atmosphere (sanseligt bladlys/dug)
      // for at opfylde R3 — mindst 1 atmosphere pr. sortsguide.
      { src: '/images/makro/agurk-marketmore/blad.jpg',         alt: 'Marketmore-blad i nærbillede',           role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/agurk-marketmore/blomst-myre.jpg',  alt: 'Marketmore-blomst med myre',             role: 'flower',     focalPoint: 'center' },
      { src: '/images/makro/agurk-marketmore/slyngtraad.jpg',   alt: 'Slyngtråd på Marketmore-plante',         role: 'structure',  focalPoint: 'top' },
      { src: '/images/makro/agurk-marketmore/tidlig-frugt.jpg', alt: 'Ung Marketmore-agurk på planten',        role: 'fruit',      focalPoint: 'center' },
      { src: '/images/makro/agurk-marketmore/udsnit.jpg',       alt: 'Detalje af Marketmore — udsnit',         role: 'detail',     focalPoint: 'center' },
    ],
  },

  'dahlia-cafe-au-lait': {
    plantCard:   { src: '/images/plantekort/dahlia-cafe-au-lait.jpg', alt: 'Café au Lait dahlia — plantekort' },
    varietyHero: { src: '/images/plantekort/dahlia-cafe-au-lait.jpg', alt: 'Café au Lait dahlia — sortsfoto' },
    seedCard:    { src: '/images/frokort/dahlia-cafe-au-lait.png',    alt: 'Café au Lait dahlia — knold-kort' },
    macro: [
      // Audit 2.B: 8 makro-filer fundet — annoteret efter Annas
      // blomster-template (fuld blomst / kronbladsmakro / knop /
      // blad-stængel / kerne). kronblade-creme valgt som atmosphere
      // for at opfylde R3 (mindst 1 atmosphere). Pool-størrelse 8
      // giver fuld variation på alle bleed-slots uden duplikater.
      { src: '/images/makro/dahlia-cafe-au-lait/hoved.jpg',         alt: 'Café au Lait i fuld blomst',            role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/dahlia-cafe-au-lait/midte.jpg',         alt: 'Midten af Café au Lait-blomst',         role: 'detail',     focalPoint: 'center' },
      { src: '/images/makro/dahlia-cafe-au-lait/blade-closeup.jpg', alt: 'Café au Lait-blade tæt på',             role: 'leaf',       focalPoint: 'center' },
    ],
  },

  'peberfrugt-california-wonder': {
    plantCard:   { src: '/images/plantekort/peberfrugt-california-wonder.jpg', alt: 'California Wonder peberfrugt — plantekort' },
    varietyHero: { src: '/images/plantekort/peberfrugt-california-wonder.jpg', alt: 'California Wonder peberfrugt — sortsfoto' },
    seedCard:    { src: '/images/frokort/peberfrugt-california-wonder.png',    alt: 'California Wonder peberfrugt — frøkort' },
    macro: [
      // Audit 2.C: pool udvidet til 6 makros — hver med en distinkt rolle.
      // Følger frugtbærende sortsguide-template: moden frugt, umoden frugt,
      // tværsnit (indre), blomst, struktur (led), kernehus.
      // indre.jpg behold som atmosphere (R3).
      { src: '/images/makro/peberfrugt-california-wonder/umoden-frugt.jpg', alt: 'Umoden California Wonder på planten',   role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/peberfrugt-california-wonder/blomst.jpg',      alt: 'California Wonder-blomst',              role: 'flower',     focalPoint: 'center' },
      { src: '/images/makro/peberfrugt-california-wonder/stilk.jpg',       alt: 'Stængel på California Wonder',          role: 'structure',  focalPoint: 'top' },
      { src: '/images/makro/peberfrugt-california-wonder/frugt.jpg',       alt: 'Moden California Wonder-frugt',         role: 'fruit',      focalPoint: 'center' },
      { src: '/images/makro/peberfrugt-california-wonder/kernehus.jpg',    alt: 'Kernehus i California Wonder',          role: 'seed',       focalPoint: 'center' },
      { src: '/images/makro/peberfrugt-california-wonder/froe.jpg',        alt: 'California Wonder-frø',                 role: 'seed',       focalPoint: 'center' },
    ],
  },

  // agurk-marketmore: makros mangler endnu — V4.1 audit. Tilføj her
  // når de lander.

  // ── FRØKORT-ONLY ENTRIES (11. juni 2026) ────────────────────
  //
  // Sorter med produceret frøkort men (endnu) ingen guide. Keyed på
  // slug — resolveren søger POTALOT_IMAGE_SETS_BY_ID på BÅDE guideId
  // og varietySlug, så frit-tekst-oprettelser i Frøbanken matcher:
  // "Tomat" + "Sungold" → slugify → 'tomat-sungold' → entry her.
  //
  // Når en sort senere får en guide med samme slug, udvides entry'en
  // bare med plantCard/varietyHero/makros — nøglen er allerede rigtig.

  'tomat-sungold': {
    seedCard: { src: '/images/frokort/tomat-sungold.png', alt: 'Sungold tomat — frøkort' },
    macro: [],
  },

  // Omdøbt 12. juni 2026: sorten hed fejlagtigt "Green Tiger" —
  // fotoet viser (og har altid vist) Green Zebra. Samme fil, nyt navn.
  'tomat-green-zebra': {
    seedCard: { src: '/images/frokort/tomat-green-zebra.png', alt: 'Green Zebra tomat — frøkort' },
    macro: [],
  },

  'tomat-cherrytomat': {
    seedCard: { src: '/images/frokort/tomat-cherrytomat.png', alt: 'Cherrytomat — frøkort' },
    macro: [
      { src: '/images/makro/tomat-cherrytomat/frugt.jpg', alt: 'Cherrytomater på klase', role: 'atmosphere', focalPoint: 'center' },
    ],
  },

  'chili-jalapeno': {
    seedCard: { src: '/images/frokort/chili-jalapeno.png', alt: 'Jalapeño chili — frøkort' },
    macro: [],
  },

  'chili-lemon-drop': {
    seedCard: { src: '/images/frokort/chili-lemon-drop.png', alt: 'Lemon Drop chili — frøkort' },
    macro: [],
  },

  'agurk-telegraph': {
    seedCard: { src: '/images/frokort/agurk-telegraph.png', alt: 'Telegraph agurk — frøkort' },
    macro: [],
  },

  'dild-bouquet': {
    seedCard: { src: '/images/frokort/dild-bouquet.png', alt: 'Bouquet dild — frøkort' },
    macro: [],
  },

  'salat-crispy-mint': {
    seedCard: { src: '/images/frokort/salat-crispy-mint.png', alt: 'Crispy Mint salat — frøkort' },
    macro: [],
  },

  'squash-eight-ball': {
    seedCard: { src: '/images/frokort/squash-eight-ball.png', alt: 'Eight Ball squash — frøkort' },
    macro: [],
  },

  'stangboenne-cobra': {
    seedCard: { src: '/images/frokort/stangboenne-cobra.png', alt: 'Cobra stangbønne — frøkort' },
    macro: [],
  },

  // Hvidløg sælges og registreres typisk uden sortsnavn — entry'en
  // er keyed på arts-slugget så "Hvidløg" uden sort matcher direkte.
  // En sorts-specifik oprettelse ("Hvidløg Vallelado" →
  // 'hvidloeg-vallelado') matcher BEVIDST ikke — vi viser ikke et
  // generisk kort som om det var sorten (jf. "forkert billede"-reglen);
  // det afventer arts-fallback-mekanismen på backloggen.
  // Generisk 'hvidloeg' har ikke længere et eget frøkort: det blev
  // erstattet af sorts-specifikke kort (hvidloeg-germidour/messidor/
  // printanor/sabadrome/thermidrome), som resolves via asset-convention
  // på deres egen sorts-slug. Generisk hvidløg falder til placeholder
  // indtil arts-fallback findes (jf. note ovenfor).
  'hvidloeg': {
    macro: [
      { src: '/images/makro/hvidloeg/knop.jpg', alt: 'Krøllet hvidløgs-scape på spring', role: 'atmosphere', focalPoint: 'top' },
      { src: '/images/makro/hvidloeg/stilk.jpg', alt: 'Hvidløgs-stængel i nærbillede', role: 'structure', focalPoint: 'center' },
    ],
  },

  // ── FRØKORT-ONLY ENTRIES (12. juni 2026) ────────────────────
  //
  // Anden leverance. Indholdsverificeret mod sortsnavnene én for én.
  // OBS: leveret som "agurk-sugar-snap.png", men fotoet viser
  // sukkerærter — omdøbt til aert-sugar-snap.png (ærligheds-reglen).
  // v4-kanonisk slug: art = Ært, sort = Sugar Snap. "Sukkerært" er
  // visningslabel/type, ikke art-navn (ellers splittes databasen).
  'aert-sugar-snap': {
    seedCard: { src: '/images/frokort/aert-sugar-snap.png', alt: 'Sugar Snap ært — frøkort' },
    macro: [],
  },

  'basilikum-genovese': {
    seedCard: { src: '/images/frokort/basilikum-genovese.png', alt: 'Genovese basilikum — frøkort' },
    macro: [],
  },

  'cosmos-apricotta': {
    seedCard: { src: '/images/frokort/cosmos-apricotta.png', alt: 'Apricotta cosmos — frøkort' },
    macro: [],
  },

  'dahlia-arabian-night': {
    seedCard: { src: '/images/frokort/dahlia-arabian-night.png', alt: 'Arabian Night dahlia — frøkort' },
    macro: [],
  },

  'dahlia-thomas-edison': {
    seedCard: { src: '/images/frokort/dahlia-thomas-edison.png', alt: 'Thomas Edison dahlia — frøkort' },
    macro: [],
  },

  'majs-golden-bantam': {
    seedCard: { src: '/images/frokort/majs-golden-bantam.png', alt: 'Golden Bantam majs — frøkort' },
    macro: [],
  },

  // Leveret som majs-incredible-F1.png — omdøbt til lowercase efter
  // asset-konventionen; slugify("Incredible F1") giver 'incredible-f1'.
  'majs-incredible-f1': {
    seedCard: { src: '/images/frokort/majs-incredible-f1.png', alt: 'Incredible F1 majs — frøkort' },
    macro: [],
  },

  'majs-sweet-nugget': {
    seedCard: { src: '/images/frokort/majs-sweet-nugget.png', alt: 'Sweet Nugget majs — frøkort' },
    macro: [],
  },

  'salat-little-gem': {
    seedCard: { src: '/images/frokort/salat-little-gem.png', alt: 'Little Gem salat — frøkort' },
    macro: [],
  },

  'solsikke-russian-giant': {
    seedCard: { src: '/images/frokort/solsikke-russian-giant.png', alt: 'Russian Giant solsikke — frøkort' },
    macro: [],
  },

  'tomat-black-cherry': {
    seedCard: { src: '/images/frokort/tomat-black-cherry.png', alt: 'Black Cherry tomat — frøkort' },
    macro: [],
  },

  'zinnia-queen-lime': {
    seedCard: { src: '/images/frokort/zinnia-queen-lime.png', alt: 'Queen Lime zinnia — frøkort' },
    macro: [],
  },

  // ── FRØKORT-ONLY ENTRIES (12. juni 2026, tredje leverance) ──
  //
  // Alle indholdsverificeret mod sortsnavnene én for én. Nye arter:
  // græskar, grønkål, jordbær, radise, rucola, spinat.
  // radise.cherry-belle.png leveret med punktum — omdøbt til
  // bindestreg (asset-konventionen).

  'tomat-gardeners-delight': {
    seedCard: { src: '/images/frokort/tomat-gardeners-delight.png', alt: 'Gardeners Delight tomat — frøkort' },
    macro: [],
  },

  'chili-cayenne': {
    seedCard: { src: '/images/frokort/chili-cayenne.png', alt: 'Cayenne chili — frøkort' },
    macro: [],
  },

  'chili-padron': {
    seedCard: { src: '/images/frokort/chili-padron.png', alt: 'Padrón chili — frøkort' },
    macro: [],
  },

  'cosmos-candy-stripe': {
    seedCard: { src: '/images/frokort/cosmos-candy-stripe.png', alt: 'Candy Stripe cosmos — frøkort' },
    macro: [],
  },

  'graeskar-hokkaido': {
    seedCard: { src: '/images/frokort/graeskar-hokkaido.png', alt: 'Hokkaido græskar — frøkort' },
    macro: [],
  },

  'groenkaal-red-russian': {
    seedCard: { src: '/images/frokort/groenkaal-red-russian.png', alt: 'Red Russian grønkål — frøkort' },
    macro: [],
  },

  'jordbaer-korona': {
    seedCard: { src: '/images/frokort/jordbaer-korona.png', alt: 'Korona jordbær — frøkort' },
    macro: [],
  },

  'jordbaer-polka': {
    seedCard: { src: '/images/frokort/jordbaer-polka.png', alt: 'Polka jordbær — frøkort' },
    macro: [],
  },

  'peberfrugt-corno-di-toro-giallo': {
    seedCard: { src: '/images/frokort/peberfrugt-corno-di-toro-giallo.png', alt: 'Corno di Toro Giallo peberfrugt — frøkort' },
    macro: [],
  },

  'radise-french-breakfast': {
    seedCard: { src: '/images/frokort/radise-french-breakfast.png', alt: 'French Breakfast radise — frøkort' },
    macro: [],
  },

  'radise-saxa-2': {
    seedCard: { src: '/images/frokort/radise-saxa-2.png', alt: 'Saxa 2 radise — frøkort' },
    macro: [],
  },

  'radise-cherry-belle': {
    seedCard: { src: '/images/frokort/radise-cherry-belle.png', alt: 'Cherry Belle radise — frøkort' },
    macro: [],
  },

  'spinat-matador': {
    seedCard: { src: '/images/frokort/spinat-matador.png', alt: 'Matador spinat — frøkort' },
    macro: [],
  },

  // Rucola dyrkes og sælges oftest uden sortsnavn — keyed på BÅDE
  // arts-slugget ("Rucola" uden sort) og sorts-slugget ("Rucola
  // Standard"), samme foto, samme hvidløgs-mønster som ovenfor.
  'rucola': {
    seedCard: { src: '/images/frokort/rucola-standard.png', alt: 'Rucola — frøkort' },
    macro: [],
  },

  'rucola-standard': {
    seedCard: { src: '/images/frokort/rucola-standard.png', alt: 'Rucola — frøkort' },
    macro: [],
  },

  // ── FRØKORT-ONLY ENTRIES (13. juni 2026, fjerde leverance) ──
  // Indholdsverificeret mod sortsnavn. Nye agurke-sorter + flere
  // græskar/peber/bønne.
  'agurk-delikatesse': {
    seedCard: { src: '/images/frokort/agurk-delikatesse.png', alt: 'Delikatesse asier-agurk — frøkort' },
    macro: [],
  },
  'agurk-louisa': {
    seedCard: { src: '/images/frokort/agurk-louisa.png', alt: 'Louisa slangeagurk — frøkort' },
    macro: [],
  },
  'agurk-passandra': {
    seedCard: { src: '/images/frokort/agurk-passandra.png', alt: 'Passandra miniagurk — frøkort' },
    macro: [],
  },
  'graeskar-butternut-waltham': {
    seedCard: { src: '/images/frokort/graeskar-butternut-waltham.png', alt: 'Waltham Butternut græskar — frøkort' },
    macro: [],
  },
  'graeskar-uchiki-kuri': {
    seedCard: { src: '/images/frokort/graeskar-uchiki-kuri.png', alt: 'Uchiki Kuri græskar — frøkort' },
    macro: [],
  },
  'peberfrugt-purple-beauty': {
    seedCard: { src: '/images/frokort/peberfrugt-purple-beauty.png', alt: 'Purple Beauty peberfrugt — frøkort' },
    macro: [],
  },
  'peberfrugt-yolo-wonder': {
    seedCard: { src: '/images/frokort/peberfrugt-yolo-wonder.png', alt: 'Yolo Wonder peberfrugt — frøkort' },
    macro: [],
  },
  'stangboenne-blauhilde': {
    seedCard: { src: '/images/frokort/stangboenne-blauhilde.png', alt: 'Blauhilde stangbønne — frøkort' },
    macro: [],
  },

  // ── DEMO (kompatibilitet med eksisterende demo-data) ───────

  'demo-guide-tomat-sm': {
    plantCard:   { src: '/images/plantekort/tomat-san-marzano.jpg', alt: 'San Marzano tomat — plantekort' },
    varietyHero: { src: '/images/plantekort/tomat-san-marzano.jpg', alt: 'San Marzano tomat — sortsfoto' },
    seedCard:    { src: '/images/frokort/tomat-san-marzano.png',    alt: 'San Marzano tomat — frøkort' },
    macro: [
      { src: '/images/makro/tomat-san-marzano/blad.jpg', alt: 'San Marzano-blad i nærbillede', role: 'atmosphere', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/klase-umodne.jpg', alt: 'Klase af umodne San Marzano', role: 'structure', focalPoint: 'left' },
      { src: '/images/makro/tomat-san-marzano/sigle-umoden.jpg', alt: 'Én umoden San Marzano', role: 'fruit', focalPoint: 'center' },
      { src: '/images/makro/tomat-san-marzano/led-haar.jpg', alt: 'Fine hår ved San Marzano-forgrening', role: 'detail', focalPoint: 'center' },
    ],
  },
}

/** Lookup. Returnerer undefined hvis intet set er defineret. */
export function getPotalotImageSet(guideId: string): PotalotImageSet | undefined {
  return POTALOT_IMAGE_SETS_BY_ID[guideId]
}
