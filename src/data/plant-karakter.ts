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
 *
 * Tre tekstlag (svarer til mockup'en):
 *   beskrivelse → HERO-undertitlen (hvad sorten ER, i ét åndedrag)
 *   essens      → KARAKTER-kortets overskrift (3 ord, sortens sjæl)
 *   uddybning   → KARAKTER-kortets brødtekst (haveven-tonen)
 */

export interface PlantKarakter {
  /** HERO-undertitlen: 1-2 sætninger der placerer sorten i verden. */
  beskrivelse: string
  /** KARAKTER-overskrift: tre ord der fanger temperamentet. */
  essens: string
  /** KARAKTER-brødtekst: en haveven der fortæller om sorten. */
  uddybning: string
  /** 4 hurtige træk — sortens "personlighedskort". */
  traits: { label: string; value: string }[]
}

/** Keyed på guideId (= sorts-slug). */
export const PLANT_KARAKTER: Record<string, PlantKarakter> = {
  'tomat-san-marzano': {
    beskrivelse:
      'Den klassiske italienske saucetomat. Lang sæson, få kerner og et ry for at belønne tålmodige dyrkere.',
    essens: 'Rolig · Lang · Tålmodig',
    uddybning:
      'San Marzano tager sin tid – men belønner dig med masser af lækre, aflange frugter perfekte til sauce og henkogning.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Middel' },
      { label: 'Temperament', value: 'Rolig' },
      { label: 'Sæson', value: 'Lang' },
      { label: 'Bedst til', value: 'Sauce & henkogning' },
    ],
  },
  'peberfrugt-corno-di-toro-rosso': {
    beskrivelse:
      'En lang, hornformet italiensk sød peber med tyndt skind. Bliver knaldrød og smager solmodent af sommer.',
    essens: 'Sød · Varmekær · Tålmodig',
    uddybning:
      'Corno di Toro bliver knaldrød og solmodent sød — hvis du giver den varme og tid nok. Et af havens største slik.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Middel' },
      { label: 'Temperament', value: 'Varmekær' },
      { label: 'Sæson', value: 'Lang' },
      { label: 'Bedst til', value: 'Grill & pander' },
    ],
  },
  'aert-sugar-snap': {
    beskrivelse:
      'Den sprøde sukkerært, man spiser med bælg og det hele. Vokser hurtigt, klatrer ivrigt og smager bedst lige fra planten.',
    essens: 'Sprød · Ivrig · Hurtig',
    uddybning:
      'Sukkerærten klatrer ivrigt og spises med bælg og det hele — sødest et minut efter du har plukket den.',
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
    essens: 'Hidsig · Frugtig · Krævende',
    uddybning:
      'Frugtig hede bag flammen. Habanero kræver varme, tid og en smule respekt — men giver en af havens stærkeste smage.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Svær' },
      { label: 'Temperament', value: 'Hidsig' },
      { label: 'Sæson', value: 'Meget lang' },
      { label: 'Bedst til', value: 'Salsa & syltning' },
    ],
  },
  'agurk-marketmore': {
    beskrivelse:
      'Den pålidelige frilandsagurk. Sprød, bitterfri og storproducerende — en taknemmelig favorit for den utålmodige.',
    essens: 'Sprød · Gavmild · Pålidelig',
    uddybning:
      'Den pålidelige frilandsagurk: bitterfri, storproducerende og taknemmelig — en favorit for den utålmodige.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Let' },
      { label: 'Temperament', value: 'Gavmild' },
      { label: 'Sæson', value: 'Mellem' },
      { label: 'Bedst til', value: 'Snack & salat' },
    ],
  },
  'tomat-cherrytomat': {
    beskrivelse:
      'Små søde cherrytomater i lange klaser. Hurtig til at modne, gavmild hele sommeren og svær at gå forbi uden at smage.',
    essens: 'Sød · Gavmild · Nem',
    uddybning:
      'Små søde cherrytomater i lange klaser — gavmild hele sommeren og svær at gå forbi uden at smage.',
    traits: [
      { label: 'Sværhedsgrad', value: 'Let' },
      { label: 'Temperament', value: 'Gavmild' },
      { label: 'Sæson', value: 'Lang' },
      { label: 'Bedst til', value: 'Snack & salat' },
    ],
  },
}

/** Slå karakter op for en plante via dens guideId. Null hvis ingen endnu. */
export function karakterFor(guideId?: string | null): PlantKarakter | null {
  if (!guideId) return null
  return PLANT_KARAKTER[guideId] ?? null
}
