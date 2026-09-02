/**
 * Opgavetype-kontrakten — én canonical liste, delt af guide-generering,
 * task-generering og databasen.
 *
 * ── Produktreglen (Anna 2/9) ─────────────────────────────────────────────
 * AI må ALDRIG kunne skrive en `calendarRule.taskType`, som databasen ikke
 * accepterer. Constrainten udvides IKKE for at rumme AI-opfundne navne —
 * det ville gøre hallucinationer til datamodel.
 *
 * ── Hvorfor filen findes ─────────────────────────────────────────────────
 * `calendar_tasks.task_type` har en CHECK-constraint med 13 værdier
 * (00018_calendar_tasks.sql). De private AI-guides indeholdt 18 andre.
 * 19 af 22 AI-guides bar mindst én af dem, og indsættelsen i
 * `mine-planter.ts` er ét batch: én ugyldig række afviste HELE batchen, og
 * fejlen blev slugt. Resultat i produktion: 2 opgaver med `source='guide'`
 * i alt. Generatoren var reelt ude af drift for de fleste guides — hele
 * diskussionen om datosemantik handlede om et ur, der ikke sad i stikket.
 * Fuld audit: Docs/product/kalenderregel-semantik-audit.md §5.
 *
 * ── Hvorfor et aliaskort, og ikke bare afvisning ─────────────────────────
 * De fleste "ugyldige" navne er ikke opfindelser. `sow`, `prick_out`,
 * `harden_off`, `fertilize`, `prune` og `water` er ORDRET vokabularet fra
 * den oprindelige `tasks`-tabel i 00001_initial_schema.sql. Modellen har
 * lært dem et sted fra, og de betyder præcis det, de altid har betydet.
 * Resten er mappet på REDAKTIONEL præcedens: masterguidernes egne
 * titel→type-par (fx "Prikl chiliplanter om" → `repot`, "Begynd afhærdning
 * af planterne" → `maintenance`, "Knib sideskud" → `pruning`).
 *
 * ── Beviskravet ──────────────────────────────────────────────────────────
 * Et alias kræver ét af to: (a) navnet er legacy-vokabular fra 00001, eller
 * (b) en masterguide typer den samme handling eksplicit. Har et navn ingen
 * af delene, gætter vi IKKE — det normaliseres til `custom`. Samme husregel
 * som tidsvindue.ts og reminder-relevans.ts: tavshed frem for gæt.
 *
 * Særligt om de vindue-bærende typer: `pre_sow`, `sowing`, `plant_out` og
 * `harvest` binder opgaven til et dokumenteret dyrkningsvindue via
 * reminder-relevans.ts. Et forkert alias DERIND er dyrere end et forkert
 * alias til `maintenance`, fordi det giver opgaven et vindue, den ikke har
 * fagligt belæg for. Derfor er de fire de strammest bevogtede.
 */

import type { TaskType } from '@/lib/types'

/**
 * De 13 værdier `calendar_tasks.task_type` accepterer.
 *
 * SKAL være identisk med CHECK-constrainten i 00018_calendar_tasks.sql og
 * med `TaskType` i types.ts. `scripts/test-opgavetype-kontrakt.ts` læser
 * migrationsfilen og fejler, hvis de tre driver fra hinanden.
 */
export const CANONISKE_OPGAVETYPER = [
  'pre_sow', 'sowing', 'repot', 'plant_out', 'watering', 'fertilizing',
  'pruning', 'pest_check', 'harvest', 'weeding', 'maintenance',
  'planning', 'custom',
] as const

/** Modellens egen generiske type. Bruges når vi ikke kan vide bedre. */
export const GENERISK_OPGAVETYPE: TaskType = 'custom'

/** De fire typer der binder en opgave til et dokumenteret dyrkningsvindue. */
export const VINDUEBAERENDE_OPGAVETYPER: readonly TaskType[] = [
  'pre_sow', 'sowing', 'plant_out', 'harvest',
]

/**
 * Kendte synonymer → canonical type. Hver linje bærer sit belæg.
 *
 * Tilføj ALDRIG et alias uden et af de to beviser (legacy eller redaktionel
 * præcedens). Et alias uden belæg er et gæt forklædt som en kontrakt.
 */
const ALIAS: Readonly<Record<string, TaskType>> = {
  // Legacy-vokabular fra 00001_initial_schema.sql (tabellen `tasks`).
  sow: 'sowing',
  water: 'watering',
  fertilize: 'fertilizing',
  prune: 'pruning',
  prick_out: 'repot',
  harden_off: 'maintenance',

  // Redaktionel præcedens — masterguidernes egne titel→type-par.
  pricking_out: 'repot',          // "Prikl tomatplanter om" → repot
  hardening: 'maintenance',       // "Begynd afhærdning af planterne" → maintenance
  support: 'maintenance',         // "Støt store planter ved behov" / "Bind tomater op"
  deadhead: 'maintenance',        // "Fjern visne blomster løbende" → maintenance
  pinch: 'pruning',               // "Knib sideskud på ranketomater" → pruning
  harvest_tubers: 'harvest',      // "Grav knolde op før hård frost" → harvest

  // Entydig stavevariant: modellen skelner forkultivering (`pre_sow`) fra
  // såning (`sowing`), og reminder-relevans.ts slår netop `sowing` op mod
  // direkte-såning-vinduet. `direct_sow` ER altså `sowing` i denne model.
  direct_sow: 'sowing',
}

/**
 * BEVIDST uden alias — navne vi har set, men ikke kan mappe med belæg:
 *
 *   care                 "pasning" dækker vanding, gødning OG maintenance
 *   thin_out             udtynding har ingen canonical modpart
 *   winter_protection    plausibelt maintenance, men uden præcedens
 *   seed_collection      frøindsamling ≠ høst; ville arve høstvinduet
 *   collect_seeds        —"—
 *   bloom / flower       fænologi, ikke en handling brugeren udfører
 *
 * De normaliseres til `custom`. Dukker et af dem op ofte nok til at fortjene
 * en rigtig type, er svaret at UDVIDE modellen bevidst — ikke at gætte her.
 */

export type OpgavetypeKilde = 'canonical' | 'alias' | 'ukendt'

export interface NormaliseretOpgavetype {
  type: TaskType
  kilde: OpgavetypeKilde
  /** Den rå værdi, som den stod i guiden. Bevares til logning. */
  raa: string
}

export function erCanoniskOpgavetype(vaerdi: unknown): vaerdi is TaskType {
  return typeof vaerdi === 'string'
    && (CANONISKE_OPGAVETYPER as readonly string[]).includes(vaerdi)
}

/**
 * Én rå taskType → en type databasen accepterer. Kaster aldrig.
 *
 * Normaliseringen er case- og separator-tolerant ("Plant Out", "plantOut",
 * "plant-out" → `plant_out`), fordi den fejl er stavemåde, ikke betydning.
 */
export function normaliserOpgavetype(raa: unknown): NormaliseretOpgavetype {
  const tekst = typeof raa === 'string' ? raa.trim() : ''
  if (!tekst) return { type: GENERISK_OPGAVETYPE, kilde: 'ukendt', raa: String(raa ?? '') }

  if (erCanoniskOpgavetype(tekst)) return { type: tekst, kilde: 'canonical', raa: tekst }

  // camelCase/kebab/mellemrum → snake_case, så kun BETYDNING kan fejle.
  const noegle = tekst
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()

  if (erCanoniskOpgavetype(noegle)) return { type: noegle, kilde: 'canonical', raa: tekst }
  const alias = ALIAS[noegle]
  if (alias) return { type: alias, kilde: 'alias', raa: tekst }

  return { type: GENERISK_OPGAVETYPE, kilde: 'ukendt', raa: tekst }
}

export interface NormaliseringsResultat {
  /** Reglerne med en canonical `taskType`. Samme rækkefølge, samme antal. */
  regler: unknown[]
  /** Kun de regler hvor typen faktisk blev ændret — til logning. */
  aendringer: Array<{ titel: string; fra: string; til: TaskType; kilde: OpgavetypeKilde }>
}

/**
 * Normalisér `taskType` på hver regel i et `calendarRules`-array.
 *
 * Ingen regel kasseres, og intet andet felt røres — det er en kontraktfejl,
 * ikke et indholdsproblem. En regel, hvis type vi ikke kan tyde, bliver
 * `custom` og overlever; brugeren mister ikke en opgave, fordi modellen
 * fandt på et ord.
 */
export function normaliserKalenderregler(raa: unknown): NormaliseringsResultat {
  if (!Array.isArray(raa)) return { regler: [], aendringer: [] }

  const aendringer: NormaliseringsResultat['aendringer'] = []
  const regler = raa.map(regel => {
    if (!regel || typeof regel !== 'object' || Array.isArray(regel)) return regel
    const r = regel as Record<string, unknown>
    const n = normaliserOpgavetype(r.taskType)
    if (n.kilde === 'canonical' && r.taskType === n.type) return regel
    aendringer.push({
      titel: typeof r.title === 'string' ? r.title : '(uden titel)',
      fra: n.raa,
      til: n.type,
      kilde: n.kilde,
    })
    return { ...r, taskType: n.type }
  })

  return { regler, aendringer }
}
