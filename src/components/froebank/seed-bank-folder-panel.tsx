'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ChevronRight,
  Leaf,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  FroebankFro,
  FroebankLoeg,
  FroebankKnolde,
  FroebankBuske,
  FroebankTraeer,
  FroebankStauder,
} from './froebank-category-glyphs'

/** Ikon-komponent (lucide ELLER custom inline-SVG) — begge tager className + strokeWidth. */
type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>

// Kategori-glyffer = Potalot Soft Glyphs i illustrativt register (LÅST 28/6, matcher
// Annas reference): bløde, botaniske, 2-3 dæmpede farvelag — IKKE monoline/flade.
// Selve glyfferne lever i ./froebank-category-glyphs. Funktionelle ikoner (Søg/
// Filter/Plus/Bladr) forbliver Lucide-streg.

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
  /** Aktiv underkategori vises som en lille, rolig filter-TOKEN i mappen (ikke som
   *  kategori-chip på niveau med Frø/Løg). Selve VALGET af underkategori sker nu i
   *  filter-bottom-sheet — ikke her. Panelet skal kun bruge label + ryd-handler. */
  activeSubcategoryLabel?: string
  onClearSubcategory?: () => void
  activeFilter?: FilterId
  filters?: SeedBankFolderFilter[]
  searchValue?: string
  onSearchChange?: (value: string) => void
  onFilterClick?: () => void
  onCategoryChange?: (categoryId: CategoryId) => void
  onFilterChange?: (filterId: FilterId) => void
  activeFilterChips?: { id: string; label: string }[]
  onRemoveFilterChip?: (id: string) => void
  children?: React.ReactNode
  extraContent?: React.ReactNode
}

const DEFAULT_CATEGORIES: SeedBankFolderCategory[] = [
  { id: 'fro', label: 'Frø', count: 8, icon: FroebankFro },
  { id: 'loeg', label: 'Løg', count: 0, icon: FroebankLoeg },
  { id: 'knolde', label: 'Knolde', count: 0, icon: FroebankKnolde },
  { id: 'buske', label: 'Buske', count: 0, icon: FroebankBuske },
  { id: 'traeer', label: 'Træer', count: 0, icon: FroebankTraeer },
  { id: 'stauder', label: 'Stauder', count: 0, icon: FroebankStauder },
]

const CATEGORY_ICONS: Record<string, IconType> = {
  fro: FroebankFro,
  loeg: FroebankLoeg,
  knolde: FroebankKnolde,
  buske: FroebankBuske,
  traeer: FroebankTraeer,
  stauder: FroebankStauder,
}

// (Aktiv-flise-reglen fjernet 29/6 — aktiv-tilstand bæres nu af hele pillen,
//  ikke en separat flise bag ikonet. Se CategoryPill.)

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
  activeSubcategoryLabel,
  onClearSubcategory,
  activeFilter = 'alle',
  filters = DEFAULT_FILTERS,
  searchValue,
  onSearchChange,
  onFilterClick,
  onCategoryChange,
  onFilterChange,
  activeFilterChips,
  onRemoveFilterChip,
  children,
  extraContent,
}: SeedBankFolderPanelProps) {
  const [internalSearch, setInternalSearch] = React.useState('')
  const value = searchValue ?? internalSearch
  // Når aktive avancerede chips vises, optager de plads i mappen. For at folderen
  // bevarer ~samme samlede højde (og dermed clip-k + skulder-form), klemmes CTA-
  // margin + bund-padding tilsvarende ind. Mål: uændret skulder/topform med/uden chips.
  const hasActiveChips =
    (activeFilterChips?.length ?? 0) > 0 || Boolean(activeSubcategoryLabel)

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
            {/* Top-y + bund-hjørner skaleret så skulder OG bundhjørner bevarer NØJAGTIG
                samme pixels ved mappens højde ~626px (vokset fra 530px da Tilføj-CTA'en
                kom ind; k=530/626=0.8466: top-y × k, bund-y = 1−(1−y)×k). Kun den lige
                krop forlænges — ingen proportionsændring. Re-tunes hvis højden ændres
                igen (k = 530/nyHøjde anvendt på DENNE path's nuværende værdier). */}
            <path d="M0 0.9758L0 0.0928C0 0.0626 0.012 0.0544 0.0213 0.0528C0.0319 0.0503 0.0399 0.0442 0.0452 0.0338C0.0519 0.0217 0.0638 0.0173 0.0838 0.0173L0.4029 0.0173C0.4229 0.0173 0.4362 0.0182 0.4441 0.0208C0.4521 0.0234 0.4574 0.0268 0.4628 0.0312C0.4681 0.0356 0.4734 0.0500 0.4814 0.0500L0.9495 0.0500C0.9654 0.0500 0.9774 0.0525 0.9867 0.0586C0.996 0.0647 1 0.0725 1 0.0829L1 0.9758C1 0.9896 0.984 1 0.9738 1L0.0372 1C0.016 1 0 0.9896 0 0.9758Z" />
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
        .cat-pill-active:hover{background:#687847 !important;}
        .cat-pill-active:active{box-shadow:0 3px 8px rgba(54,66,36,0.13), inset 0 1px 0 rgba(255,255,255,0.14) !important;}
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
            paddingBottom: hasActiveChips ? 98 : 113,
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

          {/* Botanisk vandmærke fjernet igen (billede: public/images/ui/botanik-vandmaerke.png) */}

          <div className="relative z-10">
            <header className="max-w-[26rem]">
              <p
                className="relative top-px text-[clamp(2.25rem,9.7vw,2.5rem)] leading-[1.02] tracking-[-0.01em] text-[#263321]"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 600 }}
              >
                Din Frøbank
              </p>
              <p className="mt-[6px] font-sans text-[14px] font-normal leading-[1.3] text-[#687060]">
                Dine sorter, samlet og klar til sæsonen.
              </p>
            </header>

            <div
              className="mt-[14px] inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-[8px] text-[11px] font-normal leading-[1.3] text-[#5F6758]"
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

            {/* Underkategori-rækken er FJERNET fra hero (Anna 29/6): "Grøntsager"
                opførte sig visuelt som en kategori på niveau med Frø/Løg/Knolde og
                brød taksonomien. Underkategorier ER indholdsfilter — de vælges nu i
                filter-bottom-sheet og vises kun her som en lille token når ét er aktivt. */}

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

            {/* Aktiv underkategori = lille, rolig filter-token UNDER sorterings-chippene
                (Anna-spec). Bevidst neutral/dæmpet — ikke en kategori-chip, ikke den
                grønne avancerede-filter-chip. × rydder filteret. */}
            {activeSubcategoryLabel && (
              <div className="mt-[10px] flex flex-wrap gap-[8px]">
                <button
                  type="button"
                  onClick={onClearSubcategory}
                  aria-label={`Fjern indholdsfilter: ${activeSubcategoryLabel}`}
                  className="inline-flex items-center gap-[6px] font-sans transition active:translate-y-px"
                  style={{
                    height: 30,
                    paddingInline: 12,
                    borderRadius: 999,
                    background: 'rgba(238,232,218,0.72)',
                    border: '1px solid rgba(92,84,62,0.10)',
                    color: '#626B58',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span>{activeSubcategoryLabel}</span>
                  <X className="h-[13px] w-[13px]" strokeWidth={2.4} />
                </button>
              </div>
            )}

            {/* Aktive avancerede filtre (valgt i bottom sheet) — små grønne
                chips med × til at fjerne det enkelte filter. Vises kun når der
                ER aktive avancerede valg. */}
            {activeFilterChips && activeFilterChips.length > 0 && (
              <div className="mt-[10px] flex flex-wrap gap-[8px]">
                {activeFilterChips.map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => onRemoveFilterChip?.(chip.id)}
                    aria-label={`Fjern filter: ${chip.label}`}
                    className="inline-flex items-center gap-[6px] rounded-full px-[12px] py-[6px] font-sans text-[0.7rem] font-medium text-[#F7F3E8] transition active:translate-y-px"
                    style={{
                      background:
                        'linear-gradient(180deg, #646F43 0%, #566337 60%, #46512B 100%)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 3px rgba(54,69,32,0.18)',
                    }}
                  >
                    <span>{chip.label}</span>
                    <X className="h-3 w-3" strokeWidth={2.4} />
                  </button>
                ))}
              </div>
            )}

            {/* Primær indgang: "Tilføj til frøbanken" — bred, taktil, indlagt
                handlingsbjælke i mappefladen (IKKE en standard SaaS-knap). Åbner det
                eksisterende tilføj-flow (/froebank/tilfoej → alle 6 metoder). Tydeligere
                end "Senest tilføjet"-pillen; primærfunktionen vinder pladsen. */}
            <Link
              href="/froebank/tilfoej"
              aria-label="Tilføj til frøbanken"
              className={`${hasActiveChips ? 'mt-3' : 'mt-9'} flex items-center gap-[14px] rounded-[16px] px-[18px] py-[14px] no-underline transition active:translate-y-px`}
              style={{
                background: 'linear-gradient(180deg, rgba(246,241,231,0.88) 0%, rgba(237,229,214,0.92) 100%)',
                border: '1px solid rgba(255,255,255,0.38)',
                boxShadow:
                  'inset 0 1px 1px rgba(255,255,255,0.58), inset 0 -2px 3px rgba(122,112,88,0.14), 0 2px 5px rgba(64,58,42,0.06)',
              }}
            >
              <span
                aria-hidden
                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] text-[#F7F3E8]"
                style={{
                  background: 'linear-gradient(180deg, #646F43 0%, #566337 55%, #46512B 100%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.16), 0 5px 10px rgba(54,69,32,0.22)',
                }}
              >
                <Plus className="h-[22px] w-[22px]" strokeWidth={2.4} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-sans text-[15px] font-semibold leading-[1.2] text-[#2E3A23]">
                  Tilføj til frøbanken
                </span>
                <span className="mt-[1px] font-sans text-[11.5px] font-normal leading-[1.3] text-[#6B7160]">
                  Scan pose, upload billede, indsæt link eller importér
                </span>
              </span>
              <ChevronRight aria-hidden className="ml-auto h-5 w-5 shrink-0 text-[#7A806F] opacity-[0.85]" strokeWidth={2} />
            </Link>

            {/* "Bladr i din frøbank" — divider i mappens bundflade; lead-in til
                frøkort-stakken nedenfor: eyebrow-tekst + tynde streger + blad-glyph. */}
            <div className="mt-7 flex flex-col items-center gap-[7px]">
              <p className="text-center font-sans text-[0.68rem] font-medium uppercase tracking-[0.26em] text-[#646B5A]">
                Bladr i din frøbank
              </p>
              <div className="flex w-full items-center gap-4 px-[19px]">
                <span aria-hidden className="h-px flex-1 bg-[#5F6758]/30" />
                <BookOpen className="h-[18px] w-[18px] shrink-0 text-[#6E7660]" strokeWidth={1.6} />
                <span aria-hidden className="h-px flex-1 bg-[#5F6758]/30" />
              </div>
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
  const Icon = category.icon ?? CATEGORY_ICONS[category.id] ?? FroebankFro

  // Aktiv-tilstand bæres af HELE pillen (mørkegrøn + outline), ikke af en separat
  // flise bag ikonet. Glyf-billedet ligger direkte; en meget subtil drop-shadow
  // på selve billedet holder grøn-tunge ikoner læselige på den grønne pill.
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-[41px] shrink-0 items-center gap-[10px] min-w-[85px] rounded-[13px] px-2 font-sans text-[0.75rem] font-medium transition active:translate-y-px',
        active ? 'pf-green cat-pill-active' : 'pf-light hover:brightness-[0.97]',
      ].join(' ')}
      style={
        active
          ? {
              // Aktiv: lys, støvet grøn + BLØD kant (Anna 29/6) — ikke mørk
              // militærgrøn med hidsig næsten-sort outline. Hover/pressed i <style>.
              background: '#7D8D60',
              border: '1px solid rgba(64,78,42,0.42)',
              boxShadow: '0 5px 12px rgba(54,66,36,0.14), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(50,61,34,0.10)',
              color: '#FFF7E8',
            }
          : {
              background: '#E8E4D8',
              border: '1px solid rgba(92,84,62,0.14)',
              boxShadow: '0 3px 8px rgba(64,58,42,0.08), inset 0 1px 0 rgba(255,255,255,0.34)',
              color: '#56604B',
            }
      }
    >
      <span
        className="inline-flex shrink-0"
        style={active ? { filter: 'drop-shadow(0 1px 1px rgba(31,39,23,0.16))' } : undefined}
      >
        <Icon className="h-[20px] w-[20px] shrink-0" />
      </span>
      <span className="inline-flex items-baseline gap-[10px]">
        {category.label}
        <span style={{ fontWeight: 400, color: active ? 'rgba(255,247,232,0.78)' : 'rgba(86,96,75,0.72)' }}>
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
