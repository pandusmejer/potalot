'use client'

import Link from 'next/link'
import { MONTHS_DA, PRIMARY_CATEGORIES } from '@/lib/constants'
import { plantColor } from '@/lib/plant-color'
import type { InventoryItem } from '@/lib/types'
import { Sprout, Check, ArrowDownToLine, Sun, Hourglass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Fragment, type ComponentType, type SVGProps } from 'react'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { froeRaekkevidde } from '@/lib/afledninger'

/**
 * Konverter fri tekst til kebab-case slug for asset-convention lookup
 * når item.guideId mangler (legacy DB-items uden guide-kobling).
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface Props {
  item: InventoryItem
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  /** Hvis true: skjul "MIN FRØBANK · FRØ" eyebrow. Bruges af stack-
   *  kortene i Frøbank-arkivet hvor eyebrow er overflødig. */
  hideEyebrow?: boolean
  /** Skalér plantenavnets fontSize. Default 1.0 (= 30 px).
   *  Bruges af stack-kortene der ønsker mindre overskrift. */
  nameScale?: number
  /** Hvis true: skjul ALT overlay-indhold (eyebrow + navn + sort +
   *  count-ring) så kun fotoet er synligt. Bruges af stack-kortene
   *  under hover-tilstand. */
  hideOverlay?: boolean
}

const sans = 'var(--font-manrope)'

function formatMonths(months: number[] | undefined | null): string {
  if (!months || months.length === 0) return '—'
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].short
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}

function formatSaadybde(mm: number | null | undefined): string {
  if (mm == null || mm < 0) return '—'
  if (mm === 0) return 'Overflade'
  if (mm < 10) return `${mm} mm`
  return `${(mm / 10).toLocaleString('da-DK')} cm`
}

const LIGHT_LABEL: Record<string, string> = {
  full_sun: 'Sol', partial_shade: 'Halvskygge', shade: 'Skygge',
}

/**
 * Frøkort — viser et FULDT komponeret botanisk foto (lys, dug,
 * atmosfære, dybde ligger i selve billedet) med et minimalt UI-
 * overlay: eyebrow + titel + sort, glas-kapsel-badge og et
 * creme-dyrkningspanel. Mangler et billede, vises en rolig
 * ensfarvet fallback indtil det komponerede foto findes.
 */
export function InventoryCard({ item, selectMode = false, selected = false, onToggleSelect, hideEyebrow = false, nameScale = 1, hideOverlay = false }: Props) {
  // V4.1: canonical resolver håndterer ALT — eget upload (valideret
  // mod manifest), guide-images entry, asset-convention pr. slug,
  // placeholder. Brudte/stale DB-paths (fx /images/froebank/froekort-…
  // som aldrig har eksisteret) falder automatisk til asset-convention.
  // Canonical resolver, rolle: seed-card. Falder gennem 4 lag:
  //   1. preferredSrc (item.primaryImageId, valideret mod manifest)
  //   2. POTALOT_IMAGE_SETS_BY_ID[guideId].seedCard
  //   3. /images/frokort/<varietySlug>.{png,jpg}
  //   4. placeholder
  // Ingen cross-role fald — Corno bliver ikke til California Wonder.
  const varietySlug =
    item.guideId ??
    (item.variety ? slugify(`${item.name}-${item.variety}`) : null)
  const { src: heroImage } = resolvePotalotImage({
    guideId: item.guideId,
    varietySlug,
    role: 'seed-card',
    preferredSrc: item.primaryImageId,
  })
  const { field } = plantColor(item.name, item.variety)
  const kategori = PRIMARY_CATEGORIES[item.primaryCategoryId]?.name ?? 'Frø'
  const eyebrow = `Min frøbank · ${kategori}`

  const harSeed = item.seedCount != null
  const tilbage = harSeed ? (item.seedsRemaining ?? item.seedCount ?? 0) : null

  // Sprint 1 (afledningsmotoren, F4): "Rækker ~7 sæsoner" — afledt
  // af seedsRemaining / seedsSown. For et frø PÅ LAGER er rækkevidden
  // mere relevant end sådybden (som hører til så-øjeblikket og stadig
  // findes i detail + så-dialog). Sådybde-cellen viger derfor når
  // afledningen findes; ved datahuller (aldrig sået fra) vises
  // Sådybde som hidtil — stilhed, ingen advarsler.
  const raekkevidde = froeRaekkevidde(item)

  const fakta: { label: string; value: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
    item.germinationDays
      ? { label: 'Spiring', value: item.germinationDays, Icon: Sprout }
      : { label: 'Sås', value: formatMonths(item.sowingMonths), Icon: Sprout },
    raekkevidde
      ? { label: 'Rækker', value: raekkevidde.text, Icon: Hourglass }
      : { label: 'Sådybde', value: formatSaadybde(item.sowingDepthMm), Icon: ArrowDownToLine },
    { label: 'Placering', value: item.light ? (LIGHT_LABEL[item.light] ?? '—') : '—', Icon: Sun },
  ]

  const inner = (
    <>
      {/* FULDT KOMPONERET BILLEDE — al atmosfære lever her.
          Stopgap: billedet skubbes ~11% op (translateY) så grøntsagen
          sidder højere med åndehul under. Toppen klippes en smule;
          bund-gabet skjules bag creme-panelet. */}
      {heroImage ? (
        <div aria-hidden className="absolute inset-0" style={{ transform: 'translateY(-11%)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div aria-hidden className="absolute inset-0" style={{ background: field }} />
      )}

      {/* Læsbarheds-scrim — kun nok til at hvid tekst altid kan læses.
          Skjules sammen med overlayet på hover-stack-kort. */}
      {!hideOverlay && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42%]"
          style={{ background: 'linear-gradient(180deg, rgba(18,14,10,0.34) 0%, rgba(18,14,10,0.08) 55%, transparent 100%)' }}
        />
      )}

      {/* TOP-VENSTRE — eyebrow + titel + sort.
          Skjules som hele blokken når hideOverlay = true. */}
      {!hideOverlay && (
        <div className="absolute left-0 top-0 z-10 max-w-[70%] p-[20px]">
          {!hideEyebrow && (
            <p
              className="uppercase"
              style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', color: '#FFFFFF', opacity: 0.92, textShadow: '0 1px 4px rgba(20,14,8,0.45)' }}
            >
              {eyebrow}
            </p>
          )}
          <h3
            className={hideEyebrow ? '' : 'mt-2'}
            style={{ fontFamily: sans, fontSize: 30 * nameScale, fontWeight: 800, lineHeight: 1.02, color: '#FFFFFF', textShadow: '0 2px 12px rgba(20,14,8,0.42)' }}
          >
            {item.name}
          </h3>
          {item.variety && (
            <p
              className="mt-1.5 truncate"
              style={{ fontFamily: sans, fontSize: 16, fontWeight: 500, letterSpacing: '0.02em', color: '#FFFFFF', opacity: 0.74, textShadow: '0 1px 6px rgba(20,14,8,0.38)' }}
            >
              {item.variety}
            </p>
          )}
        </div>
      )}

      {/* SELECT-MODE — checkmark */}
      {selectMode && (
        <div
          className="absolute right-[16px] top-[16px] z-20 flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            background: selected ? '#4F6F35' : 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(255,255,255,0.6)',
          }}
        >
          {selected && <Check className="h-[17px] w-[17px] text-white" strokeWidth={2.5} />}
        </div>
      )}

      {/* SEED COUNT RING — diskret inventar-instrument øverst til
          højre INDE i billedet. Bryder ikke kortets kant. Vises kun
          når der findes seedCount-data, ikke under select-mode, og
          ikke når overlay er skjult (hover-state på stack-kort). */}
      {!selectMode && !hideOverlay && tilbage != null && (
        <SeedCountRing remaining={tilbage} total={item.seedCount} />
      )}

      {/* BUND — warm botanical paper-panel.
          Mål: trykt frøposepapir med en anelse optisk blødhed.
          Ikke glassmorphism, ikke iOS-frostet glas. Let transparent
          (alpha 0.94) for at integrere med fotoet uden at bryde
          læsbarheden; minimal backdrop-blur (2px) giver kun den
          subtile optiske blødhed papiret tilbyder. */}
      <div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{
          background: 'rgba(246,243,235,0.94)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderTop: '1px solid rgba(36,48,31,0.06)',
          boxShadow: '0 -4px 14px rgba(36,48,31,0.04)',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: '14px 16px 14px',
        }}
      >
        {/* Månedsindikator — kompakt seed-packet-bar med 3 stadier */}
        <MonthIndicator item={item} />

        {/* Skille-streg — næsten usynlig, "trykt" snarere end "UI" */}
        <div className="my-3" style={{ height: 1, background: 'rgba(216,210,195,0.55)' }} />

        {/* Fakta-række — Spiring · Sådybde · Placering.
            Hver kolonne: stort strukturelt ikon TIL VENSTRE +
            label/value-stack TIL HØJRE, vertikalt centreret mod
            hele tekstblokken. Label og value deler venstrekant.
            Subtile inset-dividere mellem kolonnerne. */}
        <div className="flex items-stretch">
          {fakta.map((f, i) => {
            const Icon = f.Icon
            return (
              <Fragment key={f.label}>
                {i > 0 && (
                  <div
                    aria-hidden
                    className="shrink-0"
                    style={{
                      width: 1,
                      background: 'rgba(36,48,31,0.08)',
                      marginInline: 10,
                      marginBlock: 4,
                    }}
                  />
                )}
                <div className="flex flex-1 items-center min-w-0" style={{ gap: 12 }}>
                  <Icon
                    className="shrink-0"
                    width={22}
                    height={22}
                    strokeWidth={1.75}
                    style={{ color: '#7B816F' }}
                  />
                  <div className="min-w-0">
                    <p
                      className="uppercase"
                      style={{
                        fontFamily: sans,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        color: '#7B816F',
                        lineHeight: 1,
                      }}
                    >
                      {f.label}
                    </p>
                    <p
                      className="truncate"
                      style={{
                        fontFamily: sans,
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.15,
                        color: '#24301F',
                        marginTop: 4,
                      }}
                    >
                      {f.value}
                    </p>
                  </div>
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
    </>
  )

  const className = cn(
    'group relative block aspect-[4/5] w-full overflow-hidden rounded-[32px] transition-all duration-200 ease-out',
    'hover:-translate-y-0.5',
    selected && 'ring-2 ring-[#4F6F35] ring-offset-2 ring-offset-[var(--background)]'
  )
  const style = { boxShadow: '0 20px 44px rgba(26,34,22,0.18)' } as const

  if (selectMode) {
    return (
      <button type="button" onClick={onToggleSelect} aria-pressed={selected} className={cn(className, 'text-left')} style={style}>
        {inner}
      </button>
    )
  }
  return (
    <Link href={`/froebank/${item.id}`} className={className} style={style}>
      {inner}
    </Link>
  )
}

/**
 * Seed count ring — diskret cirkulært inventar-instrument øverst til
 * højre på frøkortet. Tynd progress-ring (3px round) viser hvor
 * mange frø der er tilbage relativt til oprindelig pakke. Center-
 * tekst: tal + "frø".
 *
 * Sidder INDE i billedet (bryder ikke kortkanten). Subtilt glas-
 * lignende lag: mørk halvtransparent bund + 8px backdrop-blur +
 * varm papirfarvet 1px-kant. Tekst i varm ivory.
 *
 * Farvelogik for ringen:
 *   • normal:   #EAE3D5 (varm ivory)
 *   • lav (<30%):     #C89A35 (dæmpet ochre)
 *   • meget lav (<10%): #B86645 (dæmpet terracotta)
 * Aldrig rød. Aldrig neon. Aldrig gradient.
 *
 * Hvis original-mængde mangler vises en neutral statisk ring på 65%
 * — så cirklen stadig læses som instrument, ikke som tomhed.
 */
function SeedCountRing({ remaining, total }: { remaining: number; total?: number | null }) {
  const hasTotal = total != null && total > 0
  const percent = hasTotal ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 65

  let activeColor = '#EAE3D5'
  if (hasTotal) {
    if (percent < 10) activeColor = '#B86645'
    else if (percent < 30) activeColor = '#C89A35'
  }

  // Cirklen er 20 % mindre end før (64 → 51) — gælder alle frøkort.
  const size = 51
  const stroke = 2.4
  const radius = (size - stroke) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percent / 100)

  return (
    <div
      className="pointer-events-none absolute right-[28px] top-[20px] z-20"
      style={{ width: size, height: size }}
    >
      {/* Glas-lignende baggrund — papir-vellum mod fotoet.
          Materialitet: subtle outer shadow + inset top highlight giver
          badgen den samme fysiske dybde som kortene under den. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          borderRadius: '50%',
          background: 'rgba(36,48,31,0.34)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          border: '1px solid rgba(246,243,235,0.22)',
          boxShadow: [
            '0 1px 2px rgba(0,0,0,0.04)',
            'inset 0 1px 0 rgba(255,255,255,0.18)',
          ].join(', '),
        }}
      />
      {/* Progress-ring */}
      <svg
        aria-hidden
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Base-track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(246,243,235,0.28)"
          strokeWidth={stroke}
        />
        {/* Aktiv arc — starter ved 12 o'clock, går med uret */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {/* Center-tekst: tal + "frø" (to linjer) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1,
            color: '#F6F3EB',
          }}
        >
          {remaining}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: '#F6F3EB',
            marginTop: 2,
          }}
        >
          frø
        </span>
      </div>
    </div>
  )
}

const MONTH_LABELS = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AUG','SEP','OKT','NOV','DEC']

interface StateDef {
  label: string
  color: string
  months: number[]
}

/**
 * Botanisk dyrkningsmarkør — lille 4-lobet organisk silhouet
 * (kvartfolie/clover), fyldt med farven for det pågældende
 * dyrkningsstadie. Bevidst lille (10×10 px) så den læses som
 * trykt notation, ikke som UI-badge.
 *
 * Formen er fire overlappende cirkler (r=2.5 ved kompasspunkterne)
 * der mødes i centrum — giver bløde konvekse buer på de fire sider
 * og bløde konkave indhug på diagonalerne. Organisk, venlig, ikke
 * geometrisk.
 */
function CultivationMarker({ color, muted = false }: { color: string; muted?: boolean }) {
  const fill = muted ? 'rgba(36,48,31,0.18)' : color
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 10"
      width="10"
      height="10"
      className="shrink-0"
    >
      <circle cx="5" cy="2.5" r="2.5" fill={fill} />
      <circle cx="5" cy="7.5" r="2.5" fill={fill} />
      <circle cx="2.5" cy="5" r="2.5" fill={fill} />
      <circle cx="7.5" cy="5" r="2.5" fill={fill} />
    </svg>
  )
}

/**
 * Månedsindikator — kompakt trykt dyrkningsstribe i én delt timeline.
 *
 * Strukturelt: én vandret baseline JAN–DEC med 11 ultratynde
 * måneds-divider-ticks som præcisionsmarkører. Tre farvede ranges
 * (forspires / så direkte / høst) sidder som overlaid bars på samme
 * baseline. Legendens tre kolonner er ligedelt centreret.
 *
 * Rendering-matematikken understøtter fraktionelle måneds-positioner
 * (fx "midt-marts → sen-april"), selv om vores nuværende datamodel
 * kun lagrer hele måneder. Bars vil derfor altid lande præcist
 * mellem divider-ticks.
 *
 * Visuelt mål: information trykt på en premium-skandinavisk frøpose
 * — ikke et app-widget.
 */
function MonthIndicator({ item }: { item: InventoryItem }) {
  const sow = item.sowingMonths ?? []
  const states: StateDef[] = [
    { label: 'forspires',  color: '#A7B08A', months: item.preCultivation ? sow : [] },
    { label: 'så direkte', color: '#617345', months: item.preCultivation ? [] : sow },
    { label: 'høst',       color: '#C89A35', months: item.harvestMonths ?? [] },
  ]

  // Min..max måned for hver state (eller null hvis ingen). Tal er
  // 1–12 hele måneder, men matematik nedenfor håndterer også
  // fraktioner (fx 3.5 for midt-marts) hvis datamodellen udvides.
  const range = (ms: number[]): [number, number] | null =>
    ms.length ? [Math.min(...ms), Math.max(...ms)] : null

  return (
    <div>
      {/* Legend — tre ligedelte kolonner, hver med lille 4-lobet
          botanisk markør + lowercase label. Perfekt centreret. */}
      <div className="grid grid-cols-3">
        {states.map(s => {
          const muted = !range(s.months)
          return (
            <div key={s.label} className="flex items-center justify-center" style={{ gap: 8 }}>
              <CultivationMarker color={s.color} muted={muted} />
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  color: muted ? 'rgba(111,117,99,0.55)' : '#6F7563',
                }}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ÉN delt timeline JAN–DEC.
          – 1px baseline gennem hele bredden
          – 11 ultratynde måneds-divider-ticks (præcisionsmarkører)
          – farvede ranges overlaid centreret på samme baseline */}
      <div className="relative mt-3" style={{ height: 8 }}>
        {/* base-linje */}
        <div
          className="absolute left-0 right-0"
          style={{ top: 3.5, height: 1, background: 'rgba(36,48,31,0.12)' }}
        />
        {/* 11 måneds-divider-ticks — mellem hver måned, ikke dominerende */}
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${((i + 1) / 12) * 100}%`,
              top: 0,
              width: 1,
              height: 8,
              marginLeft: -0.5,
              background: 'rgba(36,48,31,0.14)',
            }}
          />
        ))}
        {/* farvede ranges — overlaid på samme baseline */}
        {states.map(s => {
          const r = range(s.months)
          if (!r) return null
          return (
            <div
              key={s.label}
              className="absolute rounded-full"
              style={{
                top: 2,
                height: 4,
                left: `${((r[0] - 1) / 12) * 100}%`,
                width: `${((r[1] - r[0] + 1) / 12) * 100}%`,
                background: s.color,
              }}
            />
          )
        })}
      </div>

      {/* Måneds-labels — kompakt, dæmpet, sidder direkte under timelinen */}
      <div
        className="mt-2 grid grid-cols-12 text-center"
        style={{
          fontFamily: sans,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: 'rgba(36,48,31,0.62)',
        }}
      >
        {MONTH_LABELS.map(m => <span key={m}>{m}</span>)}
      </div>
    </div>
  )
}
