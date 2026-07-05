/**
 * Demo-erfaringer til "Lær af hinanden"-modulet på guide-detaljesiden.
 *
 * VIGTIGT: Dette er DEMO/DESIGN-data. Det rigtige community-lag — deling på
 * tværs af brugere, anerkendelses-notifikationer og privat/anonym-persistens —
 * hører til et separat backend-sprint (spec + migration i frisk tråd), ikke her.
 * Modulet designes og verificeres mod disse seed-erfaringer.
 *
 * Tonen er bevidst praktisk feltnote — IKKE Potalot-anbefaling. UI'et sætter
 * erfaringerne i Manrope, mens Potalot-guiden beholder sin Cormorant-autoritet,
 * så typografien selv koder forskellen på erfaring og anbefaling.
 */

export type ErfaringKind = 'observation' | 'log' | 'erfaring'

export interface DyrkerErfaring {
  id: string
  guideId: string
  /** Styrer label-chippen: hvad slags bidrag er det? */
  kind: ErfaringKind
  title: string
  /** Voksested — Drivhus / Friland / Krukke (altan) osv. */
  place: string
  /** Jordtype — Muldjord / Sandmuld / Plantejord osv. */
  soil: string
  excerpt: string
  /** Sæson eller måned, fx "Sæson 2024" / "August". */
  season: string
  /** Hvor mange andre dyrkere der har haft gavn af observationen. */
  helpfulCount: number
}

const ERFARINGER: Record<string, DyrkerErfaring[]> = {
  'tomat-san-marzano': [
    {
      id: 'sm-sauce',
      guideId: 'tomat-san-marzano',
      kind: 'log',
      title: 'Fantastisk til sauce – få kerner',
      place: 'Drivhus',
      soil: 'Muldjord',
      excerpt:
        'Dyrket i drivhus i år. Meget kødfulde og med virkelig få kerner. Lavede passata — den blev så cremet!',
      season: 'Sæson 2024',
      helpfulCount: 23,
    },
    {
      id: 'sm-friland',
      guideId: 'tomat-san-marzano',
      kind: 'observation',
      title: 'Lang sæson, stort udbytte',
      place: 'Friland',
      soil: 'Sandmuld',
      excerpt:
        'Dyrket på friland. Langsom start, men da den først kom i gang, gav den masser af aflange, flotte tomater.',
      season: 'Sæson 2024',
      helpfulCount: 18,
    },
    {
      id: 'sm-altan',
      guideId: 'tomat-san-marzano',
      kind: 'erfaring',
      title: 'Overraskende godt på altanen',
      place: 'Krukke (altan)',
      soil: 'Plantejord',
      excerpt:
        'Dyrket i stor krukke på altanen. Overraskende udbytte og super smag. Husk opbinding fra start!',
      season: 'Sæson 2024',
      helpfulCount: 15,
    },
    {
      id: 'sm-knibning',
      guideId: 'tomat-san-marzano',
      kind: 'log',
      title: 'Ugentlig knibning gav større klaser',
      place: 'Drivhus',
      soil: 'Muldjord',
      excerpt:
        'Fjernede alle sideskud én gang om ugen og toppede planten sidst i august. Færre, men tydeligt større klaser.',
      season: 'Juli–sep 2025',
      helpfulCount: 21,
    },
    {
      id: 'sm-blomsterende',
      guideId: 'tomat-san-marzano',
      kind: 'observation',
      title: 'Blomsterendefald ved ujævn vanding',
      place: 'Drivhus',
      soil: 'Muldjord',
      excerpt:
        'De første frugter fik sorte pletter i bunden. Det stoppede, da jeg vandede jævnt og tilførte lidt kalk til jorden.',
      season: 'Juni 2025',
      helpfulCount: 17,
    },
  ],
  tomat: [
    {
      id: 'tom-forspiring',
      guideId: 'tomat',
      kind: 'erfaring',
      title: 'Forspiring blev for spinkel uden lys',
      place: 'Forspiring inde',
      soil: 'Såjord',
      excerpt:
        'Mine spirer blev lange og tynde ved vinduet. Med en billig vækstlampe blev de langt mere kompakte og stærke.',
      season: 'Marts 2025',
      helpfulCount: 26,
    },
    {
      id: 'tom-drivhus',
      guideId: 'tomat',
      kind: 'observation',
      title: 'Drivhus gav tre ugers forspring',
      place: 'Drivhus',
      soil: 'Muldjord',
      excerpt:
        'Satte samme sort i drivhus og på friland. Drivhusplanterne var klar til høst knap tre uger før frilandsplanterne.',
      season: 'Sæson 2025',
      helpfulCount: 13,
    },
    {
      id: 'tom-vanding',
      guideId: 'tomat',
      kind: 'log',
      title: 'Vanding ved rødderne, ikke på bladene',
      place: 'Krukke',
      soil: 'Plantejord',
      excerpt:
        'Skiftede til at vande direkte ved jorden om morgenen. Mærkbart færre svampeproblemer resten af sæsonen.',
      season: 'Hele sæsonen',
      helpfulCount: 15,
    },
    {
      id: 'tom-meldug',
      guideId: 'tomat',
      kind: 'observation',
      title: 'Meldug kom efter en fugtig august',
      place: 'Friland',
      soil: 'Havejord',
      excerpt:
        'Bladene fik hvidt belæg sidst i august. Året efter gav mere plads mellem planterne bedre luft — og mindre meldug.',
      season: 'August 2024',
      helpfulCount: 8,
    },
  ],
}

/**
 * Erfaringer for en given guide, sorteret med de mest gavnlige øverst.
 * Returnerer tom liste hvis der ingen er → modulet skjules helt (ingen død blok).
 */
export function erfaringerFor(guideId: string): DyrkerErfaring[] {
  const list = ERFARINGER[guideId] ?? []
  return [...list].sort((a, b) => b.helpfulCount - a.helpfulCount)
}
