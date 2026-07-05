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
  /** Dyrkningsforhold — vises som små chips (drivhus, friland, krukke, jord). */
  conditions: string[]
  excerpt: string
  /** Sæson eller måned, fx "Sommer 2025" / "August". */
  season: string
  /** Hvor mange andre dyrkere der har haft gavn af observationen. */
  helpfulCount: number
}

const ERFARINGER: Record<string, DyrkerErfaring[]> = {
  'tomat-san-marzano': [
    {
      id: 'sm-log-knibning',
      guideId: 'tomat-san-marzano',
      kind: 'log',
      title: 'Ugentlig knibning gav markant større klaser',
      conditions: ['Drivhus', 'Krukke 20 L'],
      excerpt:
        'Fjernede alle sideskud én gang om ugen og toppede planten sidst i august. Færre men tydeligt større og mere ensartede klaser end året før.',
      season: 'Juli–sep 2025',
      helpfulCount: 21,
    },
    {
      id: 'sm-obs-blomsterende',
      guideId: 'tomat-san-marzano',
      kind: 'observation',
      title: 'Blomsterendefald ved uregelmæssig vanding',
      conditions: ['Drivhus'],
      excerpt:
        'De første frugter fik sorte, indsunkne pletter i bunden. Det stoppede da jeg vandede jævnt hver morgen og tilførte lidt kalk til jorden.',
      season: 'Juni',
      helpfulCount: 17,
    },
    {
      id: 'sm-erf-opbinding',
      guideId: 'tomat-san-marzano',
      kind: 'erfaring',
      title: 'Skulle bindes op tidligere end jeg troede',
      conditions: ['Drivhus', 'Ranketomat'],
      excerpt:
        'Planterne skød hurtigt i vejret i juni. Jeg ventede for længe, og et par stængler knækkede under vægten. Næste år binder jeg op allerede ved 40 cm.',
      season: 'Sommer 2025',
      helpfulCount: 14,
    },
    {
      id: 'sm-obs-vanding',
      guideId: 'tomat-san-marzano',
      kind: 'observation',
      title: 'Sparsom vanding gav tykkere sauce',
      conditions: ['Friland', 'Sandet jord'],
      excerpt:
        'Vandede kun lidt de sidste par uger før høst. Frugterne blev en anelse mindre, men mere kødfulde — saucen kogte hurtigere ind.',
      season: 'August',
      helpfulCount: 9,
    },
  ],
  tomat: [
    {
      id: 'tom-erf-forspiring',
      guideId: 'tomat',
      kind: 'erfaring',
      title: 'Forspiring i vindueskarm blev for spinkel',
      conditions: ['Indendørs forspiring'],
      excerpt:
        'Mine spirer blev lange og tynde ved vinduet. Med en billig vækstlampe et par timer om dagen blev de langt mere kompakte og stærke.',
      season: 'Marts',
      helpfulCount: 26,
    },
    {
      id: 'tom-obs-drivhus',
      guideId: 'tomat',
      kind: 'observation',
      title: 'Drivhus gav næsten tre ugers tidligere høst',
      conditions: ['Drivhus', 'Friland'],
      excerpt:
        'Satte samme sort i drivhus og på friland side om side. Drivhusplanterne var klar til høst knap tre uger før frilandsplanterne.',
      season: 'Sommer 2025',
      helpfulCount: 13,
    },
    {
      id: 'tom-log-vanding',
      guideId: 'tomat',
      kind: 'log',
      title: 'Vanding ved rødderne, ikke på bladene',
      conditions: ['Drivhus', 'Krukke'],
      excerpt:
        'Skiftede til at vande direkte ved jorden om morgenen i stedet for oppefra. Mærkbart færre svampeproblemer resten af sæsonen.',
      season: 'Hele sæsonen',
      helpfulCount: 15,
    },
    {
      id: 'tom-obs-meldug',
      guideId: 'tomat',
      kind: 'observation',
      title: 'Meldug kom efter en fugtig august',
      conditions: ['Friland'],
      excerpt:
        'Bladene fik hvidt belæg sidst i august. Året efter gav mere plads mellem planterne bedre luft — og langt mindre meldug.',
      season: 'August',
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
