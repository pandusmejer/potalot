/**
 * Teknik-opgaver — tekniksiden organiseres efter ARBEJDE, ikke planteart. En
 * nybegynder ved ikke hvilken "teknikguide" de mangler; de ved bare "min tomat
 * vælter" → Bind op & støt. Kurateret opslag (guide-id → opgave), à la
 * guide-library-categories. Hold ajour når nye teknikguider kommer.
 */

export type TechniqueTask =
  | 'saa'
  | 'plant-ud'
  | 'vand-goed'
  | 'bind-op'
  | 'knib'
  | 'bestoev'
  | 'hoest'
  | 'overvintr'

export const TECHNIQUE_TASK_ORDER: TechniqueTask[] = [
  'saa',
  'plant-ud',
  'vand-goed',
  'bind-op',
  'knib',
  'bestoev',
  'hoest',
  'overvintr',
]

export const TECHNIQUE_TASK_LABEL: Record<TechniqueTask, string> = {
  saa: 'Så & forkultivér',
  'plant-ud': 'Plant ud',
  'vand-goed': 'Vand & gød',
  'bind-op': 'Bind op & støt',
  knib: 'Knib & beskær',
  bestoev: 'Bestøv',
  hoest: 'Høst',
  overvintr: 'Overvintr',
}

/** Kort undertekst pr. opgave — hvad opgaven dækker, i havefolk-sprog. */
export const TECHNIQUE_TASK_INTRO: Record<TechniqueTask, string> = {
  saa: 'Så, spir og få stærke småplanter',
  'plant-ud': 'Flyt planterne ud på friland',
  'vand-goed': 'Vanding og næring gennem sæsonen',
  'bind-op': 'Hold planterne oprejste, når de bliver tunge',
  knib: 'Styr væksten med knib, beskæring og udtynding',
  bestoev: 'Hjælp blomsterne med at sætte frugt',
  hoest: 'Høst i tide og på den rigtige måde',
  overvintr: 'Bring planterne godt gennem vinteren',
}

/** guide-id → opgave. Guides uden mapping vises under "Andre teknikker". */
export const TECHNIQUE_TASK_OF: Record<string, TechniqueTask> = {
  // Bind op & støt
  'opbinding-af-tomater': 'bind-op',
  'opbinding-af-agurker': 'bind-op',
  'opbinding-og-plantestoette': 'bind-op',
  'stoette-til-aerter-og-klatreboenner': 'bind-op',
  'stoette-til-chili-og-peberfrugt': 'bind-op',
  'stoette-til-dahlia-og-hoeje-blomster': 'bind-op',

  // Knib & beskær
  'knibning-af-tomater': 'knib',
  'beskaering-af-agurker': 'knib',
  'beskaering-af-chili-og-peberfrugt': 'knib',
  'knibning-beskaering-og-udtynding': 'knib',
  'knibning-og-afblomstring-af-dahliaer': 'knib',

  // Så & forkultivér
  'udtynding-af-smaaplanter': 'saa',
}
