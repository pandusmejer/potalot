'use client'

import * as React from 'react'
import {
  Leaf,
  Search,
  SlidersHorizontal,
  Sprout,
} from 'lucide-react'

/** Ikon-komponent (lucide ELLER custom inline-SVG) — begge tager className + strokeWidth. */
type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>

// Custom botaniske kategori-glyphs (lucide har ikke løg/knold/busk i den rette
// stil) — tegnet i samme rolige stregstil som referencebilledet.
function GlyphLoeg({ className, strokeWidth = 1.65 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21c-3.6 0-6-2.6-6-6 0-3.5 2.6-7 6-7s6 3.5 6 7c0 3.4-2.4 6-6 6Z" />
      <path d="M12 8c-.7-1.6-1.9-2.8-3.1-3.5M12 8c.7-1.6 1.9-2.8 3.1-3.5" />
      <path d="M9.7 9.7c-1 2.4-1 5.5.3 8.1M14.3 9.7c1 2.4 1 5.5-.3 8.1" />
    </svg>
  )
}

function GlyphKnolde({ className, strokeWidth = 1.65 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <ellipse cx="8.8" cy="9.6" rx="4.3" ry="3.4" transform="rotate(-20 8.8 9.6)" />
      <ellipse cx="15.4" cy="10.9" rx="3.9" ry="3" transform="rotate(16 15.4 10.9)" />
      <ellipse cx="12" cy="16" rx="4.1" ry="3.2" transform="rotate(-6 12 16)" />
    </svg>
  )
}

function GlyphBusk({ className, strokeWidth = 1.65 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21v-5" />
      <path d="M8.6 16c-2 0-3.6-1.5-3.6-3.4 0-1.3.8-2.5 2-3 .1-2.2 1.9-3.9 4-3.9 1.5 0 2.8.8 3.4 2 .4-.2.9-.3 1.4-.3 1.7 0 3.1 1.4 3.1 3.1 0 .3 0 .6-.1.9 1 .5 1.6 1.5 1.6 2.6 0 1.7-1.4 3-3.3 3Z" />
    </svg>
  )
}

type CategoryId = 'fro' | 'loeg' | 'knolde' | 'buske' | string
type FilterId = 'alle' | 'udloeber-snart' | 'senest-tilfoejet' | string

export interface SeedBankFolderCategory {
  id: CategoryId
  label: string
  count: number
  icon?: IconType
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
  { id: 'loeg', label: 'Løg', count: 0, icon: GlyphLoeg },
  { id: 'knolde', label: 'Knolde', count: 0, icon: GlyphKnolde },
  { id: 'buske', label: 'Buske', count: 0, icon: GlyphBusk },
]

const CATEGORY_ICONS: Record<string, IconType> = {
  fro: Sprout,
  loeg: GlyphLoeg,
  knolde: GlyphKnolde,
  buske: GlyphBusk,
}

const DEFAULT_FILTERS: SeedBankFolderFilter[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'udloeber-snart', label: 'Udløber snart' },
  { id: 'senest-tilfoejet', label: 'Senest tilføjet' },
]

const paperTexture = {
  backgroundImage:
    'linear-gradient(180deg, #D0D5C6 0%, #C8CEBD 48%, #BBC4B0 100%)',
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
      className="relative mx-auto w-full max-w-[430px] mb-10 px-3 pt-5"
      data-total-seeds={totalSeeds}
      data-total-varieties={totalVarieties}
      data-expiring-soon-count={expiringSoonCount}
    >
      {/* Bagmappe-lag fjernet 22/6 (var skæve ift. designet) — genopbygges senere. */}

      <div className="relative z-10 pt-8">
        <div
          aria-hidden
          className="absolute left-0 top-0 z-20 h-10 w-[58%] bg-[#C8CEBD] shadow-[0_-2px_8px_rgba(255,255,255,0.16)_inset]"
          style={{
            clipPath:
              'polygon(0 100%, 0 42%, 4% 12%, 9% 0, 63% 0, 67% 10%, 70% 34%, 73% 56%, 100% 56%, 100% 100%)',
            backgroundImage:
              'linear-gradient(180deg, #D0D5C6 0%, #C8CEBD 58%, #BBC4B0 100%)',
          }}
        />

        <div
          className="relative overflow-hidden rounded-b-[24px] rounded-tr-[24px] bg-[#C8CEBD] px-5 pb-8 pt-7 shadow-[0_16px_30px_rgba(36,48,31,0.16),0_1px_0_rgba(255,255,255,0.20)_inset]"
          style={paperTexture}
        >
          {/* Fiber-grain — synlig papir-tekstur (multiply). Organisk fraktal-
              noise, intet regulært liniemønster. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{
              opacity: 0.06,
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
                className="pointer-events-none absolute bottom-0 right-0 top-0 w-10 bg-gradient-to-l from-[#C8CEBD] to-transparent"
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
