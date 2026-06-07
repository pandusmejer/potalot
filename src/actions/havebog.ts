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
  Tidslinje,
  HeroNarrative,
  NaturObservation,
} from '@/data/havebog-demo'

export interface HavebogData {
  heroStats: HeroStats
  tidslinje: Tidslinje
  heroNarrative: HeroNarrative
  naturenLigeNu: NaturObservation[]
  onThisDay: OnThisDayEntry[]
  recentNotes: RecentNote[]
  history: HistoryYear[]
  denneSaeson: DenneSaesonFacts
  archivedPlants: ArchivedPlant[]
}

/**
 * Sæson-observations-pool. 3 observationer pr. måned, redaktionelt
 * skrevet — disse er ikke handlings-prompts (det er Kalender's job)
 * men sensoriske/naturhistoriske notater. "Bierne besøger de første
 * blomster" frem for "vand tomaterne".
 *
 * Roterer pr. måned. Real-data action vælger den indeks-baserede
 * variant for aktuel måned.
 */
const NATUREN_LIGE_NU_BY_MONTH: NaturObservation[][] = [
  // Januar
  [
    { symbol: '❄', text: 'Frosten holder jorden i ro' },
    { symbol: '🌰', text: 'Frøkapsler bryder under sneen' },
    { symbol: '🪶', text: 'Mejserne fouragerer i nøgne grene' },
  ],
  // Februar
  [
    { symbol: '🌱', text: 'Vintergækkernes første spirer' },
    { symbol: '☀', text: 'Lyset bliver længere hver dag' },
    { symbol: '🪶', text: 'Solsorten øver sig på foråret' },
  ],
  // Marts
  [
    { symbol: '🌱', text: 'Krokus og erantis bryder igennem' },
    { symbol: '☀', text: 'Solen får styrke nok til at varme' },
    { symbol: '🐝', text: 'De første humlebier kommer ud' },
  ],
  // April
  [
    { symbol: '🌸', text: 'Mirabel og kirsebær blomstrer' },
    { symbol: '🐝', text: 'Bierne arbejder for alvor igen' },
    { symbol: '🌱', text: 'Forspirerne kalder på lys i vindueskarmen' },
  ],
  // Maj
  [
    { symbol: '☀', text: 'Solen står højt på himlen' },
    { symbol: '🌸', text: 'Forårsblomsterne tager over' },
    { symbol: '🌱', text: 'Jorden er klar til udplantning' },
  ],
  // Juni (matcher Anna's mockup-spec)
  [
    { symbol: '☀', text: 'Solen varmer jorden op' },
    { symbol: '🐝', text: 'Bierne besøger de første blomster' },
    { symbol: '🌱', text: 'Væksten tager fart' },
  ],
  // Juli
  [
    { symbol: '☀', text: 'Sommerlyset er hårdt og højt' },
    { symbol: '🍅', text: 'Tomaterne modner i drivhuset' },
    { symbol: '🦋', text: 'Sommerfuglene besøger lavendlen' },
  ],
  // August
  [
    { symbol: '🌾', text: 'Høsten samler sig i kurvene' },
    { symbol: '🐝', text: 'Bierne haster mod blomster der er tilbage' },
    { symbol: '☀', text: 'Aftnerne bliver mærkbart kortere' },
  ],
  // September
  [
    { symbol: '🌧', text: 'Lyset bliver blødere efter regn' },
    { symbol: '🍎', text: 'Æbler og pærer falder modne' },
    { symbol: '🌰', text: 'Frø samles til næste sæson' },
  ],
  // Oktober
  [
    { symbol: '🍂', text: 'Bladene skifter farve' },
    { symbol: '🌾', text: 'De sidste afgrøder kommer ind' },
    { symbol: '🍄', text: 'Skovsvampe dukker op under træerne' },
  ],
  // November
  [
    { symbol: '🍂', text: 'Bedene falder til ro' },
    { symbol: '🪶', text: 'Trækfuglene er for længst rejst' },
    { symbol: '🌰', text: 'Knolde gemmes til foråret' },
  ],
  // December
  [
    { symbol: '❄', text: 'Frosten lægger sig på jorden' },
    { symbol: '🪶', text: 'Fuglene tager fugleforet i brug' },
    { symbol: '🌲', text: 'Stedsegrønne planter bærer haven' },
  ],
]

/**
 * Milestone-værdige log-typer — handlinger med tydeligt dato-anker.
 * "Sætte ud" / "så" / "høste" markerer skred i sæsonen; "note" og
 * "observation" gør ikke (de er løse). Listen er bevidst kort så
 * milestone-sætningen aldrig fortæller om en triviel handling.
 *
 * Format-strenge bruger {plant}-placeholder — beregneren udfylder
 * planten + variety i samme stil som "agurkerne" eller
 * "tomatplanterne", afhængigt af bestemt form.
 */
const MILESTONE_LABEL: Record<string, string> = {
  sowing: 'såede {plant}',
  plant_out: 'satte {plant} ud',
  harvest: 'høstede første {plant}',
  repot: 'priklede {plant} om',
  pruning: 'knibede sideskud på {plant}',
}

/**
 * Bestemt form (plural-flertal) af de almindeligste planter, så
 * milestone-sætningen lyder naturligt: "satte agurkerne ud", ikke
 * "satte Agurk Marketmore ud". Falder tilbage til simpel pluralis-
 * konstruktion hvis navnet ikke er i ordbogen.
 */
const BESTEMT_FLERTAL: Record<string, string> = {
  agurk: 'agurkerne',
  tomat: 'tomatplanterne',
  chili: 'chiliplanterne',
  peberfrugt: 'peberfrugterne',
  salat: 'salaten',
  dild: 'dillen',
  basilikum: 'basilikummen',
  dahlia: 'dahliaerne',
  sukkeraert: 'ærterne',
  stangboenne: 'stangbønnerne',
}

function bestemtFlertal(plantName: string): string {
  const key = plantName.toLowerCase().replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa').split(/[\s-]/)[0]
  return BESTEMT_FLERTAL[key] ?? `${plantName.toLowerCase()}en`
}

const WEEKDAY_NAMES_DA = [
  'Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag',
]

const MONTH_NAMES_DA_LOWER = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

/**
 * Format en dato som "Søndag d. 7. juni" — editorial standardform.
 * Året udelades fordi tidslinjen altid handler om i dag.
 */
function formatDateText(d: Date): string {
  const weekday = WEEKDAY_NAMES_DA[d.getDay()]
  const day = d.getDate()
  const month = MONTH_NAMES_DA_LOWER[d.getMonth()]
  return `${weekday} d. ${day}. ${month}`
}

/**
 * Beregn antal hele dage mellem to datoer (ignorer klokkeslæt).
 */
function daysBetween(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((toMidnight - fromMidnight) / 86400000)
}

const MAANED_FULD_LOWER = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Bygger HeroNarrative ud fra brugerens tilstand.
 *
 * State-detektion:
 *   - Ny bruger: heroStats.notes === 0
 *     → "Din første sæson" + invitation
 *   - Lidt data: notes > 0, men kun nuværende år i historik
 *     → "{Måned} i haven" + milestones fra denne uge
 *   - År 1+: har historik fra tidligere år
 *     → "Velkommen tilbage til {måned}" + på-denne-tid-sidste-år
 *
 * Hver linje i personalText er en hel sætning med punktum — så de
 * kan rendres som adskilte typografiske beats uden at læse som
 * fragmenter.
 */
function buildHeroNarrative(
  heroStats: HeroStats,
  tidslinje: Tidslinje,
  history: HistoryYear[],
  onThisDay: OnThisDayEntry[],
  today: Date,
): HeroNarrative {
  const month = MAANED_FULD_LOWER[today.getMonth()]
  const currentYear = today.getFullYear()
  const hasYearOnePlusHistory = history.some(h => h.year < currentYear)

  // ── År 1+: brugeren har tidligere sæsoner ────────────────
  if (hasYearOnePlusHistory) {
    const personalText: string[] = []
    if (onThisDay[0]) {
      const ent = onThisDay[0]
      const yearText = ent.yearsAgo === 1 ? 'sidste år' : `${ent.yearsAgo} år siden`
      const subject = ent.variety ? `${ent.plantName} ${ent.variety}` : ent.plantName
      personalText.push(`På denne tid ${yearText} ${ent.text ? 'noterede du om ' + subject + '.' : 'havde du ' + subject + ' i haven.'}`)
    }
    if (tidslinje.weekNoteCount > 0) {
      personalText.push(
        `Du har skrevet ${tidslinje.weekNoteCount} ${tidslinje.weekNoteCount === 1 ? 'note' : 'noter'} denne uge.`,
      )
    }
    if (personalText.length === 0) {
      personalText.push(`Du dyrker ${heroStats.varieties} ${heroStats.varieties === 1 ? 'sort' : 'sorter'} i år.`)
    }
    return {
      seasonLine: `Velkommen tilbage til ${month}`,
      personalText,
      showStats: heroStats.notes > 0,
      userState: 'year2plus',
    }
  }

  // ── Ny bruger: ingen noter overhovedet ────────────────────
  if (heroStats.notes === 0) {
    const sortsLine = heroStats.varieties > 0
      ? `Du dyrker ${heroStats.varieties} ${heroStats.varieties === 1 ? 'sort' : 'sorter'} i år.`
      : 'Sæsonen venter på din første sort.'
    return {
      seasonLine: 'Din første sæson',
      personalText: [
        sortsLine,
        'Om lidt begynder de første minder at samle sig her.',
      ],
      // Stats er bare 0-tal for ny bruger — skjul dem så heroen
      // ikke siger "tom" tre gange i træk.
      showStats: false,
      userState: 'new',
    }
  }

  // ── Lidt data: nuværende år, har skrevet noter ───────────
  const beats: string[] = []
  if (tidslinje.milestoneText) {
    // tidslinje.milestoneText er "12 dage siden du satte agurkerne ud"
    // → som hel sætning behøver det bare punktum.
    beats.push(`${tidslinje.milestoneText}.`)
  }
  if (tidslinje.weekNoteCount > 0) {
    beats.push(
      `Du har skrevet ${tidslinje.weekNoteCount} ${tidslinje.weekNoteCount === 1 ? 'note' : 'noter'} denne uge.`,
    )
  }
  if (beats.length === 0) {
    beats.push(`Du dyrker ${heroStats.varieties} ${heroStats.varieties === 1 ? 'sort' : 'sorter'} i år.`)
  }
  return {
    seasonLine: `${capitalize(month)} i haven`,
    personalText: beats,
    showStats: true,
    userState: 'active',
  }
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

    // ── Tidslinje (editorial "du er her"-linje under hero) ───
    // dateText: i dag, lokaliseret
    // milestoneText: nyeste milestone-værdige log (sowing/plant_out/
    //   harvest/repot/pruning) → "12 dage siden du satte agurkerne ud"
    // weekNoteCount: alle logs de seneste 7 dage (alle typer tæller)
    //
    // Alle felter kan stå alene; HavebogHero render'er kun de dele
    // der har værdi.
    const dateText = formatDateText(today)

    const milestoneLog = logs.find(l => l.type in MILESTONE_LABEL)
    let milestoneText: string | null = null
    if (milestoneLog) {
      const daysAgo = daysBetween(new Date(milestoneLog.date), today)
      // Kun vis milestones inden for det sidste år — ældre er ikke
      // længere "lige nu"-relevant og dræber tonen.
      if (daysAgo >= 0 && daysAgo <= 365) {
        const plant = bestemtFlertal(plantName(milestoneLog.plant_id))
        const verb = MILESTONE_LABEL[milestoneLog.type].replace('{plant}', plant)
        const dayWord = daysAgo === 0
          ? 'I dag'
          : daysAgo === 1
            ? 'I går'
            : `${daysAgo} dage siden`
        milestoneText = daysAgo <= 1
          ? `${dayWord} ${verb}`
          : `${dayWord} du ${verb}`
      }
    }

    const weekAgo = new Date(today.getTime() - 7 * 86400000)
    const weekNoteCount = logs.filter(l => new Date(l.date) >= weekAgo).length

    const tidslinje: Tidslinje = { dateText, milestoneText, weekNoteCount }

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

    const heroNarrative = buildHeroNarrative(heroStats, tidslinje, history, onThisDay, today)

    // Naturen lige nu — indeks per aktuel måned (0-baseret)
    const naturenLigeNu = NATUREN_LIGE_NU_BY_MONTH[today.getMonth()]

    return {
      heroStats,
      tidslinje,
      heroNarrative,
      naturenLigeNu,
      onThisDay,
      recentNotes,
      history,
      denneSaeson,
      archivedPlants,
    }
  } catch {
    return null
  }
}
