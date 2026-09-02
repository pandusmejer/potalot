/**
 * READ-ONLY effektmåling: hvad ændrer den nye datosemantik for de regler,
 * der faktisk ligger i produktion?
 *
 * Skriver INTET. Læser `guides` (select) og regner to gange på hver regel:
 * én gang med den gamle `calculateRuleDate`-semantik (offset vinder, ellers
 * første dag i næste anbefalede måned, derefter mine-planters
 * `.filter(date >= idag)`), og én gang med `beregnRegelDato`.
 *
 * Så-datoer: guidens EGNE dokumenterede sådatoer (quickFacts.sowingMonths ∪
 * directSowingMonths, dag 1/10/20/28) — samme metode som audit §2, så tallene
 * kan sammenlignes med den.
 *
 * Kør:  npx tsx scripts/audit-kalenderregel-dato.ts
 */

import { createClient } from '@supabase/supabase-js'
import { beregnRegelDato } from '@/lib/task-generation'
import { normaliserOpgavetype } from '@/lib/kalender/opgavetype'
import { delDato, plusDage, samlDato } from '@/lib/kalender/dyrkningsvindue'
import type { GuideCalendarRule } from '@/lib/types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Mangler NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local)')
  process.exit(1)
}

/** Den gamle semantik, ordret — men i UTC, så tidszone ikke støjer i diffen. */
function gammelDato(rule: GuideCalendarRule, sowDate: string): string | null {
  if (rule.trigger === 'sowingDate' && rule.relativeOffsetDays != null) {
    return plusDage(sowDate, rule.relativeOffsetDays)
  }
  if (rule.recommendedMonths && rule.recommendedMonths.length > 0) {
    const { aar, maaned } = delDato(sowDate)
    const sorteret = [...rule.recommendedMonths].sort((a, b) => a - b)
    const traef = sorteret.find(m => m >= maaned)
    return traef !== undefined ? samlDato(aar, traef, 1) : samlDato(aar + 1, sorteret[0], 1)
  }
  return null
}

interface Raekke {
  id: string
  plant_name: string
  variety: string | null
  is_ai_generated: boolean | null
  user_id: string | null
  quick_facts: Record<string, unknown> | null
  calendar_rules: GuideCalendarRule[] | null
}

async function main() {
  const supabase = createClient(url!, key!, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('guides')
    .select('id, plant_name, variety, is_ai_generated, user_id, quick_facts, calendar_rules')
  if (error) { console.error(error); process.exit(1) }

  const guides = (data as Raekke[]).filter(g => (g.calendar_rules?.length ?? 0) > 0)

  // Scenarier for registreringsdagen. (a) isolerer datosemantikken;
  // (b) viser hvad den tilbagevirkende regel gør en konkret dag.
  const scenarier: { navn: string; idag: (sow: string) => string }[] = [
    { navn: 'a · registreret samme dag som såning', idag: sow => sow },
    { navn: 'b · registreret 2/9 2026 (tilbagevirkende)', idag: () => '2026-09-02' },
  ]

  for (const scenarie of scenarier) {
    let uaendret = 0, flyttet = 0, nyeDrop = 0, nyeBevaret = 0, beggeDrop = 0
    const flytteEksempler = new Map<string, { fra: string; til: string; antal: number; spaend: number }>()
    const dropEksempler = new Map<string, number>()
    const bevaretEksempler = new Map<string, number>()
    let regler = 0, kombinationer = 0
    const tidligere: { noegle: string; gammel: string; ny: string }[] = []
    const senere: { noegle: string; gammel: string; ny: string }[] = []

    for (const g of guides) {
      const qf = (g.quick_facts ?? {}) as Record<string, number[] | undefined>
      const saaMaaneder = [...new Set([...(qf.sowingMonths ?? []), ...(qf.directSowingMonths ?? [])])]
        .sort((a, b) => a - b)
      // Guides uden dokumenterede sådatoer: brug alle 12 måneder, ellers
      // ville de forsvinde ud af målingen.
      const maaneder = saaMaaneder.length > 0 ? saaMaaneder : Array.from({ length: 12 }, (_, i) => i + 1)

      for (const rule of g.calendar_rules ?? []) {
        regler++
        const opgavetype = normaliserOpgavetype(rule.taskType).type
        // Samme filter som produktionen: netop-såede opgaver oprettes ikke.
        if (opgavetype === 'sowing' || opgavetype === 'pre_sow') continue

        for (const m of maaneder) {
          for (const dag of [1, 10, 20, 28]) {
            const sow = samlDato(2026, m, dag)
            const idag = scenarie.idag(sow)
            kombinationer++

            const raa = gammelDato(rule, sow)
            const gammel = raa && raa >= idag ? raa : null
            const ny = beregnRegelDato({
              rule, opgavetype, sowDate: sow,
              plantName: g.plant_name, variety: g.variety, idag,
            }).dato

            const noegle = `${g.plant_name}${g.variety ? ' · ' + g.variety : ''} — ${rule.title}`
            if (gammel === ny) { if (gammel === null) beggeDrop++; else uaendret++; continue }
            if (gammel && ny) {
              flyttet++
              if (ny < gammel) tidligere.push({ noegle, gammel, ny })
              else senere.push({ noegle, gammel, ny })
              const e = flytteEksempler.get(noegle)
              const spaend = Math.abs(Date.parse(ny) - Date.parse(gammel)) / 86_400_000
              if (e) { e.antal++; e.spaend = Math.max(e.spaend, spaend) }
              else flytteEksempler.set(noegle, { fra: gammel, til: ny, antal: 1, spaend })
            } else if (gammel && !ny) {
              nyeDrop++
              dropEksempler.set(noegle, (dropEksempler.get(noegle) ?? 0) + 1)
            } else {
              nyeBevaret++
              bevaretEksempler.set(noegle, (bevaretEksempler.get(noegle) ?? 0) + 1)
            }
          }
        }
      }
    }

    console.log(`\n${'═'.repeat(72)}\nSCENARIE ${scenarie.navn}`)
    console.log(`${'═'.repeat(72)}`)
    console.log(`  guides med regler ......... ${guides.length}`)
    console.log(`  regler i alt .............. ${regler}`)
    console.log(`  (regel × så-dato) målt .... ${kombinationer}`)
    console.log(`  ── udfald ────────────────────────────────`)
    console.log(`  samme dato som før ........ ${uaendret}`)
    console.log(`  ANDEN dato ................ ${flyttet}`)
    console.log(`  oprettes ikke længere ..... ${nyeDrop}`)
    console.log(`  oprettes nu, blev tabt før  ${nyeBevaret}`)
    console.log(`  droppet i begge semantikker ${beggeDrop}`)

    const vis = (titel: string, m: Map<string, unknown>, n = 12) => {
      if (m.size === 0) return
      console.log(`\n  ${titel} (${m.size} distinkte regler, viser ${Math.min(n, m.size)}):`)
      let i = 0
      for (const [k, v] of m) {
        if (i++ >= n) break
        const d = v as { fra?: string; til?: string; antal?: number; spaend?: number } | number
        console.log(typeof d === 'number'
          ? `    · ${k} — ${d} så-datoer`
          : `    · ${k}\n        ${d.antal} så-datoer · fx ${d.fra} → ${d.til} · max forskydning ${d.spaend} dage`)
      }
    }
    vis('Regler der får en anden dato', flytteEksempler)
    vis('Regler der ikke længere oprettes', dropEksempler)
    vis('Regler der nu overlever', bevaretEksempler)

    // Retningen betyder noget: en opgave, der rykkes FREM i tid, venter på
    // sit vindue. En, der rykkes TILBAGE, er trukket ind i vinduets åbning
    // og kan lande måneder før, brugeren ville forvente.
    const stort = (l: typeof tidligere) => {
      const m = new Map<string, number>()
      for (const r of l) {
        const d = Math.abs(Date.parse(r.ny) - Date.parse(r.gammel)) / 86_400_000
        if (d > 30) m.set(r.noegle, Math.max(m.get(r.noegle) ?? 0, d))
      }
      return m
    }
    console.log(`\n  retning: ${senere.length} skubbet senere · ${tidligere.length} trukket tidligere`)
    for (const [titel, l] of [['trukket TIDLIGERE end 30 dage', tidligere], ['skubbet SENERE end 30 dage', senere]] as const) {
      const m = stort(l)
      if (m.size === 0) { console.log(`    ingen ${titel}`); continue }
      console.log(`    ${titel}:`)
      for (const [k, d] of [...m].sort((a, b) => b[1] - a[1])) console.log(`      · ${k} — op til ${d} dage`)
    }
  }

  console.log('\nIngen skrivninger foretaget. Read-only.\n')
}

main()
