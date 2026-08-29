/**
 * Fortolkning af `general_garden_tasks.time_window` (ANNA-LÅST 26/8).
 *
 * ── Reglen ───────────────────────────────────────────────────────────────
 * `time_window` må KUN påvirke planner-gruppen, når Potalot kan fortolke
 * vinduet deterministisk ud fra datoen. Betingede formuleringer ("efter
 * høst", "når forsythia blomstrer") kvalificerer ALDRIG automatisk til
 * "Gør nu" — Potalot ved ikke, om betingelsen er indtruffet.
 *
 * ── Hvorfor filen findes ─────────────────────────────────────────────────
 * Planneren udledte "Gør nu" af kategori + prioritet alene og læste slet
 * ikke `time_window`. Et gøremål med vinduet "fra midt august" stod derfor
 * under "Gør nu" den 5. august, og "Beskær hindbær efter høst" står der
 * uanset om brugeren har høstet. 24 aktive gøremål på tværs af 10 måneder
 * bærer et delvist månedsvindue, som motoren ignorerede.
 *
 * ── Fri tekst er en midlertidig kilde ────────────────────────────────────
 * Feltet er redaktionel fri tekst. Vi mapper de KENDTE former eksplicit og
 * svarer 'ukendt' på alt andet — så en ny formulering fører til tavshed
 * (uændret adfærd), aldrig til et gæt. På sigt bør vinduet være et
 * struktureret felt, ikke prosa.
 *
 * ── Dansk kalender-konvention ────────────────────────────────────────────
 *   primo / start / tidlig  → den 1.
 *   medio / midt           → den 11.
 *   ultimo / slut          → den 21.
 * Ved intervaller ("medio til slut maj") gælder vinduets START.
 */

export type Tidsvindue =
  /** Hele måneden — "august", "hele august", "fra august", tom værdi. */
  | { slags: 'hele_maaneden' }
  /** Åbner en bestemt dag i måneden — "fra midt august", "slut oktober". */
  | { slags: 'fra_dag'; dag: number }
  /** Betinget begivenhed — "efter høst", "når bærrene begynder at modne". */
  | { slags: 'betinget' }
  /** Kendt vi ikke formen — vi gætter ikke, og gruppen påvirkes ikke. */
  | { slags: 'ukendt' }

/** Dagen et delvindue åbner. Dansk konvention, ikke opfundet til lejligheden. */
const DELVINDUE_DAG: Array<{ moenster: RegExp; dag: number }> = [
  { moenster: /\b(primo|start|tidlig)\b/i, dag: 1 },
  { moenster: /\b(medio|midt)\b/i, dag: 11 },
  { moenster: /\b(ultimo|slut)\b/i, dag: 21 },
]

/**
 * Betingede vinduer: begivenheder Potalot ikke kan vide er indtruffet.
 * BEVIDST snæver — kun "efter …" og "når …". Vejrafhængige former
 * ("milde tørre dage", "ved tørke") er en TREDJE semantik, som endnu ikke
 * er klassificeret; de svarer 'ukendt' og lader gruppen være uændret.
 */
const BETINGET = /^\s*(efter|når)\b/i

export function tolkTidsvindue(timeWindow?: string | null): Tidsvindue {
  const tekst = (timeWindow ?? '').trim()
  if (!tekst) return { slags: 'hele_maaneden' }
  if (BETINGET.test(tekst)) return { slags: 'betinget' }

  // "hele august" / "august" / "fra august" — hele måneden, intet delvindue.
  // Findes der et delvindue-ord, vinder det FØRSTE (vinduets start).
  let tidligste: { dag: number; index: number } | null = null
  for (const { moenster, dag } of DELVINDUE_DAG) {
    const traef = moenster.exec(tekst)
    if (!traef) continue
    if (!tidligste || traef.index < tidligste.index) {
      tidligste = { dag, index: traef.index }
    }
  }
  if (tidligste) return { slags: 'fra_dag', dag: tidligste.dag }

  // Ren måned ("august", "hele august", "fra august", "marts til april").
  if (/^(hele\s+|fra\s+)?[a-zæøå]+(\s+til\s+[a-zæøå]+)?$/i.test(tekst)) {
    return { slags: 'hele_maaneden' }
  }
  return { slags: 'ukendt' }
}

/**
 * Er vinduet åbent, når brugeren kigger på `viewMonth`?
 *
 * `null` = vi kan ikke afgøre det (ukendt form) → kalderen lader gruppen
 * være uændret. `false` = vinduet er endnu ikke åbnet i denne måned.
 *
 * Dag-sammenligningen giver kun mening for den AKTUELLE måned. Bladrer
 * brugeren til en anden måned, er et delvindue stadig "senere på måneden"
 * — det er sandt uanset dagens dato.
 */
export function vinduetErAabent(
  vindue: Tidsvindue,
  viewMonth: number,
  idag: Date,
): boolean | null {
  switch (vindue.slags) {
    case 'hele_maaneden':
      return true
    case 'betinget':
      return false
    case 'ukendt':
      return null
    case 'fra_dag':
      if (viewMonth !== idag.getMonth() + 1) return false
      return idag.getDate() >= vindue.dag
  }
}

/** Planner-grupperne. Defineret her, så gruppe-reglen kan testes uden UI. */
export type PlannerGruppe =
  | 'goer_nu'
  | 'senere_paa_maaneden'
  | 'hold_oeje_med'
  | 'hvis_du_har_tid'

/**
 * Den endelige gruppe for et gøremål (ANNA-LÅST 26/8).
 *
 *   goer_nu             vinduet er åbent, eller gøremålet gælder hele måneden
 *   senere_paa_maaneden dato-fortolkeligt vindue, der endnu ikke er åbnet
 *   hvis_du_har_tid     betinget ("efter høst") → ud af topgrupperne
 *
 * `basisGruppe` kommer fra kategori/prioritet. Kun "Gør nu" er en TIDSLIG
 * påstand, så kun den kan flyttes af vinduet — risiko- og lavprioritets-
 * grupperne står uændret. Er vinduets form ukendt, røres gruppen ikke:
 * tavshed, ikke gæt.
 */
export function effektivPlannerGruppe(
  basisGruppe: PlannerGruppe,
  timeWindow: string | null | undefined,
  viewMonth: number,
  idag: Date,
): PlannerGruppe {
  if (basisGruppe !== 'goer_nu') return basisGruppe
  const vindue = tolkTidsvindue(timeWindow)
  const aabent = vinduetErAabent(vindue, viewMonth, idag)
  if (aabent !== false) return 'goer_nu'
  return vindue.slags === 'betinget' ? 'hvis_du_har_tid' : 'senere_paa_maaneden'
}
