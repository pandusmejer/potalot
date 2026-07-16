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

/** De fire rolige instrument-tal i toppen (Status · Alder · Højde · Trivsel). */
export interface DetailMaal {
  statusValue: string
  statusNote: string
  alderValue: string
  alderNote: string
  hoejdeValue: string
  hoejdeNote: string
  sundhedValue: string
  sundhedNote: string
  /** Kort kilde-dato for seneste højdemåling (fx "16. jul"). Udeladt = ingen måling. */
  hoejdeSource?: string
  /** Kort kilde-dato for seneste trivsels-vurdering. Udeladt = ikke vurderet. */
  sundhedSource?: string
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
  /** Foto af det der er på vej (knop/blomst) til kort 1. Foretrækker et
   *  makro-close-up; tom streng = ingen foto → kortet viser botanisk fyld. */
  fotoSrc: string
  fotoAlt: string
  /** object-position fra makroens focalPoint, så off-center close-ups
   *  rammer rigtigt i den klippede ramme. Udeladt = browser-default. */
  fotoObjectPosition?: string
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

/**
 * Redaktionelt OVERRIDE/berigelses-lag.
 *
 * Annas arkitektur (2026-06-15): dette styrer IKKE længere om en plante
 * får editorial-layout — det gør alle planter nu (buildPlantDetail).
 * Override beriger kun siden med håndskrevet tekst/billeder for vigtige
 * sorter. Felterne er valgfrie; det angivne vinder over det data-afledte.
 *
 * VIGTIGT: læg ikke hårde tal (alder/højde/status) her — de skal forblive
 * data-drevne, så vi aldrig viser falske statiske tal.
 */
export interface PlantDetailOverride {
  /** Poetisk "Lige nu" — kun de angivne felter overskriver det afledte. */
  naeste?: Partial<DetailNaeste>
  /** Narrativ pr. tidslinje-fase: fase-label → historie. Beriger milepælene. */
  tidslinjeNoter?: Record<string, string>
  /** Kurateret galleri (makrofotos). Uden override skjules galleriet. */
  billeder?: DetailBillede[]
  /** Håndskrevet sammenligning. Uden override skjules sektionen (V1). */
  sammenligning?: DetailSammenligning
}

/**
 * Overrides pr. guideId. San Marzano er REFERENCE-implementeringen —
 * ikke undtagelsen. Alle andre sorter får den rene data-drevne side.
 */
export const PLANT_DETAIL_OVERRIDES: Record<string, PlantDetailOverride> = {
  'tomat-san-marzano': {
    naeste: {
      overskrift: 'Første blomster',
      timing: 'forventes om 8–14 dage',
      beskrivelse: 'San Marzano går nu fra vegetativ vækst til blomstring.',
      denneUge: ['Fjern sideskud', 'Bind planten op', 'Hold jorden jævnt fugtig', 'Gød hver 7–10 dag'],
      fotoSrc: `${MAKRO_SM}/frugtknop.jpg`,
      fotoAlt: 'Begyndende blomsterknop på San Marzano',
    },
    tidslinjeNoter: {
      Sået: 'Seks frø lagt i bakke på varmemåtte.',
      Spiret: 'Alle seks spirer kom op — stærke og lige.',
      Udplantet: 'Sat ud i drivhusets lune sydhjørne.',
      Høst: 'De første klaser sætter allerede — høst nærmer sig.',
    },
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

/** Slå override op via guideId. Null = ren data-drevet side (ingen berigelse). */
export function overrideFor(guideId?: string | null): PlantDetailOverride | null {
  if (!guideId) return null
  return PLANT_DETAIL_OVERRIDES[guideId] ?? null
}
