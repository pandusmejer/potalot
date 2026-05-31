'use server'

/**
 * Havebog server-aggregeringer — read-only mod eksisterende DB-tabeller
 * (plant_logs, plants_v2, inventory).
 *
 * Returnerer null hvis ingen logget-ind bruger → page.tsx falder tilbage
 * på lokal demo-data fra src/data/havebog-demo.ts.
 *
 * INGEN schema-ændringer. INGEN write-operationer. INGEN ændringer i
 * Kalender/Planter/Frøbank actions.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type {
  HeroStats,
  OnThisDayEntry,
  RecentNote,
  HistoryYear,
  DenneSaesonFacts,
  ArchivedPlant,
  LogType,
} from '@/data/havebog-demo'

export interface HavebogData {
  heroStats: HeroStats
  onThisDay: OnThisDayEntry[]
  recentNotes: RecentNote[]
  history: HistoryYear[]
  denneSaeson: DenneSaesonFacts
  archivedPlants: ArchivedPlant[]
}

interface PlantLogRow {
  id: string
  plant_id: string
  date: string
  type: string
  title: string | null
  note: string | null
  image_urls: string[] | null
}

interface PlantRow {
  id: string
  name: string
  variety: string | null
  is_archived: boolean
  archived_year: number | null
  archived_at: string | null
  primary_image_url: string | null
}

const MONTH_NAMES_DA = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December',
]

export async function getHavebogData(): Promise<HavebogData | null> {
  const me = await getCurrentUser()
  if (!me) return null

  const supabase = await createClient()

  // Robust mod manglende tabeller / fejl: hver query har sin egen
  // fallback. Hvis noget går galt, returnerer vi null → demo-data
  // overtager i page.tsx (bedre end at blokere siden).
  try {
    const [logsRes, plantsRes, inventoryRes] = await Promise.all([
      supabase
        .from('plant_logs_v2')
        .select('id, plant_id, date, type, title, note, image_urls')
        .eq('user_id', me.id)
        .order('date', { ascending: false }),
      supabase
        .from('plants_v2')
        .select('id, name, variety, is_archived, archived_year, archived_at, primary_image_url')
        .eq('user_id', me.id),
      supabase
        .from('inventory_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', me.id),
    ])

    const logs = (logsRes.data ?? []) as PlantLogRow[]
    const plants = (plantsRes.data ?? []) as PlantRow[]
    const inventoryCount = inventoryRes.count ?? 0

    const plantById = new Map(plants.map(p => [p.id, p]))
    const plantName = (id: string): string => plantById.get(id)?.name ?? '—'
    const plantVariety = (id: string): string | undefined =>
      plantById.get(id)?.variety ?? undefined

    const today = new Date()
    const currentYear = today.getFullYear()

    // ── Hero stats ───────────────────────────────────────────
    const harvestsThisYear = logs.filter(
      l => l.type === 'harvest' && l.date.startsWith(String(currentYear)),
    ).length
    const heroStats: HeroStats = {
      notes: logs.length,
      varieties: inventoryCount,
      harvests: harvestsThisYear,
    }

    // ── På denne dag ─────────────────────────────────────────
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()
    const onThisDay: OnThisDayEntry[] = logs
      .filter(l => {
        const d = new Date(l.date)
        return (
          d.getMonth() + 1 === todayMonth &&
          d.getDate() === todayDay &&
          d.getFullYear() < currentYear
        )
      })
      .slice(0, 3)
      .map(l => ({
        yearsAgo: currentYear - new Date(l.date).getFullYear(),
        plantName: plantName(l.plant_id),
        variety: plantVariety(l.plant_id),
        text: l.note ?? l.title ?? '',
        imageUrl: l.image_urls?.[0] ?? null,
      }))

    // ── Seneste noter (5) ────────────────────────────────────
    const recentNotes: RecentNote[] = logs.slice(0, 5).map(l => ({
      type: (l.type as LogType) ?? 'note',
      plantName: plantName(l.plant_id),
      variety: plantVariety(l.plant_id),
      text: l.note ?? l.title ?? '',
      date: l.date,
    }))

    // ── Historik (år → måneder) med metadata ─────────────────
    const byYearMonth = new Map<
      number,
      Map<number, { logs: PlantLogRow[]; varieties: Set<string> }>
    >()
    for (const l of logs) {
      const d = new Date(l.date)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      if (!byYearMonth.has(y)) byYearMonth.set(y, new Map())
      const monthsMap = byYearMonth.get(y)!
      if (!monthsMap.has(m)) monthsMap.set(m, { logs: [], varieties: new Set() })
      const bucket = monthsMap.get(m)!
      bucket.logs.push(l)
      const p = plantById.get(l.plant_id)
      if (p) bucket.varieties.add(`${p.name}|${p.variety ?? ''}`)
    }
    const history: HistoryYear[] = [...byYearMonth.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, monthsMap]) => ({
        year,
        months: [...monthsMap.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([monthIdx, bucket]) => {
            const imageUrls = bucket.logs
              .flatMap(l => l.image_urls ?? [])
              .filter(Boolean)
            return {
              monthIdx,
              monthName: MONTH_NAMES_DA[monthIdx - 1],
              noteCount: bucket.logs.length,
              imageCount: imageUrls.length,
              varietyCount: bucket.varieties.size,
              imageUrls: imageUrls.slice(0, 12),
            }
          }),
      }))

    // ── Denne sæson (3 faktuelle kort) ───────────────────────
    const senesteHoest = logs.find(l => l.type === 'harvest')
    const senesteNote = logs.find(
      l => l.type === 'note' || l.type === 'observation' || l.type === 'reminder',
    )
    const senesteBillede = logs.find(l => (l.image_urls?.length ?? 0) > 0)
    const denneSaeson: DenneSaesonFacts = {
      senesteHoest: senesteHoest
        ? {
            plantName: plantName(senesteHoest.plant_id),
            variety: plantVariety(senesteHoest.plant_id),
            date: senesteHoest.date,
            text: senesteHoest.note ?? senesteHoest.title ?? undefined,
          }
        : null,
      senesteNote: senesteNote
        ? {
            plantName: plantName(senesteNote.plant_id),
            variety: plantVariety(senesteNote.plant_id),
            date: senesteNote.date,
            text: senesteNote.note ?? senesteNote.title ?? '',
            type: (senesteNote.type as LogType) ?? 'note',
          }
        : null,
      senesteBillede:
        senesteBillede && senesteBillede.image_urls && senesteBillede.image_urls[0]
          ? {
              plantName: plantName(senesteBillede.plant_id),
              variety: plantVariety(senesteBillede.plant_id),
              date: senesteBillede.date,
              imageUrl: senesteBillede.image_urls[0],
            }
          : null,
    }

    // ── Arkiverede planter ───────────────────────────────────
    const archivedPlants: ArchivedPlant[] = plants
      .filter(p => p.is_archived)
      .sort((a, b) => (b.archived_at ?? '').localeCompare(a.archived_at ?? ''))
      .map(p => ({
        id: p.id,
        name: p.name,
        variety: p.variety,
        primaryImageId: p.primary_image_url,
        archivedYear:
          p.archived_year ??
          (p.archived_at ? new Date(p.archived_at).getFullYear() : currentYear),
      }))

    return { heroStats, onThisDay, recentNotes, history, denneSaeson, archivedPlants }
  } catch {
    return null
  }
}
