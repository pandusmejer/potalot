/**
 * Reminder-relevans — må en forfalden opgave stadig kalde på brugeren?
 *
 * ── Problemet ────────────────────────────────────────────────────────────
 * `sync_task_reminders` har historisk haft ÉN definition af relevans:
 * forfalden. "Udplant chili · planlagt til 13/04" stod derfor stadig som en
 * ulæst påmindelse i slutningen af august, fordi 13/04 ≤ 30/08 er sandt.
 *
 * ── Produktreglen (Anna 30/8) ────────────────────────────────────────────
 * En BRUGEROPRETTET opgave kan fortsat være forsinket, indtil brugeren selv
 * afslutter eller fjerner den. Fire måneders forsinkelse er brugerens eget
 * problem, og Potalot skal ikke beslutte, at mennesket nok ikke mente det
 * længere. Kun MASKIN-AFLEDTE dyrkningsopgaver må udløbe — og kun på
 * fagligt grundlag: mens artens dokumenterede dyrkningsvindue stadig gør
 * handlingen meningsfuld.
 *
 * ── Provenance ───────────────────────────────────────────────────────────
 * `calendar_tasks.source` bærer signalet, men NAVNENE snyder:
 *
 *   'manual'  brugerens egen opgave (opgavedialog, diktafon, gruppechat)
 *   'plant'   OGSÅ brugerens — samme dialog, blot med en plante koblet på.
 *             Feltnavnet lyder maskinafledt og er det IKKE. Se
 *             add-task-dialog.tsx: `source: linkedPlantId ? 'plant' : 'manual'`.
 *   'general' kurateret månedsgøremål, som brugeren selv trykkede "+" på
 *   'guide'   den ENESTE maskin-afledte kilde (task-generation.ts)
 *
 * Kun 'guide' filtreres. Alt andet passerer uændret — også kilder der ikke
 * findes endnu, for en ukendt fremtidig kilde er ikke bevist maskinel.
 *
 * ── Tavshed frem for gæt ─────────────────────────────────────────────────
 * Samme husregel som tidsvindue.ts: kan vi ikke dokumentere vinduet, rører
 * vi ikke opgaven. Manglende eller ukendt canonical data må ALDRIG gøre en
 * eksisterende opgave irrelevant — det ville lade et hul i guidebiblioteket
 * slette brugerens påmindelser.
 *
 * ── Arbejdsdeling med SQL ────────────────────────────────────────────────
 * Denne fil afgør KUN fagligheden. SQL ejer fortsat atomisk dedup,
 * "højst én ulæst pr. opgave", notifikationsloftet og cleanup-invarianterne
 * (00069/00070). Motoren her leverer en BLOKLISTE til RPC'en — ikke en
 * kandidatliste — netop så et tomt eller fejlet opslag giver nøjagtig den
 * adfærd systemet havde før.
 */

import {
  resolveFroebankVinduer,
  resolveHoestMaaneder,
  type FroebankVinduesHandling,
} from '@/lib/froebank-autofill'

/** Den eneste maskin-afledte opgavekilde. Se provenance-noten ovenfor. */
export const MASKINAFLEDT_KILDE = 'guide'

/**
 * Opgavetype → det canonical dyrkningsvindue der dokumenterer handlingen.
 *
 * De fire typer her er dem guidekontrakten faktisk beskriver et vindue for.
 * De ØVRIGE ni (`watering`, `fertilizing`, `pruning`, `pest_check`,
 * `weeding`, `repot`, `maintenance`, `planning`, `custom`) har intet
 * dokumenteret vindue i quickFacts — de er pleje, ikke timing — og
 * filtreres derfor ALDRIG. Det er tavshed efter hensigten, ikke et hul.
 *
 * Eksporteret, fordi task-generation nu DATERER efter samme vindue, som
 * relevansmotoren senere BEDØMMER opgaven mod. Kortet må findes ét sted —
 * to kopier ville genskabe præcis det to-korpus-split, dateringen led af
 * (Docs/product/kalenderregel-semantik-audit.md §4).
 */
export const VINDUE_FOR_OPGAVETYPE: Record<string, FroebankVinduesHandling | 'harvest'> = {
  plant_out: 'plant_out',
  pre_sow: 'pre_sow',
  sowing: 'direct_sow',
  harvest: 'harvest',
}

export interface ReminderKandidat {
  id: string
  /** calendar_tasks.source — se provenance-noten. */
  source: string
  /** calendar_tasks.task_type. */
  taskType: string
  /** Plantens artsnavn (plants_v2.name) — går gennem arts-modellen i opslaget. */
  plantName: string
  /** plants_v2.variety, hvis sorten kendes. */
  variety: string | null
}

export type RelevansGrund =
  /** Ikke maskin-afledt → brugerens egen opgave, aldrig filtreret. */
  | 'ikke_maskinafledt'
  /** Opgavetypen har intet vindue i guidekontrakten (pleje, ikke timing). */
  | 'ingen_vindue_mapping'
  /** Typen HAR et vindue, men guiderne tier om netop denne art/sort. */
  | 'intet_dokumenteret_vindue'
  /** Vinduet er dokumenteret og dækker måneden. */
  | 'vindue_aabent'
  /** Vinduet er dokumenteret og dækker IKKE måneden. */
  | 'vindue_lukket'

export interface Relevans {
  relevant: boolean
  grund: RelevansGrund
  /** Det dokumenterede vindue, når ét blev fundet — ellers null. */
  vindue: number[] | null
}

/**
 * Er opgaven fagligt reminder-relevant i `maaned` (1-12)?
 *
 * ── Hvorfor medlemskab, ikke interval ────────────────────────────────────
 * Vinduet afgøres med `months.includes(maaned)` — et rent medlemskab i den
 * canonical månedsliste. Det er bevidst:
 *
 *  1. Det er præcis den fortolkning resten af appen bruger (frøbank-forslag,
 *     kalenderens frøbank-fane). Ingen ny semantik indføres her.
 *  2. Vinduer der krydser årsskiftet — fx hvidløg med udplantning [10,11] og
 *     høst [6,7], eller en art dokumenteret [11,12,1,2] — falder korrekt ud
 *     UDEN en interval-fortolker. December og januar er hver for sig enten i
 *     listen eller ikke. Der findes intet "vinduet vender ved nytår"-tilfælde
 *     at tage fejl af, fordi vi aldrig regner fra-til.
 *
 * En opgave FØR sit vindue er lige så irrelevant som en efter: guiden siger
 * maj-juni, og i april er udplantning ikke meningsfuld endnu. Det er kun
 * relevant for forfaldne opgaver — og en forfalden opgave før sit eget
 * vindue betyder, at datoen var forkert fra fødslen — dét hul lukkede
 * task-generation 2/9, hvor `relativeOffsetDays` blev gjort underordnet
 * det dokumenterede vindue.
 */
export function vurderReminderRelevans(
  kandidat: ReminderKandidat,
  maaned: number,
): Relevans {
  if (kandidat.source !== MASKINAFLEDT_KILDE) {
    return { relevant: true, grund: 'ikke_maskinafledt', vindue: null }
  }

  const handling = VINDUE_FOR_OPGAVETYPE[kandidat.taskType]
  if (!handling) {
    return { relevant: true, grund: 'ingen_vindue_mapping', vindue: null }
  }

  const maaneder = handling === 'harvest'
    ? resolveHoestMaaneder(kandidat.plantName, kandidat.variety)
    : resolveFroebankVinduer(kandidat.plantName, kandidat.variety)
        .find(v => v.action === handling)?.months ?? null

  if (!maaneder || maaneder.length === 0) {
    return { relevant: true, grund: 'intet_dokumenteret_vindue', vindue: null }
  }

  return maaneder.includes(maaned)
    ? { relevant: true, grund: 'vindue_aabent', vindue: maaneder }
    : { relevant: false, grund: 'vindue_lukket', vindue: maaneder }
}

/**
 * Blokliste til RPC'en: id'erne på de opgaver der IKKE længere er fagligt
 * reminder-relevante. Alt andet — inklusive alt vi er i tvivl om — udelades,
 * så SQL opfører sig præcis som før.
 */
export function ikkeRelevanteOpgaveIder(
  kandidater: ReminderKandidat[],
  maaned: number,
): string[] {
  return kandidater
    .filter(k => !vurderReminderRelevans(k, maaned).relevant)
    .map(k => k.id)
}

/**
 * Måneden set fra Europe/Copenhagen.
 *
 * SQL'ens `v_today` er `(now() AT TIME ZONE 'Europe/Copenhagen')::date`.
 * Serveren kører UTC, så en naiv `getMonth()` ville i op til to timer omkring
 * månedsskiftet vurdere relevans i én måned, mens SQL daterede påmindelsen i
 * en anden. Vinduerne er månedsopløste — så den time er hele forskellen
 * mellem "vinduet er lige åbnet" og "det åbner først i morgen".
 */
export function kalenderMaanedKbh(nu: Date = new Date()): number {
  const maaned = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen',
    month: 'numeric',
  }).format(nu)
  return Number(maaned)
}
