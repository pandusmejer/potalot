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
// TODO (Anna): MIDLERTIDIGE ikoner. Udskift kategori-ikonerne (Frø/Løg/Knolde/
// Busk) — og evt. Search/SlidersHorizontal/Leaf — med de endelige ikon-designs,
// når de er færdige. Se ikon-system-memoet (Potalot Soft Glyphs).
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
    'radial-gradient(circle at 32% 18%, rgba(255,255,255,0.20), transparent 38%), linear-gradient(180deg, #C3C1AB 0%, #B9B7A1 52%, #B0AE98 100%)',
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
  recentItemTimeLabel = '2 dage siden',
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
      className="relative mx-auto w-full max-w-[390px] mb-10"
      data-total-seeds={totalSeeds}
      data-total-varieties={totalVarieties}
      data-expiring-soon-count={expiringSoonCount}
    >
      {/* Front-mappens eksakte silhuet (Annas path, normaliseret til objectBoundingBox
          så wave-valley/højre-skulder-relationen + y-niveauer bevares ved skalering). */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <clipPath id="seedFolderClip" clipPathUnits="objectBoundingBox">
            <path d="M0 0.9558L0 0.1388C0 0.1136 0.008 0.1025 0.0213 0.0962C0.0319 0.0915 0.0399 0.0804 0.0452 0.0615C0.0519 0.0394 0.0638 0.0315 0.0838 0.0315L0.4029 0.0315C0.4229 0.0315 0.4362 0.0331 0.4441 0.0379C0.4521 0.0426 0.4574 0.0489 0.4628 0.0568C0.4681 0.0647 0.4734 0.0909 0.4814 0.0909L0.9495 0.0909C0.9654 0.0909 0.9774 0.0956 0.9867 0.1067C0.996 0.1177 1 0.1319 1 0.1508L1 0.9558C1 0.9811 0.984 1 0.9628 1L0.0372 1C0.016 1 0 0.9811 0 0.9558Z" />
          </clipPath>
          <filter id="paperGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0" result="grain" />
            <feComposite in="grain" in2="SourceGraphic" operator="in" result="grainIn" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="grainIn" />
            </feMerge>
          </filter>
          <clipPath id="creamClip" clipPathUnits="objectBoundingBox">
            <path d="M0.0423 1L0.0423 0.3927C0.0423 0.2932 0.0585 0.2199 0.0802 0.2199L0.4865 0.2199C0.4984 0.2199 0.507 0.2461 0.5125 0.2932L0.519 0.3508C0.5233 0.3874 0.532 0.4031 0.5428 0.4031L0.9198 0.4031C0.9382 0.4031 0.9523 0.4712 0.9523 0.5602L0.9523 1Z" />
          </clipPath>
          <clipPath id="backClip" clipPathUnits="objectBoundingBox">
            <path d="M0.0336 1L0.0336 0.4241C0.0336 0.3194 0.0509 0.2461 0.0737 0.2461L0.9318 0.2461C0.9545 0.2461 0.9718 0.3194 0.9718 0.4241L0.9718 1Z" />
          </clipPath>
        </defs>
      </svg>
      {/* Papir-overlay pseudo-elementer (Anna 22/6). Tekstur klippes til hvert
          elements form; indhold/ikoner/tekst ligger over via z-index. */}
      <style>{`
        .pf-light,.pf-green{position:relative;overflow:hidden;}
        .pf-light>*,.pf-green>*{position:relative;z-index:2;}
        .pf-front::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;mix-blend-mode:multiply;opacity:.115;background-image:radial-gradient(rgba(76,70,52,.18) .42px,transparent .58px),radial-gradient(rgba(255,255,255,.12) .34px,transparent .52px),radial-gradient(circle at 22% 18%,rgba(255,255,255,.075),transparent 30%),radial-gradient(circle at 76% 72%,rgba(80,76,58,.065),transparent 34%);background-size:7px 7px,11px 11px,100% 100%,100% 100%;background-position:0 0,3px 4px,center,center;border-radius:inherit;}
        .pf-light::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;mix-blend-mode:multiply;opacity:.055;background-image:radial-gradient(rgba(90,84,66,.10) .32px,transparent .50px),radial-gradient(rgba(255,255,255,.07) .24px,transparent .44px);background-size:9px 9px,13px 13px;background-position:0 0,5px 6px;border-radius:inherit;}
        .pf-green::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;mix-blend-mode:soft-light;opacity:.06;background-image:radial-gradient(rgba(255,255,255,.11) .30px,transparent .46px),radial-gradient(rgba(38,54,26,.12) .34px,transparent .52px);background-size:10px 10px,14px 14px;background-position:0 0,6px 7px;border-radius:inherit;}
      `}</style>
      <div className="relative" style={{ marginTop: 26 }}>
        {/* 🔒 LÅST 22/6 (Anna): ALLE TRE lag i mappe-stakken er geometrisk
            færdigtunede — BAGERSTE (mørk #AEB6A1, z-1), MELLEMSTE (creme #ECE4D7, z-2),
            FORRESTE (grøn, z-3, clip #seedFolderClip). Næste arbejde = KUN farver, præg,
            skygge og dybde. Geometrien må IKKE ændres: hverken path-d, top/left/width/
            height eller clip på nogen af de tre lag. */}
        {/* Mørkt bagerste lag (z-1) — FLAD top (ingen skulder), bløde hjørner.
            Venstre kant 2mm uden for cremens venstre kant; højre kant ~2mm uden for
            cremens højre. Hævet så ~2mm af flad-toppen ses over cremens LAVE del og
            forsvinder bag cremens høje skulder. Eget element bagved — front+creme urørt. */}
        <svg
          aria-hidden
          viewBox="0 0 1846 382"
          className="pointer-events-none absolute block"
          style={{ top: -6, left: -8, width: 'calc(100% + 14px)', height: 'auto', zIndex: 1, filter: 'drop-shadow(0 7px 13px rgba(55,50,38,0.11)) drop-shadow(0 3px 5px rgba(55,50,38,0.05))' }}
        >
          <path
            d="M62 382L62 162C62 122 94 94 136 94L1720 94C1762 94 1794 122 1794 162L1794 382Z"
            fill="#AEB6A1"
            filter="url(#paperGrain)"
          />
        </svg>
        {/* Papir-overlay for bagerste lag — klippet til samme path via #backClip. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: -6,
            left: -8,
            width: 'calc(100% + 14px)',
            aspectRatio: '1846 / 382',
            zIndex: 1,
            clipPath: 'url(#backClip)',
            WebkitClipPath: 'url(#backClip)',
            mixBlendMode: 'multiply',
            opacity: 0.065,
            backgroundImage:
              'radial-gradient(rgba(78,74,60,0.12) 0.34px, transparent 0.52px), radial-gradient(rgba(255,255,255,0.08) 0.26px, transparent 0.46px)',
            backgroundSize: '9px 9px, 13px 13px',
            backgroundPosition: '0 0, 5px 6px',
          }}
        />
        {/* Cremefarvet mellemlag (z-2) — bagvedliggende papirlag der SVÆVER over
            den grønne front (forskudt mappe-stak, jf. Annas reference 22/6): hele
            creme-toppen er synlig over fronten. Annas SVG-path brugt direkte (ikke
            frontlagets shape, ingen venstre bølge): enkel blød venstre-top-radius,
            høj midter-skulder, lavere højre topkant, roligt afrundet højre hjørne. */}
        <svg
          aria-hidden
          viewBox="0 0 1846 382"
          className="pointer-events-none absolute block"
          style={{ top: -14, left: -8, width: 'calc(100% + 17px)', height: 'auto', zIndex: 2, filter: 'drop-shadow(0 10px 18px rgba(72,62,45,0.14)) drop-shadow(0 4px 8px rgba(72,62,45,0.07)) drop-shadow(0 -1.5px 2px rgba(55,50,38,0.33))' }}
        >
          <path
            d="M78 382L78 150C78 112 108 84 148 84L898 84C920 84 936 94 946 112L958 134C966 148 982 154 1002 154L1698 154C1732 154 1758 180 1758 214L1758 382Z"
            fill="#ECE4D7"
            stroke="#BEB5A0"
            strokeWidth={1.5}
            filter="url(#paperGrain)"
          />
        </svg>
        {/* Papir-overlay for creme-mellemlag — klippet til samme path via #creamClip. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: -14,
            left: -8,
            width: 'calc(100% + 17px)',
            aspectRatio: '1846 / 382',
            zIndex: 2,
            clipPath: 'url(#creamClip)',
            WebkitClipPath: 'url(#creamClip)',
            mixBlendMode: 'multiply',
            opacity: 0.085,
            backgroundImage:
              'radial-gradient(rgba(88,80,60,0.14) 0.38px, transparent 0.56px), radial-gradient(rgba(255,255,255,0.10) 0.30px, transparent 0.48px), radial-gradient(circle at 30% 18%, rgba(255,255,255,0.065), transparent 30%), radial-gradient(circle at 72% 78%, rgba(98,92,72,0.052), transparent 34%)',
            backgroundSize: '8px 8px, 12px 12px, 100% 100%, 100% 100%',
            backgroundPosition: '0 0, 4px 5px, center, center',
          }}
        />

        {/* Folder-tab fjernet 22/6 (hang over mappen) — nøjagtig folder-udformning kommer via path senere. */}

        <div className="relative z-[3]" style={{ filter: 'drop-shadow(0 24px 42px rgba(64,58,42,0.18)) drop-shadow(0 10px 18px rgba(64,58,42,0.10)) drop-shadow(0 2px 4px rgba(64,58,42,0.05)) drop-shadow(1px 1px 1px rgba(52,50,46,0.45))' }}>
        <div
          className="relative overflow-hidden bg-[#B9B7A1] pf-front"
          style={{
            ...paperTexture,
            paddingTop: 44,
            paddingBottom: 22,
            paddingLeft: 24,
            paddingRight: 24,
            clipPath: 'url(#seedFolderClip)',
            WebkitClipPath: 'url(#seedFolderClip)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(120,125,106,0.12)',
          }}
        >
          {/* Fiber-grain — synlig papir-tekstur (multiply). Organisk fraktal-
              noise, intet regulært liniemønster. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{
              opacity: 0.11,
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

          {/* <BotanicalLine /> — botanisk illustration fjernet igen */}

          <div className="relative z-10">
            <header className="max-w-[26rem]">
              <p
                className="text-[clamp(2.25rem,9.7vw,2.5rem)] leading-[1.02] tracking-[-0.01em] text-[#263321]"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 600 }}
              >
                Din Frøbank
              </p>
              <p className="mt-[6px] font-sans text-[14px] font-normal leading-[1.3] text-[#687060]">
                Dine sorter, samlet og klar til sæsonen.
              </p>
            </header>

            <div
              className="mt-[14px] inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-[12px] text-[11px] font-normal leading-[1.3] text-[#5F6758]"
              style={{
                background: 'linear-gradient(180deg, #D6D1C2 0%, #C7C2B0 100%)',
                boxShadow:
                  'inset 0 -2px 4px rgba(98,104,82,0.12), inset 0 -1px 1px rgba(82,88,68,0.10), 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              <Leaf className="h-3 w-3 shrink-0 text-[#667456]" strokeWidth={1.65} />
              <span className="truncate">
                <span>Senest tilføjet:</span>{' '}
                <span className="font-semibold text-[#566337]">{recentItemName}</span>
                <span className="px-1.5 text-[#737b68]">·</span>
                {recentItemTimeLabel}
              </span>
            </div>

            <div className="mt-[15px] flex gap-[12px]">
              <label
                className="pf-light flex h-[48px] min-w-0 flex-1 items-center gap-3 rounded-[16px] px-4 text-[#74796D]"
                style={{
                  background: '#EFEBE1',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(210,200,185,0.28), 0 5px 12px rgba(73,64,48,0.10)',
                }}
              >
                <Search className="h-[17.6px] w-[17.6px] shrink-0" strokeWidth={2.3} />
                <input
                  value={value}
                  onChange={handleSearchChange}
                  placeholder="Søg i frøbanken"
                  className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-[#374232] outline-none placeholder:text-[#696A60]"
                  style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
                />
              </label>

              <button
                type="button"
                onClick={onFilterClick}
                aria-label="Åbn filter og sortering"
                className="pf-light flex h-[48px] w-[45px] shrink-0 items-center justify-center rounded-[14px] text-[#5F6758] transition"
                style={{
                  background: '#EFEBE1',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(210,200,185,0.28), 0 5px 12px rgba(73,64,48,0.10)',
                }}
              >
                <SlidersHorizontal className="h-[22px] w-[22px]" strokeWidth={1.85} />
              </button>
            </div>

            <div className="relative -mr-[24px] mt-[18px]">
              <div className="flex gap-[10px] overflow-x-auto pr-8 pb-1 outline-none focus:outline-none focus-visible:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" tabIndex={-1}>
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
                className="pointer-events-none absolute bottom-0 right-0 top-0 w-10 bg-gradient-to-l from-[#B9B7A1] to-transparent"
              />
            </div>

            <div className="mt-[16px] flex flex-wrap gap-[10px]">
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
        'inline-flex h-[44px] shrink-0 items-center rounded-[13px] px-2 font-sans text-[0.75rem] font-medium transition',
        category.id === 'knolde' ? 'gap-[4px] min-w-[95px]' : 'gap-[11px] min-w-[85px]',
        active ? 'text-[#F7F3E8] pf-green' : 'text-[#4E564B] pf-light',
      ].join(' ')}
      style={
        active
          ? {
              background: 'linear-gradient(180deg, #646F43 0%, #566337 55%, #46512B 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(55,70,35,0.20), 0 7px 14px rgba(54,69,32,0.22)',
            }
          : {
              background: '#DDD8CB',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72), inset 0 -1px 0 rgba(210,200,185,0.24), 0 5px 11px rgba(75,66,50,0.10)',
            }
      }
    >
      <Icon
        className={['h-[18px] w-[18px] shrink-0', category.id === 'loeg' ? '-mr-1' : '', active ? 'text-[#F7F3E8]' : 'text-[#4E5B43]'].join(' ')}
        strokeWidth={1.65}
      />
      <span className="inline-flex items-baseline gap-[10px]">
        {category.label}
        <span className={active ? 'font-normal text-[#EDE7D8]' : 'font-normal text-[#777D70]'}>
          {category.count}
        </span>
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
        'h-[36px] rounded-full px-[18px] font-sans text-[0.68rem] transition',
        active ? 'min-w-[68px] font-medium text-[#F7F3E8] pf-green' : 'font-normal text-[#5F6758] pf-light',
      ].join(' ')}
      style={
        active
          ? {
              background: '#566337',
              boxShadow: 'inset 0 -1px 0 rgba(55,70,35,0.18), 0 5px 10px rgba(54,69,32,0.18)',
            }
          : {
              background: '#D0CBBA',
              boxShadow: 'inset 0 -1px 0 rgba(210,200,185,0.22), 0 4px 9px rgba(75,66,50,0.08)',
            }
      }
    >
      <span>{filter.label}</span>
    </button>
  )
}

function BotanicalLine() {
  const lines = (
    <>
      <path d="M74 132c-7-34-5-72 7-113" fill="none" strokeLinecap="round" strokeWidth="2.2" />
      <path
        d="M75 91c-22-6-39-19-51-39 25 1 43 14 51 39ZM83 75c19-14 31-31 35-54-22 7-35 24-35 54ZM70 117c-18-4-32-15-41-31 20-1 35 10 41 31Z"
        fill="none"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M55 49c-2-13 2-25 11-37 10 16 7 29-11 37ZM100 34c13-7 25-7 36 1-12 12-25 12-36-1Z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </>
  )
  // Blindpræg: lys højlys-linje (offset op-venstre) + mørkere linje (offset ned-højre)
  // + dæmpet hovedlinje — så illustrationen læses som presset ned i papiret, ikke
  // tegnet ovenpå. Total opacity ~0.18–0.24 via stroke-alfaer.
  return (
    <svg
      aria-hidden
      viewBox="0 0 150 150"
      className="pointer-events-none absolute right-6 top-8 h-24 w-24"
    >
      <g transform="translate(-0.5 -0.5)" stroke="rgba(255,255,255,0.20)">{lines}</g>
      <g transform="translate(0.5 0.5)" stroke="rgba(100,106,90,0.16)">{lines}</g>
      <g stroke="rgba(106,112,96,0.18)">{lines}</g>
    </svg>
  )
}

export const SEED_BANK_FOLDER_DEFAULT_CATEGORIES = DEFAULT_CATEGORIES
export const SEED_BANK_FOLDER_DEFAULT_FILTERS = DEFAULT_FILTERS
