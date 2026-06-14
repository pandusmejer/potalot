/**
 * Plante-karakter — sortens PERSONLIGHED, ikke dens data.
 *
 * Fase 1 (oplevelse før ledninger): statisk indhold pr. sort, så
 * planteside-oplevelsen kan bygges og føles færdig UDEN data-wiring.
 * Senere flyttes dette til guide-felter / vidensmodellen (Kilde:
 * redaktionel) — men formen er sat her først.
 *
 * Karakter = det første en bruger møder. Den definerer siden: pludselig
 * er planten ikke en database-række, men et væsen med temperament.
 */

export interface PlantKarakter {
  /** 1-2 sætninger der giver sorten sjæl. Tæt på en haveven, ikke en etiket. */
  beskrivelse: string
  /** 4 hurtige træk — sortens "personlighedskort". */
  traits: { label: string; value: string }[]
}

/** Keyed på guideId (= sorts-slug). */
export const PLANT_KARAKTER: Record<string, PlantKarakter> = {
  'tomat-san-marzano': {
    beskrivelse:
      'Den klassiske italienske saucetomat. Lang sæson, få kerner og et ry for at belønne tålmodige dyrkere.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Middel' },
      { label: 'Temperament', value: 'Rolig' },
      { label: 'Sæson', value: 'Lang' },
      { label: 'Bedst til', value: 'Sauce og henkogning' },
    ],
  },
  'peberfrugt-corno-di-toro-rosso': {
    beskrivelse:
      'Den italienske oksehjerte-peber — lang, sød og tyndskindet. Bliver knaldrød og smager solmodent af sommer.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Middel' },
      { label: 'Temperament', value: 'Varmekær' },
      { label: 'Sæson', value: 'Lang' },
      { label: 'Bedst til', value: 'Grill og pander' },
    ],
  },
  'aert-sugar-snap': {
    beskrivelse:
      'Den sprøde sukkerært, man spiser med bælg og det hele. Vokser hurtigt, klatrer ivrigt og smager bedst lige fra planten.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Let' },
      { label: 'Temperament', value: 'Ivrig' },
      { label: 'Sæson', value: 'Kort' },
      { label: 'Bedst til', value: 'Råt fra bedet' },
    ],
  },
  'chili-habanero-orange': {
    beskrivelse:
      'En af de stærke. Frugtig hede bag flammen, og en plante der kræver varme, tid og en smule respekt.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Svær' },
      { label: 'Temperament', value: 'Hidsig' },
      { label: 'Sæson', value: 'Meget lang' },
      { label: 'Bedst til', value: 'Salsa og syltning' },
    ],
  },
  'agurk-marketmore': {
    beskrivelse:
      'Den pålidelige frilandsagurk. Sprød, bitterfri og storproducerende — en taknemmelig favorit for den utålmodige.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Let' },
      { label: 'Temperament', value: 'Gavmild' },
      { label: 'Sæson', value: 'Mellem' },
      { label: 'Bedst til', value: 'Snack og salat' },
    ],
  },
  'tomat-cherrytomat': {
    beskrivelse:
      'Små søde cherrytomater i lange klaser. Hurtig til at modne, gavmild hele sommeren og svær at gå forbi uden at smage.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Let' },
      { label: 'Temperament', value: 'Gavmild' },
      { label: 'Sæson', value: 'Lang' },
      { label: 'Bedst til', value: 'Snack og salat' },
    ],
  },
}

/** Slå karakter op for en plante via dens guideId. Null hvis ingen endnu. */
export function karakterFor(guideId?: string | null): PlantKarakter | null {
  if (!guideId) return null
  return PLANT_KARAKTER[guideId] ?? null
}
