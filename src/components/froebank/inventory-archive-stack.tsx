'use client'

/**
 * "InventoryArchiveStack" — frøbankens komplette arkivsystem:
 *
 *   ┌─────────────────────┐
 *   │                     │
 *   │   HERO frøkort      │  ← første frø, fuld InventoryCard m. overlay
 *   │   (Tomat / etc.)    │
 *   │                     │
 *   └─────────────────────┘  ← stakken begynder direkte herfra
 *      ╱──────────────────╲
 *     │ Frø 2 i mappe       │   ← compact preview clipped to folder shape
 *      ╱──────────────────╲
 *     │ Frø 3 i mappe       │
 *      ╱──────────────────╲
 *           ...
 *      ╱──────────────────╲
 *     │ TOM mappe           │   ← efter brugerens frø: tomme mapper
 *      ╱──────────────────╲
 *           ...fader ud
 *
 * Folder-geometri (form, cascade, fade) er 1:1 fra EmptyFolderStack
 * (låst design). Forskellen: hver mappe der hører til et frø
 * indeholder en compact preview af kortet, clipped til folder-formen.
 *
 * Demo-data: hele DEMO_INVENTORY (7 frø). Når brugeren har egne frø,
 * bruges deres data i stedet.
 */

import { useState } from 'react'
import { InventoryCard } from './inventory-card'
import type { InventoryItem } from '@/lib/types'

// ── Folder geometry — bredde matcher hero-frøkortet ─────────────
// Mapperne har samme bredde som InventoryCard (= 390 px ved max),
// så de visuelt aligner med hero-kortet og fylder containeren ens.
// Højden er vokset fra 111 → 135 px så stack-spacing (105 px) kan
// bevare overlap uden luft mellem mapperne.
const FOLDER_WIDTH = 390
const FOLDER_HEIGHT = 135
const CONTAINER_WIDTH = 390
const CONTAINER_HEIGHT = 1000
const CONTAINER_BG = 'rgba(243,242,237,0.72)'
const CONTAINER_RADIUS = 36

// Bygger folder-silhuet path for vilkårlig højde H.
// Venstre side + notch-coords (y=0-26) er BEVARET — kun bunden
// skaleres så folderen kan vokse i længden ved hover/expand.
function buildFolderPath(H: number): string {
  const BOTTOM_CORNER_START = H - 4
  const BOW_Y = H + 2
  return `
    M 0 26
    Q 0 0 16 0
    L 110 0
    Q 130 0 140 10
    L 374 10
    Q 390 10 390 26
    L 390 ${BOTTOM_CORNER_START}
    Q 390 ${H} 386 ${H}
    Q 195 ${BOW_Y} 4 ${H}
    Q 0 ${H} 0 ${BOTTOM_CORNER_START}
    Z
  `.replace(/\s+/g, ' ').trim()
}

// Default-folder path (statisk H = FOLDER_HEIGHT).
const FOLDER_PATH = buildFolderPath(FOLDER_HEIGHT)
const FOLDER_CLIP = `path('${FOLDER_PATH}')`

// Folder-lag konfiguration — 12 slots, 105 px spacing, bell-curve shadows.
// Spacing øget fra 81 → 105 så hver mappes synlige strimmel rummer
// både navn OG variety/sort. Folder-højde 135 sikrer 30 px overlap.
const FOLDER_CONFIG = [
  { y: 28,   zIndex: 1,  shadowOpacity: 0.014, xOffset:  0 },
  { y: 133,  zIndex: 2,  shadowOpacity: 0.018, xOffset:  1 },
  { y: 238,  zIndex: 3,  shadowOpacity: 0.022, xOffset: -1 },
  { y: 343,  zIndex: 4,  shadowOpacity: 0.028, xOffset:  1 },
  { y: 448,  zIndex: 5,  shadowOpacity: 0.032, xOffset:  0 },
  { y: 553,  zIndex: 6,  shadowOpacity: 0.028, xOffset: -1 },
  { y: 658,  zIndex: 7,  shadowOpacity: 0.018, xOffset:  0 },
  { y: 763,  zIndex: 8,  shadowOpacity: 0.014, xOffset:  1 },
  { y: 868,  zIndex: 9,  shadowOpacity: 0.012, xOffset: -1 },
  { y: 973,  zIndex: 10, shadowOpacity: 0.010, xOffset:  0 },
  { y: 1078, zIndex: 11, shadowOpacity: 0.008, xOffset:  1 },
  { y: 1183, zIndex: 12, shadowOpacity: 0.006, xOffset: -1 },
] as const

// Outer drop-shadow på folder-silhuetten (følger clip-path-formen).
// To lag — tæt 1 px + medium 4 px spread.
const FOLDER_OUTER_FILTER = [
  'drop-shadow(0 1px 2px rgba(0,0,0,0.02))',
  'drop-shadow(0 4px 10px rgba(0,0,0,0.028))',
].join(' ')

// Stærkere drop-shadow for den ØVERSTE synlige folder (slot 0).
// Den skal stå tydeligere mod containerens beige baggrund så det
// er klart hvor stakken starter.
const FOLDER_TOP_FILTER = [
  'drop-shadow(0 2px 3px rgba(0,0,0,0.05))',
  'drop-shadow(0 8px 18px rgba(0,0,0,0.06))',
  'drop-shadow(0 16px 32px rgba(0,0,0,0.04))',
].join(' ')

// Inset box-shadows på folderen — giver papir-lignende indvendig dybde:
//   1. Hvid top-highlight (1 px) som antyder lys der rammer top-kanten
//   2. Mørk top-skygge (6 px blur) — papirets top-kant bukker indad
//   3. Blødere mid-skygge (18 px blur) — indvendig dybde dybere ned
const FOLDER_INSET_SHADOW = [
  'inset 0 1px 0 rgba(255,255,255,0.10)',
  'inset 0 2px 6px rgba(0,0,0,0.028)',
  'inset 0 12px 18px rgba(0,0,0,0.012)',
].join(', ')

// ── Folder lag — folder (med notch) BAG kortet (rektangulært) ──────
/**
 * Visuel struktur per slot:
 *   ╱──╲────────────  ← folder-notch peeker frem (kun top-venstre)
 *  │ Card med rounded │  ← rektangulært InventoryCard, IKKE clipped
 *  │ corners 32px     │     til folder-formen — har sin egen form
 *  ╰──────────────────╯
 *
 * Folderen (med shoulder-notch) sidder BAG kortet. Kortet er
 * rektangulært med 32 px rounded corners (samme som hero-kortet).
 * Kortets bredde dækker folderens body, så det eneste man ser af
 * folderen er notchen øverst-venstre + de subtile corner-gaps
 * hvor kortets rounded corners ikke når ud til folderens kant.
 *
 * For tomme mapper: kortet renderes ikke, så folder-silhuetten
 * (med notch + flad bund) er fuldt synlig som før.
 */
type SlotState = 'default' | 'hovered' | 'expanded'

function FolderLayer({
  config,
  yOffset,
  item,
  state,
  onHover,
  onLeave,
  isTopFolder = false,
}: {
  config: (typeof FOLDER_CONFIG)[number]
  yOffset: number
  item?: InventoryItem
  state: SlotState
  onHover?: () => void
  onLeave?: () => void
  isTopFolder?: boolean
}) {
  const { y, zIndex, shadowOpacity, xOffset } = config
  const isHovered = state === 'hovered'
  const isExpanded = state === 'expanded'

  // Folder-højden vokser med kortets synlige længde.
  const currentHeight = isExpanded
    ? FOLDER_HEIGHT + EXPAND_DELTA
    : isHovered
      ? FOLDER_HEIGHT + HOVER_DELTA
      : FOLDER_HEIGHT
  const currentClip = `path('${buildFolderPath(currentHeight)}')`

  return (
    <div
      onMouseEnter={() => item && onHover?.()}
      onMouseLeave={() => onLeave?.()}
      style={{
        position: 'absolute',
        top: y + yOffset,
        // Center folderen i container-bredden (uanset bredden).
        // xOffset giver subtil jitter per lag.
        left: '50%',
        marginLeft: -FOLDER_WIDTH / 2 + xOffset,
        width: FOLDER_WIDTH,
        // Kortet forbliver på SAMME visuelle niveau som mappen —
        // ingen kunstig zIndex-elevation. Folderen ovenfor dækker
        // stadig dette korts top som normalt.
        zIndex,
        transition: 'top 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* FOLDER (bagved) — div med clip-path så vi kan bruge inset
          box-shadows til at give papiret indvendig dybde. Folder-
          højden VOKSER ved hover/expanded så mappen følger kortets
          udvidelse — det visuelle indtryk er at folderen "ruller ud"
          sammen med kortet. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: FOLDER_WIDTH,
          height: currentHeight,
          // Den øverste mappe får stærkere skygge så den står
          // tydeligt mod arkiv-containerens beige baggrund.
          filter: isTopFolder ? FOLDER_TOP_FILTER : FOLDER_OUTER_FILTER,
          transition: 'height 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#F8F7F3',
            clipPath: currentClip,
            WebkitClipPath: currentClip,
            boxShadow: FOLDER_INSET_SHADOW,
            transition: 'clip-path 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>


      {/* FRØKORT (foran) — rektangulært InventoryCard med sin egen
          rounded-32px form. Sidder 25 px nedenunder folder-toppen
          (var 10 — sænket 15 px ≈ 4 mm). Mappens notch + en del af
          dens body peeker nu tydeligere frem OVER kortet.
          Kortet er IKKE clipped til folder-formen.
          15 px (≈ 4 mm) inset på hver side så kortet er smallere end
          mappen — papir-i-sleeve-feel.
          hideEyebrow + nameScale gør stack-kortene mindre prominente
          end hero-kortet (eyebrow væk, overskrift 20 % mindre).
          drop-shadow filter løfter kortet let fra folder-baggrunden
          så der opstår synlig dybde mellem kort og mappe. */}
      {item && (
        <div
          style={{
            position: 'absolute',
            top: 25,
            left: 15,
            right: 15,
            // Kortet flytter ikke selv — slot-ekspansion håndterer
            // synligheden. -3 px lift bevares som depth-effekt.
            // Klik passerer videre til InventoryCard's Link, som
            // navigerer til /froebank/[id] med tilbageknap.
            transform: 'translateY(-3px)',
            filter: isExpanded
              ? [
                  'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
                  'drop-shadow(0 8px 20px rgba(0,0,0,0.08))',
                ].join(' ')
              : [
                  'drop-shadow(0 1px 2px rgba(0,0,0,0.05))',
                  'drop-shadow(0 6px 12px rgba(0,0,0,0.035))',
                ].join(' '),
            transition: 'filter 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <InventoryCard
            item={item}
            hideEyebrow={!isExpanded}
            nameScale={isExpanded ? 1 : 0.8}
          />
        </div>
      )}

      {/* Kontakt-skygge under hver mappe (bell-curve opacity).
          Sidder under folderen, så den kun rigtig kan ses på tomme
          mapper — for mapper med kort dækker kortet det område. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          top: FOLDER_HEIGHT - 2,
          height: 10,
          borderRadius: 999,
          background: `rgba(0,0,0,${shadowOpacity})`,
          filter: 'blur(8px)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </div>
  )
}

// Hvor meget en slot udvider sig når den er hovered/expanded.
// HOVER: ~50 % af kortet synligt (228 px) → slot-visible vokser fra
// 105 til 253 → delta 148.
// EXPANDED: hele kortet + dyrkningspanel + lidt padding synligt.
// Card body er ~ 460 px med 4:5 aspect; visible fra slot-y=25 → 485.
// Slot-visible vokser fra 105 → 500 → delta 395.
const HOVER_DELTA = 148
const EXPAND_DELTA = 395

// ── Main component ──────────────────────────────────────────────
export function InventoryArchiveStack({ inventory }: { inventory: InventoryItem[] }) {
  // Hover-state: hvilket stack-kort er aktuelt løftet ud af stakken?
  // null = ingen. På hover bliver hele kortet synligt med overlay;
  // klik navigerer til frø-detail-siden.
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)

  // Hvis ingen frø: vis kun den tomme mappestak (ingen hero).
  if (inventory.length === 0) {
    return (
      <div style={{ width: '100%' }} aria-label="Tomt frøbank-arkiv">
        <ArchiveContainer
          items={[]}
          hoveredSlot={null}
          onHover={() => {}}
          onLeave={() => {}}
        />
      </div>
    )
  }

  // Hero = altid det første frø. Stack = resten.
  const hero = inventory[0]
  const stackItems = inventory.slice(1)

  return (
    // YDRE arkiv-container omfatter BÅDE hero-kortet og folder-stakken.
    // Beige bg + border-radius giver ÉT sammenhængende arkivobjekt.
    <div
      style={{
        width: '100%',
        background: CONTAINER_BG,
        borderRadius: CONTAINER_RADIUS,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
        paddingTop: 24,
        paddingBottom: 0,
        overflow: 'hidden',
      }}
      aria-label="Frøbank arkiv"
    >
      {/* Hero-kort — det AKTIVE frø, fuldt synligt med overlay.
          Sidder centreret i arkiv-containeren. */}
      <div
        style={{
          maxWidth: CONTAINER_WIDTH,
          marginInline: 'auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <InventoryCard item={hero} />
      </div>

      {/* CTA-tekst mellem hero og stak — signalerer at man kan
          bladre i resten af frøbanken. Kun synlig hvis der ER
          stak-kort under hero. */}
      {stackItems.length > 0 && (
        <p
          aria-hidden
          style={{
            margin: 0,
            paddingTop: 18,
            paddingBottom: 14,
            textAlign: 'center',
            fontFamily: 'var(--font-manrope)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.52)',
          }}
        >
          Bladr i din frøbank
        </p>
      )}

      {/* Folder-cascade — knyttes sammen med hero-kortet via en lille
          margin-top så stakken starter lige under hero, men inde i
          den samme container. -26 px (≈ 7 mm) trækker hele stakken
          op tættere på CTA + hero. */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: -26 }}>
        <ArchiveContainer
          items={stackItems}
          hoveredSlot={hoveredSlot}
          onHover={(slotIdx) => setHoveredSlot(slotIdx)}
          onLeave={() => setHoveredSlot(null)}
        />
      </div>
    </div>
  )
}

function ArchiveContainer({
  items,
  hoveredSlot,
  onHover,
  onLeave,
}: {
  items: InventoryItem[]
  hoveredSlot: number | null
  onHover: (slotIdx: number) => void
  onLeave: () => void
}) {
  // Beregn ekstra y-offset for hver slot baseret på state af slots
  // FØR den i kaskaden. Hvis en tidligere slot er hovered (= fuld
  // udfoldelse), skubbes denne slot ned så plads frigives.
  const computeYOffset = (slotIdx: number) => {
    let offset = 0
    for (let i = 0; i < slotIdx; i++) {
      if (hoveredSlot === i) offset += EXPAND_DELTA
    }
    return offset
  }

  const getState = (slotIdx: number): SlotState =>
    hoveredSlot === slotIdx ? 'expanded' : 'default'

  // Container-højden vokser dynamisk så et hovered kort — selv det
  // nederste i stakken — er fuldt synligt uden at ende i mask-fade.
  const dynamicHeight =
    CONTAINER_HEIGHT + (hoveredSlot !== null ? EXPAND_DELTA + 100 : 0)
  return (
    // Inner cascade-wrapper — sidder INDE i den ydre arkiv-container
    // og leverer kun positionerings-kontekst for de absolutely-
    // positionerede mapper. Ingen egen bg/radius/skygge (de bæres af
    // den ydre container omkring både hero + cascade).
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: dynamicHeight,
        overflow: 'hidden',
        transition: 'height 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          // Mask solid-zone øget fra 70 % → 85 % så hovered/expanded
          // kort i bunden af stakken ikke ender i fade-area.
          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
        }}
      >
        {FOLDER_CONFIG.map((config, i) => {
          const item = items[i]
          return (
            <FolderLayer
              key={item ? item.id : `empty-${i}`}
              config={config}
              yOffset={computeYOffset(i)}
              item={item}
              state={item ? getState(i) : 'default'}
              onHover={item ? () => onHover(i) : undefined}
              onLeave={item ? onLeave : undefined}
              isTopFolder={i === 0}
            />
          )
        })}
      </div>
    </div>
  )
}
