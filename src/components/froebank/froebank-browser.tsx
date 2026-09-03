'use client'

/**
 * "FroebankBrowser" — wrapper omkring filter/sortering-modul +
 * den nye InventoryArchiveStack.
 *
 * Filter-state lever lokalt her; den filtrerede inventory sendes ned
 * til ArchiveStack så det øverste hero-kort + stak-kort altid
 * matcher den valgte kategori/søgning/smart-filter.
 *
 * Filter-logikken er kopieret fra den oprindelige InventoryListView
 * (samme UX som før), men kort-rendering er flyttet til
 * InventoryArchiveStack med dens nye folder-baserede layout.
 */

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { InventoryArchiveStack } from './inventory-archive-stack'
import { SeedBankFolderPanel } from './seed-bank-folder-panel'
import { PageIntroNote } from '@/components/ui/page-intro-note'
import { PRIMARY_CATEGORY_IDS } from '@/lib/constants'
import { soegeArter } from '@/lib/arts-model'
import {
  grupperEfterSort, poseInfoForViste, sortsNoegle, erBedstFoerNaer,
} from '@/lib/froebank-grupper'
import { parseDate } from '@/lib/datetime'
import {
  FilterBottomSheet,
  type SmartFilter,
  type SortOrder,
} from './filter-bottom-sheet'
import type {
  InventoryItem,
  PrimaryCategoryId,
  Subcategory,
} from '@/lib/types'

interface Props {
  inventory: InventoryItem[]
  customSubcategories?: Subcategory[]
}

const VALID_SMART_FILTERS: SmartFilter[] = [
  'mangler-guide',
  'udloeber-snart',
  'mangler-billede',
  'naesten-tom',
]

/**
 * Hero-underkategorier (KUN UI/mapper-logik — ingen datamodel-ændring).
 * `match` = de faktiske subcategory_id'er en chip dækker. "Blomster" samler
 * bevidst modellens to (1-årige + flerårige) til ÉN menneskelig chip, der både
 * tæller og filtrerer begge. Opret/redigér beholder de to separate valg.
 * iconSrc kun hvor et PNG findes; resten falder tilbage til neutralt blad i chippen.
 */
const HERO_SUBCATEGORIES: { id: string; label: string; match: string[]; iconSrc?: string }[] = [
  { id: 'groentsager',  label: 'Grøntsager',   match: ['groentsager'], iconSrc: '/images/glyphs/groentsager.png' },
  { id: 'blomster',     label: 'Blomster',     match: ['blomster_1aarige', 'blomster_fleraarige'], iconSrc: '/images/glyphs/blomster.png' },
  { id: 'krydderurter', label: 'Krydderurter', match: ['krydderurter'], iconSrc: '/images/glyphs/krydderurter.png' },
  { id: 'baer',         label: 'Bær',          match: ['baer'], iconSrc: '/images/glyphs/baer.png' },
  { id: 'frugt',        label: 'Frugt',        match: ['frugt'], iconSrc: '/images/glyphs/frugt.png' },
  { id: 'graesser',     label: 'Græsser',      match: ['graesser'], iconSrc: '/images/glyphs/prydgrasser.png' },
  { id: 'pryd',         label: 'Pryd',         match: ['pryd'] }, // intet ikon endnu → blad-fallback
]

export function FroebankBrowser({ inventory }: Props) {
  const searchParams = useSearchParams()
  // ?kategori= som startkategori — så CTA'er ("Gem til ønskelisten" m.fl.)
  // kan lande direkte i den rigtige kategori. Ingen blindgyder-reglen.
  const [activeCategory, setActiveCategory] = useState<PrimaryCategoryId>(() => {
    const k = searchParams.get('kategori')
    if (k && (PRIMARY_CATEGORY_IDS as readonly string[]).includes(k)) return k as PrimaryCategoryId
    return 'fro'
  })
  const [search, setSearch] = useState('')
  const [subcat, setSubcat] = useState<string>('alle')
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Sorteringsorden: 'standard' (pinned→favorit→alfabetisk),
  // 'az' (A→Å) eller 'za' (Å→A).
  const [sortOrder, setSortOrder] = useState<SortOrder>('standard')
  const [smartFilters, setSmartFilters] = useState<Set<SmartFilter>>(() => {
    const f = searchParams.get('filter')
    if (f && (VALID_SMART_FILTERS as string[]).includes(f))
      return new Set([f as SmartFilter])
    return new Set()
  })

  // Reagér hvis filter-query ændres mens komponenten lever (fx fra
  // notifikations-klik). setState i microtask + cancel-guard for at
  // undgå cascading renders / opdatering efter unmount.
  useEffect(() => {
    const f = searchParams.get('filter')
    if (!f || !(VALID_SMART_FILTERS as string[]).includes(f)) return
    let active = true
    Promise.resolve().then(() => {
      if (!active) return
      setSmartFilters((prev) => {
        if (prev.has(f as SmartFilter)) return prev
        const next = new Set(prev)
        next.add(f as SmartFilter)
        return next
      })
    })
    return () => {
      active = false
    }
  }, [searchParams])

  function toggleSmart(f: SmartFilter) {
    setSmartFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  // Filter-logik: kategori → underkategori → smart-filtre → fritekst.
  // Sortér til sidst: pinned først, så favoritter, så alfabetisk på navn.
  // Sortens samlede beholdning på tværs af dens fysiske poser, beregnet
  // på HELE frøbanken. Bruges af beholdnings-filtre, så de aldrig vurderer
  // en sort ud fra den ene pose der tilfældigvis er næsten tom.
  // Sorter hvor MINDST ÉN pose har en bedst før-dato der er passeret eller
  // falder inden for det kommende år. Hele sortsgruppen matcher, så gridets
  // kort beholder sit rigtige antal og "3 poser" — udløb hører til posen,
  // men filtret handler om hvilke SORTER der trænger til opmærksomhed.
  const bedstFoerNaerSorter = useMemo(() => {
    const saet = new Set<string>()
    for (const i of inventory) {
      if (erBedstFoerNaer(i.expiryDate)) saet.add(sortsNoegle(i))
    }
    return saet
  }, [inventory])

  // ÉN kanonisk gruppering, beregnet på HELE frøbanken. Både beholdnings-
  // filtret og frøkortets tæller/ring læser herfra — så et filter kan
  // skjule poser uden at ændre hvor mange frø sorten har.
  const kanoniskeGrupper = useMemo(() => grupperEfterSort(inventory), [inventory])

  const froeTilbagePrSort = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const g of kanoniskeGrupper) map.set(g.noegle, g.froeTilbage)
    return map
  }, [kanoniskeGrupper])

  const filtered = useMemo(() => {
    let list = inventory

    if (activeCategory === 'favoritter') {
      list = list.filter((i) => i.isFavorite)
    } else {
      list = list.filter((i) => i.primaryCategoryId === activeCategory)
    }

    if (subcat !== 'alle') {
      // Aggregeret: en hero-chip kan dække flere subcategory_id'er (fx Blomster).
      const hs = HERO_SUBCATEGORIES.find((h) => h.id === subcat)
      const ids = hs ? hs.match : [subcat]
      list = list.filter((i) => i.subcategoryId != null && ids.includes(i.subcategoryId))
    }

    if (smartFilters.has('mangler-guide')) {
      list = list.filter((i) => !i.guideId)
    }
    if (smartFilters.has('mangler-billede')) {
      list = list.filter((i) => !i.primaryImageId)
    }
    if (smartFilters.has('udloeber-snart')) {
      // Den faktiske bedst før-dato afgør — ikke købsåret. En pose uden
      // dato matcher aldrig: Potalot gætter ikke et udløb ud fra årgangen.
      list = list.filter((i) => bedstFoerNaerSorter.has(sortsNoegle(i)))
    }
    if (smartFilters.has('naesten-tom')) {
      // Beholdning vurderes på SORTEN, ikke på den enkelte pose: 2 frø i
      // én pose og 48 i en anden af samme sort er ikke "næsten tom".
      // Ukendt antal (null) er heller ikke lavt — vi ved det bare ikke.
      list = list.filter((i) => {
        const total = froeTilbagePrSort.get(sortsNoegle(i))
        return total != null && total > 0 && total < 5
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      // Artsalias: "georgine" finder poser, der hedder Dahlia (arts-model.ts).
      const aliasArter = soegeArter(q).map(a => a.toLowerCase())
      list = list.filter((i) => {
        const hay = [i.name, i.latinName, i.variety, i.supplier, i.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q) || aliasArter.includes((i.name ?? '').toLowerCase())
      })
    }

    const byName = (a: InventoryItem, b: InventoryItem) =>
      a.name.localeCompare(b.name, 'da')
    const byCreatedAt = (a: InventoryItem, b: InventoryItem) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    // Ældste bedst før først. Poser uden dato ryger bagerst — ukendt er
    // ikke det samme som "udløber sent", men de skal et sted hen.
    const bedstFoerTid = (i: InventoryItem) =>
      i.expiryDate ? parseDate(i.expiryDate).getTime() : Infinity
    const byExpiry = (a: InventoryItem, b: InventoryItem) => {
      const diff = bedstFoerTid(a) - bedstFoerTid(b)
      return diff !== 0 && Number.isFinite(diff) ? diff : byName(a, b)
    }

    if (sortOrder === 'recent') return [...list].sort(byCreatedAt)
    if (sortOrder === 'expiry') return [...list].sort(byExpiry)
    if (sortOrder === 'az') return [...list].sort(byName)
    if (sortOrder === 'za') return [...list].sort((a, b) => byName(b, a))

    // standard: pinned først, så favoritter, derefter alfabetisk
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return byName(a, b)
    })
  }, [inventory, activeCategory, subcat, search, smartFilters, sortOrder, froeTilbagePrSort, bedstFoerNaerSorter])

  // Samme sort, flere fysiske frøposer: stakken viser ÉN mappe pr. sort
  // (art + sort), ikke pr. pose. Poserne bevares som selvstændige rækker —
  // de vises hver for sig på sortens detaljeside.
  const grupper = useMemo(() => grupperEfterSort(filtered), [filtered])
  const gruppeHoveder = useMemo(() => grupper.map((g) => g.hoved), [grupper])
  // Kortets antal kommer fra sortens kanoniske gruppe — ikke fra den
  // filtrerede delmængde, som kun afgør HVILKE mapper der vises.
  const poseInfo = useMemo(
    () => poseInfoForViste(kanoniskeGrupper, gruppeHoveder),
    [kanoniskeGrupper, gruppeHoveder],
  )

  const latestInventoryItem = useMemo(() => {
    const withDates = inventory.filter((i) => i.createdAt)
    if (withDates.length > 0) {
      return [...withDates].sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
      )[0]
    }
    return inventory[0] ?? null
  }, [inventory])

  const latestItemName = latestInventoryItem
    ? latestInventoryItem.variety
      ? `${latestInventoryItem.name} ${latestInventoryItem.variety}`
      : latestInventoryItem.name
    : undefined // tom frøbank → panelet viser en kom-i-gang-tekst, ikke et opdigtet navn

  const latestItemTimeLabel = latestInventoryItem?.createdAt
    ? (() => {
        const days = Math.max(
          0,
          Math.floor((Date.now() - new Date(latestInventoryItem.createdAt).getTime()) / 86_400_000),
        )
        if (days === 0) return 'i dag'
        if (days === 1) return 'i går'
        return `${days} dage siden`
      })()
    : undefined // ukendt dato -> ingen opdigtet tidsangivelse (FRB-0106)

  const categoryCounts = useMemo(() => {
    function count(id: PrimaryCategoryId) {
      return inventory.filter((item) => item.primaryCategoryId === id).length
    }
    const base = [
      { id: 'fro', label: 'Frø', count: count('fro') },
      { id: 'loeg', label: 'Løg', count: count('loeg') },
      { id: 'knolde', label: 'Knolde', count: count('knolde') },
      { id: 'buske', label: 'Buske', count: count('buske') },
      { id: 'traeer', label: 'Træer', count: count('traeer') },
      { id: 'stauder', label: 'Stauder', count: count('stauder') },
    ]
    // Ønskelisten vises som kategori når den har indhold (eller er aktiv via
    // direkte link) — "Gem til ønskelisten" skal have en synlig destination.
    const oensker = count('indkoebsliste')
    if (oensker > 0 || activeCategory === 'indkoebsliste') {
      base.push({ id: 'indkoebsliste', label: 'Ønskeliste', count: oensker })
    }
    return base
  }, [inventory, activeCategory])

  // Underkategori-valg lever nu i filter-bottom-sheet (ikke som hero-chips).
  // Vi viser kun de underkategorier der FAKTISK findes i den aktive hovedkategori
  // (count > 0) — ingen døde valg. "Blomster" tæller begge model-underkategorier.
  const subcategoryChips = useMemo(() => {
    const base =
      activeCategory === 'favoritter'
        ? inventory.filter((i) => i.isFavorite)
        : inventory.filter((i) => i.primaryCategoryId === activeCategory)
    return HERO_SUBCATEGORIES.map((h) => ({
      id: h.id,
      label: h.label,
      iconSrc: h.iconSrc,
      count: base.filter((i) => i.subcategoryId != null && h.match.includes(i.subcategoryId)).length,
    })).filter((c) => c.count > 0)
  }, [inventory, activeCategory])

  // Label til den aktive underkategori-token i mappen (kun når ét er valgt).
  const activeSubcategoryLabel =
    subcat !== 'alle'
      ? HERO_SUBCATEGORIES.find((h) => h.id === subcat)?.label ?? subcat
      : undefined

  const totalSeeds = inventory.reduce((sum, item) => {
    const remaining = item.seedsRemaining ?? item.seedCount ?? 0
    return sum + remaining
  }, 0)
  const expiringSoonCount = bedstFoerNaerSorter.size

  const activeFolderFilter = smartFilters.has('udloeber-snart')
    ? 'udloeber-snart'
    : sortOrder === 'recent'
      ? 'senest-tilfoejet'
      : 'alle'

  function handleFolderFilterChange(filterId: string) {
    if (filterId === 'udloeber-snart') {
      setSortOrder('standard')
      setSmartFilters(new Set(['udloeber-snart']))
      return
    }
    if (filterId === 'senest-tilfoejet') {
      setSmartFilters(new Set())
      setSortOrder('recent')
      return
    }
    setSmartFilters(new Set())
    setSortOrder('standard')
  }

  // Aktive AVANCEREDE filtre (dem der ikke allerede vises af den simple
  // chip-række Alle/Udløber snart/Senest tilføjet) → små chips i mappen.
  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string }[] = []
    if (smartFilters.has('mangler-billede'))
      chips.push({ id: 'mangler-billede', label: 'Mangler billede' })
    if (smartFilters.has('mangler-guide'))
      chips.push({ id: 'mangler-guide', label: 'Mangler guide' })
    if (smartFilters.has('naesten-tom'))
      chips.push({ id: 'naesten-tom', label: 'Næsten tom' })
    if (sortOrder === 'az') chips.push({ id: 'sort-az', label: 'A–Å' })
    if (sortOrder === 'za') chips.push({ id: 'sort-za', label: 'Å–A' })
    if (sortOrder === 'expiry')
      chips.push({ id: 'sort-expiry', label: 'Udløber først' })
    return chips
  }, [smartFilters, sortOrder])

  function removeFilterChip(id: string) {
    if (id.startsWith('sort-')) {
      setSortOrder('standard')
      return
    }
    setSmartFilters((prev) => {
      const next = new Set(prev)
      next.delete(id as SmartFilter)
      return next
    })
  }

  function resetFilters() {
    setActiveCategory('fro')
    setSubcat('alle')
    setSmartFilters(new Set())
    setSortOrder('standard')
  }

  return (
    // Bryd let ud af app'ens 16px-gutter, så mappe-stakken bliver bredere
    // (folder + kort følges ad). Beholder ~8px luft i hver side til
    // folder-skyggen — ingen forælder klipper vandret, og skygger er paint-only,
    // så intet skæres og der opstår ikke vandret scroll.
    <div className="space-y-4 -mx-1.5">
      <SeedBankFolderPanel
        totalSeeds={totalSeeds}
        totalVarieties={inventory.length}
        expiringSoonCount={expiringSoonCount}
        recentItemName={latestItemName}
        recentItemTimeLabel={latestItemTimeLabel}
        activeCategory={activeCategory}
        categories={categoryCounts}
        activeSubcategoryLabel={activeSubcategoryLabel}
        onClearSubcategory={() => setSubcat('alle')}
        activeFilter={activeFolderFilter}
        searchValue={search}
        onSearchChange={setSearch}
        onFilterClick={() => setFiltersOpen((v) => !v)}
        onCategoryChange={(categoryId) => {
          setActiveCategory(categoryId as PrimaryCategoryId)
          setSubcat('alle')
        }}
        onFilterChange={handleFolderFilterChange}
        activeFilterChips={activeFilterChips}
        onRemoveFilterChip={removeFilterChip}
      />

      {/* Den filtrerede inventory sendes ned til archive-stak. Trukket op så
          hero-kortet lægger sig oven på panelets creme-mappe (Anna): hero ~6mm
          under skulderens top, creme fortsætter ned bag kortet. */}
      <div style={{ marginTop: -145, position: 'relative', zIndex: 10 }}>
        {/* Søgning uden match ≠ tom bank (var før visuelt identiske). Ærligt
            svar + direkte vej videre: opret sorten manuelt, forudfyldt. */}
        {filtered.length === 0 && inventory.length > 0 && search.trim() !== '' && (
          <div className="px-1.5 pb-4 space-y-3">
            <p className="text-sm text-muted-foreground" style={{ maxWidth: '36ch' }}>
              Vi kender ikke sorten endnu. Du kan stadig oprette den manuelt,
              og vi hjælper med de oplysninger, vi har.
            </p>
            <Link
              href={`/froebank/tilfoej?mode=manuel&navn=${encodeURIComponent(search.trim())}`}
              className="no-underline inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
            >
              Opret &quot;{search.trim()}&quot;
            </Link>
          </div>
        )}

        {/* Ønskelistens engangsforklaring: parkeringsplads for idéer, ikke
            endnu en database. Vises første gange kategorien åbnes. */}
        {activeCategory === 'indkoebsliste' && (
          <div className="px-1.5 pb-3">
            <PageIntroNote
              id="oenskeliste"
              title="Din ønskeliste"
              body="Gem sorter, du overvejer at dyrke. Når du er klar, kan du flytte dem direkte til Frøbanken."
            />
          </div>
        )}
        <InventoryArchiveStack inventory={gruppeHoveder} poseInfo={poseInfo} erTomBank={inventory.length === 0} />
      </div>

      {/* Filterknappen i mappen åbner dette bottom sheet (ikke længere et
          inline-panel under mappen, som brød arkiv-illusionen). */}
      <FilterBottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        category={activeCategory}
        smartFilters={smartFilters}
        sortOrder={sortOrder}
        subcategoryOptions={subcategoryChips}
        activeSubcategory={subcat}
        onSelectSubcategory={(id) => setSubcat(id)}
        onSelectCategory={(id) => {
          setActiveCategory(id)
          setSubcat('alle')
        }}
        onToggleSmart={toggleSmart}
        onClearSmart={() => setSmartFilters(new Set())}
        onSelectSort={setSortOrder}
        onReset={resetFilters}
      />
    </div>
  )
}
