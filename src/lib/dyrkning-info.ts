/**
 * Hvad ved vi om en konkret dyrkning — og hvor står det?
 *
 * Datarelationerne (verificeret mod produktionsdata 7/11 2026, kun læsende):
 *
 *   plants_v2.id  ←──  sowing_events.plant_id        (hver såning peger på sin plante)
 *   plants_v2.id  ←──  calendar_tasks.linked_plant_id (hver opgave peger på sin plante)
 *
 * To dyrkninger af samme sort fra samme frøpose har SAMME source_inventory_id og
 * ofte samme sådato; det eneste, der skiller dem, er plante-id'et og det, der
 * står på deres såninger:
 *
 *   • sowing_events.container_type  — "Sået i" i Så-dialogen (Drivhus, Direkte
 *     friland, Højbed …). Dét brugeren kalder "drivhus" og "friland".
 *   • plants_v2.location / sowing_events.location — "Placering" (fritekst, fx
 *     "Vandingskasse"); valgfri og ofte tom.
 *
 * Opgaven kender kun sin plante. Derfor slås dyrkningsstedet op pr. PLANTE-ID,
 * aldrig pr. sort, sted eller dato.
 *
 * Skal forblive en ren funktion uden imports (bruges i klient, server og tests).
 */

export interface DyrkningPlante {
  id: string
  name: string
  variety?: string | null
  /** plants_v2.location (Placering) */
  location?: string | null
  /** plants_v2.sow_date */
  sowDate?: string | null
}

export interface DyrkningSaaning {
  plantId: string
  /** sowing_events.container_type ("Sået i") */
  containerType?: string | null
  /** sowing_events.location (Placering på såningen) */
  location?: string | null
  /** sowing_events.sowing_date (YYYY-MM-DD) */
  sowingDate?: string | null
  createdAt?: string | null
}

export interface Dyrkning {
  id: string
  name: string
  variety: string | null
  /** "Sået i": Drivhus, Direkte friland … (flere, hvis såningerne er forskellige) */
  container: string | null
  /** Placering: Vandingskasse, Højbed 2 … */
  sted: string | null
  /** Første såning (YYYY-MM-DD) */
  saadato: string | null
}

const rent = (s: string | null | undefined): string | null => {
  const t = s?.trim()
  return t ? t : null
}

/** Ældste såning først (dato, derefter oprettelsestidspunkt) — entydig rækkefølge. */
function ældstFørst(a: DyrkningSaaning, b: DyrkningSaaning): number {
  const d = (a.sowingDate ?? '').localeCompare(b.sowingDate ?? '')
  return d !== 0 ? d : (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
}

/**
 * Knyt såningerne til deres plante og afled, hvad en gruppeoverskrift skal vise.
 *
 * Regler (entydige):
 *   • En såning hører til planten med samme id — ellers til ingen.
 *   • sted = plantens Placering; findes den ikke, den ældste sånings Placering.
 *   • container = de forskellige "Sået i"-værdier i såningsrækkefølge. Har en
 *     dyrkning fået flere såninger (lagt til samme dyrkning), vises alle
 *     forskellige værdier, hver kun én gang.
 *   • saadato = plantens sådato; findes den ikke, den ældste sånings dato.
 */
export function byggDyrkninger(
  planter: DyrkningPlante[],
  saaninger: DyrkningSaaning[],
): Record<string, Dyrkning> {
  const pr: Map<string, DyrkningSaaning[]> = new Map()
  for (const s of saaninger) {
    const liste = pr.get(s.plantId)
    if (liste) liste.push(s)
    else pr.set(s.plantId, [s])
  }

  const ud: Record<string, Dyrkning> = {}
  for (const p of planter) {
    const mine = [...(pr.get(p.id) ?? [])].sort(ældstFørst)
    const containere: string[] = []
    for (const s of mine) {
      const c = rent(s.containerType)
      if (c && !containere.some((x) => x.toLowerCase() === c.toLowerCase())) containere.push(c)
    }
    ud[p.id] = {
      id: p.id,
      name: p.name,
      variety: rent(p.variety),
      container: containere.length > 0 ? containere.join(' / ') : null,
      sted: rent(p.location) ?? mine.map((s) => rent(s.location)).find((x) => x !== null) ?? null,
      saadato: rent(p.sowDate) ?? mine.map((s) => rent(s.sowingDate)).find((x) => x !== null) ?? null,
    }
  }
  return ud
}

/** "Drivhus · Vandingskasse" — det, der skiller to dyrkninger af samme sort. */
export function dyrkningsSted(d: Pick<Dyrkning, 'container' | 'sted'> | null | undefined): string | null {
  if (!d) return null
  const dele: string[] = []
  for (const x of [d.container, d.sted]) {
    if (x && !dele.some((y) => y.toLowerCase() === x.toLowerCase())) dele.push(x)
  }
  return dele.length > 0 ? dele.join(' · ') : null
}
