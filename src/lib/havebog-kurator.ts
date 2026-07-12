/**
 * Havebog-kuratoren (V17) — redaktøren.
 *
 * Det fulde hus (15 rum) er en design-lab-version, ikke produktet.
 * En rigtig bruger må højst møde 7 rum pr. åbning:
 *
 *   FASTE (altid, forsiden)      hero · dagtæller · ildsted   (3)
 *   ROTERENDE (vælg 2-4/dag)     efter sæson, data, relevans
 *   NEDERSTE (kun når relevant)  arkiv m.m.
 *
 * To ufravigelige regler:
 *   1. Maks 7 rum i alt → de faste 3 + højst 4 kuraterede.
 *   2. Et rum uden ÆGTE data vises ALDRIG til en rigtig bruger
 *      (ærligheds-reglen). harData er den hårde gate.
 *
 * Demo bypasser kuratoren og viser hele huset — det er design-lab'et.
 * Denne kurator gælder kun den indloggede brugers produktflade.
 *
 * Sæson-prioritet (Annas spec):
 *   Sommer  → Spisekammer, Minder, Tal til din have, Vendepunkter
 *   Vinter  → Inspirér mig, Kompetencer, Projekter, På denne dag
 */

export type RumId =
  | 'talTilDinHave'
  | 'inspirerMig'
  | 'maaskeDuOgsaa'
  | 'dyrkerstatus'
  | 'dyrkerkompetencer'
  | 'paaDenneDag'
  | 'minder'
  | 'vendepunkter'
  | 'spisekammer'
  | 'projekter'
  | 'bedrifter'
  | 'vejret'
  | 'populaert'
  | 'historienFortsaetter'

type Saeson = 'foraar' | 'sommer' | 'efteraar' | 'vinter'

interface RumDef {
  id: RumId
  tier: 'roterende' | 'nederste'
  /** Sæson-vægt 0-3 — hvor højt rummet prioriteres i hver sæson */
  vaegt: Record<Saeson, number>
}

// Læserækkefølge = stabil tie-break ved ens vægt.
const RUM: RumDef[] = [
  { id: 'talTilDinHave',     tier: 'roterende', vaegt: { foraar: 2, sommer: 3, efteraar: 2, vinter: 1 } },
  { id: 'spisekammer',       tier: 'roterende', vaegt: { foraar: 1, sommer: 3, efteraar: 2, vinter: 0 } },
  { id: 'minder',            tier: 'roterende', vaegt: { foraar: 1, sommer: 3, efteraar: 2, vinter: 2 } },
  { id: 'vendepunkter',      tier: 'roterende', vaegt: { foraar: 2, sommer: 2, efteraar: 3, vinter: 1 } },
  { id: 'inspirerMig',       tier: 'roterende', vaegt: { foraar: 3, sommer: 1, efteraar: 1, vinter: 3 } },
  { id: 'maaskeDuOgsaa',     tier: 'roterende', vaegt: { foraar: 2, sommer: 2, efteraar: 2, vinter: 2 } },
  { id: 'dyrkerkompetencer', tier: 'roterende', vaegt: { foraar: 2, sommer: 0, efteraar: 1, vinter: 3 } },
  { id: 'projekter',         tier: 'roterende', vaegt: { foraar: 2, sommer: 1, efteraar: 2, vinter: 3 } },
  { id: 'paaDenneDag',       tier: 'roterende', vaegt: { foraar: 2, sommer: 1, efteraar: 2, vinter: 3 } },
  { id: 'bedrifter',         tier: 'roterende', vaegt: { foraar: 1, sommer: 1, efteraar: 2, vinter: 2 } },
  { id: 'dyrkerstatus',      tier: 'roterende', vaegt: { foraar: 1, sommer: 1, efteraar: 1, vinter: 1 } },
  { id: 'vejret',            tier: 'roterende', vaegt: { foraar: 2, sommer: 2, efteraar: 1, vinter: 1 } },
  // Nederste — bunden af opslaget, kun når data findes
  { id: 'historienFortsaetter', tier: 'nederste', vaegt: { foraar: 1, sommer: 1, efteraar: 2, vinter: 2 } },
  { id: 'populaert',            tier: 'nederste', vaegt: { foraar: 1, sommer: 1, efteraar: 1, vinter: 1 } },
]

function saeson(maaned: number): Saeson {
  if (maaned >= 3 && maaned <= 5) return 'foraar'
  if (maaned >= 6 && maaned <= 8) return 'sommer'
  if (maaned >= 9 && maaned <= 11) return 'efteraar'
  return 'vinter'
}

export interface KuratorCtx {
  maaned: number // 1-12
  /** Har rummet ÆGTE data at vise? Falsk = vises ikke til rigtig bruger. */
  harData: Partial<Record<RumId, boolean>>
  /**
   * Samlet antal kuraterede rum (roterende + nederste) ud over de faste.
   * Default 4. Sæt til 3 når "Tal til din have" rendres som et fast 4.
   * rum, så det samlede opslag holder sig på maks 7.
   */
  maks?: number
}

/**
 * Vælg dagens kuraterede rum (ud over de faste). Kun rum med ægte data
 * kommer i betragtning. Antallet cappes af ctx.maks (default 4).
 */
export function kurater(ctx: KuratorCtx): RumId[] {
  const s = saeson(ctx.maaned)
  const harData = (id: RumId) => ctx.harData[id] === true

  const roterende = RUM
    .filter(r => r.tier === 'roterende' && harData(r.id))
    .sort((a, b) => b.vaegt[s] - a.vaegt[s])

  const nederste = RUM.filter(r => r.tier === 'nederste' && harData(r.id))

  const MAKS = ctx.maks ?? 4
  const harNederste = nederste.length > 0
  const roterendeMaks = harNederste ? MAKS - 1 : MAKS

  const valgt: RumId[] = roterende.slice(0, roterendeMaks).map(r => r.id)
  if (harNederste) valgt.push(nederste[0].id)

  return valgt
}
