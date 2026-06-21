'use client'

import * as React from 'react'
import {
  Circle,
  Flower2,
  Leaf,
  Search,
  SlidersHorizontal,
  Sprout,
  TreePine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type CategoryId = 'fro' | 'loeg' | 'knolde' | 'buske' | string
type FilterId = 'alle' | 'udloeber-snart' | 'senest-tilfoejet' | string

export interface SeedBankFolderCategory {
  id: CategoryId
  label: string
  count: number
  icon?: LucideIcon
}

export interface SeedBankFolderFilter {
  id: FilterId
  label: string
}

export interface SeedBankFolderPanelProps {
  totalSeeds?: number
  totalVarieties?: number
  expiringSoonCount?: number
  recentItemName?: string
  recentItemTimeLabel?: string
  activeCategory?: CategoryId
  categories?: SeedBankFolderCategory[]
  activeFilter?: FilterId
  filters?: SeedBankFolderFilter[]
  searchValue?: string
  onSearchChange?: (value: string) => void
  onFilterClick?: () => void
  onCategoryChange?: (categoryId: CategoryId) => void
  onFilterChange?: (filterId: FilterId) => void
  children?: React.ReactNode
  extraContent?: React.ReactNode
}

const DEFAULT_CATEGORIES: SeedBankFolderCategory[] = [
  { id: 'fro', label: 'Frø', count: 8, icon: Sprout },
  { id: 'loeg', label: 'Løg', count: 0, icon: Circle },
  { id: 'knolde', label: 'Knolde', count: 0, icon: Flower2 },
  { id: 'buske', label: 'Buske', count: 0, icon: TreePine },
]

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  fro: Sprout,
  loeg: Circle,
  knolde: Flower2,
  buske: TreePine,
}

const DEFAULT_FILTERS: SeedBankFolderFilter[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'udloeber-snart', label: 'Udløber snart' },
  { id: 'senest-tilfoejet', label: 'Senest tilføjet' },
]

const paperTexture = {
  backgroundImage:
    'linear-gradient(180deg, #C4C1AA 0%, #BCBAA2 48%, #B4B298 100%)',
}

// Papir-fiber: synlig, men organisk fraktal-noise (ikke et regulært raster).
// Lavere baseFrequency = større, mere aflæselige fibre end den gamle 0.95.
const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='170' height='170'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch' result='n'/%3E%3CfeColorMatrix in='n' type='matrix' values='0.32 0 0 0 0 0 0.32 0 0 0 0 0 0.32 0 0 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='170' height='170' filter='url(%23g)'/%3E%3C/svg%3E"

// Papir-mottle: meget lav-frekvent støj = bløde, uregelmæssige tone-pletter
// (ægte papir er ujævnt fordelt). Erstatter det gamle regulære prik-raster.
const MOTTLE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.014' numOctaves='2' seed='7' result='n'/%3E%3CfeColorMatrix in='n' type='matrix' values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.46 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23m)'/%3E%3C/svg%3E"

export function SeedBankFolderPanel({
  totalSeeds = 251,
  totalVarieties = 8,
  expiringSoonCount = 2,
  recentItemName = 'Salat Crispy Mint',
  recentItemTimeLabel = 'for 2 dage siden',
  activeCategory = 'fro',
  categories = DEFAULT_CATEGORIES,
  activeFilter = 'alle',
  filters = DEFAULT_FILTERS,
  searchValue,
  onSearchChange,
  onFilterClick,
  onCategoryChange,
  onFilterChange,
  children,
  extraContent,
}: SeedBankFolderPanelProps) {
  const [internalSearch, setInternalSearch] = React.useState('')
  const value = searchValue ?? internalSearch

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    if (searchValue === undefined) setInternalSearch(next)
    onSearchChange?.(next)
  }

  return (
    <section
      className="relative mb-10 px-3 pt-5"
      data-total-seeds={totalSeeds}
      data-total-varieties={totalVarieties}
      data-expiring-soon-count={expiringSoonCount}
    >
      <div
        aria-hidden
        className="absolute left-8 right-5 top-0 h-16 rounded-t-[22px] bg-[#f7efe4] shadow-[0_2px_10px_rgba(36,48,31,0.08)]"
      >
        <div className="absolute right-[29%] top-0 h-6 w-[18%] rounded-b-[16px] bg-[#eadfce]" />
      </div>
      <div
        aria-hidden
        className="absolute left-4 right-9 top-3 h-16 rounded-t-[22px] bg-[#ece4d5] shadow-[0_2px_9px_rgba(36,48,31,0.08)]"
      >
        <div className="absolute right-[37%] top-0 h-6 w-[17%] rounded-b-[16px] bg-[#ded3c1]" />
      </div>
      <div
        aria-hidden
        className="absolute left-2 right-2 top-7 h-16 rounded-t-[22px] bg-[#dddcc5] shadow-[0_3px_12px_rgba(36,48,31,0.09)]"
      />

      <div className="relative z-10 pt-8">
        <div
          aria-hidden
          className="absolute left-0 top-0 z-20 h-10 w-[58%] bg-[#BCBAA2] shadow-[0_-2px_8px_rgba(255,255,255,0.16)_inset]"
          style={{
            clipPath:
              'polygon(0 100%, 0 42%, 4% 12%, 9% 0, 63% 0, 67% 10%, 70% 34%, 73% 56%, 100% 56%, 100% 100%)',
            backgroundImage:
              'linear-gradient(180deg, #C4C1AA 0%, #BCBAA2 58%, #B4B298 100%)',
          }}
        />

        <div
          className="relative overflow-hidden rounded-b-[24px] rounded-tr-[24px] bg-[#BCBAA2] px-5 pb-8 pt-7 shadow-[0_16px_30px_rgba(36,48,31,0.16),0_1px_0_rgba(255,255,255,0.20)_inset]"
          style={paperTexture}
        >
          {/* Fiber-grain — synlig papir-tekstur (multiply). Organisk fraktal-
              noise, intet regulært liniemønster. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{
              opacity: 0.22,
              backgroundImage: `url("${GRAIN_SVG}")`,
              backgroundSize: '170px 170px',
            }}
          />
          {/* Mottle + retningslys (soft-light): bløde tone-pletter (papir-
              uensartethed) + et svagt lysere felt øverst/centralt. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.7,
              mixBlendMode: 'soft-light',
              backgroundImage: `radial-gradient(circle at 50% 16%, rgba(255,255,255,0.22), transparent 58%), url("${MOTTLE_SVG}")`,
              backgroundSize: '100% 100%, 300px 300px',
            }}
          />

          <BotanicalLine />

          <div className="relative z-10">
            <header className="max-w-[26rem]">
              <p
                className="text-[clamp(2rem,7.5vw,2.375rem)] leading-[0.96] tracking-[-0.005em] text-[#263321]"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 600 }}
              >
                Din Frøbank
              </p>
              <p className="mt-1.5 font-sans text-[0.86rem] font-medium leading-snug text-[#687060]">
                Dine sorter, samlet og klar til sæsonen.
              </p>
            </header>

            <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-[#e8e5d6]/56 px-3.5 py-1 text-[0.75rem] font-normal leading-none text-[#687061] shadow-[0_1px_0_rgba(255,255,255,0.30)_inset]">
              <Leaf className="h-3 w-3 shrink-0 text-[#587044]" strokeWidth={1.65} />
              <span className="truncate">
                Senest tilføjet:{' '}
                <span className="font-medium text-[#44563a]">{recentItemName}</span>
                <span className="px-1.5 text-[#737b68]">·</span>
                {recentItemTimeLabel}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_3.9rem] gap-3">
              <label className="flex h-[3.9rem] items-center gap-3 rounded-[20px] bg-[#f8f5ed] px-4 text-[#77796f] shadow-[0_4px_12px_rgba(36,48,31,0.09),0_1px_0_rgba(255,255,255,0.68)_inset]">
                <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.65} />
                <input
                  value={value}
                  onChange={handleSearchChange}
                  placeholder="Søg i frøbanken"
                  className="min-w-0 flex-1 bg-transparent font-sans text-[0.9rem] font-normal text-[#374232] outline-none placeholder:text-[#7b7d73]"
                />
              </label>

              <button
                type="button"
                onClick={onFilterClick}
                aria-label="Åbn filter og sortering"
                className="flex h-[3.9rem] items-center justify-center rounded-[20px] bg-[#f8f5ed] text-[#4e5548] shadow-[0_4px_12px_rgba(36,48,31,0.09),0_1px_0_rgba(255,255,255,0.68)_inset] transition hover:bg-[#fbf8f0]"
              >
                <SlidersHorizontal className="h-[22px] w-[22px]" strokeWidth={1.8} />
              </button>
            </div>

            <div className="relative -mr-5 mt-5">
              <div className="flex gap-3 overflow-x-auto pr-8 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map(category => (
                  <CategoryPill
                    key={category.id}
                    category={category}
                    active={category.id === activeCategory}
                    onClick={() => onCategoryChange?.(category.id)}
                  />
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-0 top-0 w-10 bg-gradient-to-l from-[#BCBAA2] to-transparent"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {filters.map(filter => (
                <FilterChip
                  key={filter.id}
                  filter={filter}
                  active={filter.id === activeFilter}
                  onClick={() => onFilterChange?.(filter.id)}
                />
              ))}
            </div>

            {(children || extraContent) && (
              <div className="mt-8 pb-4">
                {children}
                {extraContent}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoryPill({
  category,
  active,
  onClick,
}: {
  category: SeedBankFolderCategory
  active: boolean
  onClick: () => void
}) {
  const Icon = category.icon ?? CATEGORY_ICONS[category.id] ?? Sprout

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-[52px] min-w-[7.55rem] shrink-0 items-center justify-between gap-3 rounded-[18px] px-3.5 font-sans text-[0.86rem] font-medium shadow-[0_4px_12px_rgba(36,48,31,0.08),0_1px_0_rgba(255,255,255,0.55)_inset] transition',
        active
          ? 'bg-[#46662f] text-[#fbf7ec]'
          : 'bg-[#f2eee3] text-[#4f584c]',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-3">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.65} />
        {category.label}
      </span>
      <span className={active ? 'font-normal text-[#e1e5cf]' : 'font-normal text-[#777d70]'}>
        {category.count}
      </span>
    </button>
  )
}

function FilterChip({
  filter,
  active,
  onClick,
}: {
  filter: SeedBankFolderFilter
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'h-9 rounded-full px-4 font-sans text-[0.76rem] font-medium shadow-[0_2px_8px_rgba(36,48,31,0.06),0_1px_0_rgba(255,255,255,0.52)_inset] transition',
        active
          ? 'bg-[#496b31] text-[#fbf7ec]'
          : 'bg-[#ece8db] text-[#687061]',
      ].join(' ')}
    >
      {filter.label}
    </button>
  )
}

function BotanicalLine() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 150 150"
      className="pointer-events-none absolute right-6 top-8 h-24 w-24 text-[#6d775f] opacity-[0.12]"
    >
      <path
        d="M74 132c-7-34-5-72 7-113"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <path
        d="M75 91c-22-6-39-19-51-39 25 1 43 14 51 39ZM83 75c19-14 31-31 35-54-22 7-35 24-35 54ZM70 117c-18-4-32-15-41-31 20-1 35 10 41 31Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M55 49c-2-13 2-25 11-37 10 16 7 29-11 37ZM100 34c13-7 25-7 36 1-12 12-25 12-36-1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export const SEED_BANK_FOLDER_DEFAULT_CATEGORIES = DEFAULT_CATEGORIES
export const SEED_BANK_FOLDER_DEFAULT_FILTERS = DEFAULT_FILTERS
