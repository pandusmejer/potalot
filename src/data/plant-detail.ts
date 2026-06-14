/**
 * Plante-detalje — det redaktionelle indhold på "værkstedet" (planteside).
 *
 * Annas dom (14. juni 2026): byg den perfekte planteside som STATISK
 * ARTEFAKT først — oplevelse før data-wiring. Dette modul er den
 * artefakt: håndlavet, magasin-værdigt indhold pr. sort, så siden kan
 * føles helt færdig uden at noget er koblet til DB endnu.
 *
 * San Marzano er bygget 1:1 efter mockup'en (Hero → Stats → Lige nu →
 * Karakter → Tidslinje → Billeder → Sammenligning). Andre sorter falder
 * elegant tilbage til det, vi kan udlede af MockPlant (alder, status,
 * datoer) — de udvides til fuldt indhold sort for sort senere.
 *
 * Fotos peger direkte på de kuraterede makro-/plantekort-assets. Når
 * vidensmodellen/billedpipelinen lander, flyttes opslaget dertil — men
 * formen (felterne nedenfor) er sat her.
 */

/** Ét punkt på den lodrette livshistorie-tidslinje. */
export interface DetailMilestone {
  /** Stadie-navn, fx "Sået", "Spiret", "Pottet om". */
  label: string
  /** Visningsdato, fx "18. marts". null = endnu ikke sket (fremtid). */
  dato: string | null
  /** Ikon-nøgle — afgør hvilken glyph der tegnes. */
  ikon: 'fro' | 'spire' | 'blad' | 'plante' | 'frugt'
  /** Den narrative linje — historie, ikke proces. Hovedteksten. */
  historie: string
}

/** De fire rolige instrument-tal i toppen (Status · Alder · Højde · Sundhed). */
export interface DetailMaal {
  statusValue: string
  statusNote: string
  alderValue: string
  alderNote: string
  hoejdeValue: string
  hoejdeNote: string
  sundhedValue: string
  sundhedNote: string
}

/** "Lige nu" + "Denne uge" — to kort: magasin-historie + plejeliste. */
export interface DetailNaeste {
  /** Begivenheden lige nu, fx "Første blomster". */
  overskrift: string
  /** Timing, fx "forventes om 8–14 dage". */
  timing: string
  /** Hvad der sker, i prosa, fx "San Marzano går nu fra vegetativ vækst …". */
  beskrivelse: string
  /** "Se guide"-destination. */
  guideHref: string
  /** Ugens pleje-tjekliste (kort 2, DENNE UGE). Korte handlinger. */
  denneUge: string[]
  /** Foto af det der er på vej (knop/blomst) til kort 1. */
  fotoSrc: string
  fotoAlt: string
}

/** Sammenligningslaget — historie, ikke score (Annas dom: ingen Strava). */
export interface DetailSammenligning {
  /** Rolig serif-dom, fx "Din plante er lidt foran". */
  overskrift: string
  /** Havebog-forklaring: den typiske rytme vs. din plante, i prosa. */
  broedtekst: string
}

export interface DetailBillede {
  src: string
  alt: string
}

export interface PlantDetail {
  /** Fuldbredde makrofoto i toppen. */
  heroFoto: string
  heroFotoAlt: string
  maal: DetailMaal
  naeste: DetailNaeste
  /** Vandret livshistorie. Tom = fald tilbage til MockPlant-datoerne. */
  tidslinje: DetailMilestone[]
  /** Galleri. Tom = vis kun "Tilføj billede". */
  billeder: DetailBillede[]
  /** Null = sektionen skjules (intet datagrundlag endnu). */
  sammenligning: DetailSammenligning | null
}

const MAKRO_SM = '/images/makro/tomat-san-marzano'

export const PLANT_DETAIL: Record<string, PlantDetail> = {
  'tomat-san-marzano': {
    heroFoto: '/images/plantekort/tomat-san-marzano.jpg',
    heroFotoAlt: 'Modne San Marzano-tomater på planten',
    maal: {
      statusValue: 'Aktiv',
      statusNote: 'i vækst',
      alderValue: '62 dage',
      alderNote: 'siden såning',
      hoejdeValue: '38 cm',
      hoejdeNote: 'sidst målt',
      sundhedValue: 'God',
      sundhedNote: 'stabil vækst',
    },
    naeste: {
      overskrift: 'Første blomster',
      timing: 'forventes om 8–14 dage',
      beskrivelse: 'San Marzano går nu fra vegetativ vækst til blomstring.',
      guideHref: '/guides',
      denneUge: ['Fjern sideskud', 'Bind planten op', 'Hold jorden jævnt fugtig', 'Gød hver 7.–10. dag'],
      fotoSrc: `${MAKRO_SM}/frugtknop.jpg`,
      fotoAlt: 'Begyndende blomsterknop på San Marzano',
    },
    tidslinje: [
      { label: 'Sået', dato: '18. marts', ikon: 'fro', historie: 'Seks frø lagt i bakke på varmemåtte.' },
      { label: 'Spiret', dato: '24. marts', ikon: 'spire', historie: 'Alle seks spirer kom op — stærke og lige.' },
      { label: 'Pottet om', dato: '14. april', ikon: 'blad', historie: 'Flyttet til 11 cm potter; rødderne havde fyldt den gamle.' },
      { label: 'Udplantet', dato: '4. juni', ikon: 'plante', historie: 'Sat ud i drivhusets lune sydhjørne.' },
      { label: 'Første høst', dato: null, ikon: 'frugt', historie: 'Forventes omkring 22. juli.' },
    ],
    billeder: [
      { src: `${MAKRO_SM}/y-led.jpg`, alt: 'Kraftigt Y-led på stænglen' },
      { src: `${MAKRO_SM}/blad-dug.jpg`, alt: 'Morgendug på bladene' },
      { src: `${MAKRO_SM}/frugtknop.jpg`, alt: 'Første frugtknop' },
      { src: `${MAKRO_SM}/klase.jpg`, alt: 'Klase med unge frugter' },
      { src: `${MAKRO_SM}/umodne.jpg`, alt: 'Umodne grønne San Marzano' },
    ],
    sammenligning: {
      overskrift: 'Din plante er lidt foran',
      broedtekst:
        'De fleste San Marzano får først blomster om 14–20 dage. Dine forventes tidligere — et tegn på en god, varm start.',
    },
  },
}

/** Slå detalje-indhold op via guideId. Null hvis sorten ikke er bygget endnu. */
export function detailFor(guideId?: string | null): PlantDetail | null {
  if (!guideId) return null
  return PLANT_DETAIL[guideId] ?? null
}
