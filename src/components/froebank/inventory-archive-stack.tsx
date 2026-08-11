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

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { InventoryCard } from './inventory-card'
import type { InventoryItem } from '@/lib/types'
import { FORVANDLINGER_ROUTE } from '@/lib/constants'

// ── Folder geometry — bredde matcher hero-frøkortet ─────────────
// Mapperne har samme bredde som InventoryCard (= 390 px ved max),
// så de visuelt aligner med hero-kortet og fylder containeren ens.
// Højden er vokset fra 111 → 135 px så stack-spacing (105 px) kan
// bevare overlap uden luft mellem mapperne.
const FOLDER_WIDTH = 372
const FOLDER_HEIGHT = 135
const CONTAINER_WIDTH = 390
const CONTAINER_HEIGHT = 1000

// Folder-shell dropskygge (filter på wrapper — clip-path klipper box-shadow):
// stak-mapper (let) + HeroFolder (lidt tydeligere). Inset-highlight på selve
// den clippede flade giver papirlags-følelse.
const FOLDER_DROP_SHADOW = [
  'drop-shadow(0 8px 16px rgba(64,58,42,0.10))',
  'drop-shadow(0 2px 4px rgba(64,58,42,0.05))',
].join(' ')
// HeroFolder-skygge (Anna, eksakt): blød, bred, papiragtig — ingen hård
// outline. Clip-path klipper box-shadow, så de to ydre lag bæres af
// wrapper-filteret og inset-highlightet af den clippede flade:
//   0 14px 26px rgba(64,58,42,0.14)  → drop-shadow
//   0 4px 10px rgba(64,58,42,0.08)   → drop-shadow
//   inset 0 1px 0 rgba(255,255,255,0.40) → boxShadow på clippet div
const HERO_DROP_SHADOW = [
  'drop-shadow(0 14px 26px rgba(64,58,42,0.14))',
  'drop-shadow(0 4px 10px rgba(64,58,42,0.08))',
].join(' ')
const FOLDER_SHELL_INSET = 'inset 0 1px 0 rgba(255,255,255,0.35)'
const HERO_SHELL_INSET = 'inset 0 1px 0 rgba(255,255,255,0.40)'

// Komponeret variation pr. folder-shell i stakken (Annas faste sekvens,
// cyklet over slots): tab-bredde/-start/-fald + tone + bredde varierer
// diskret for arkiv-rytme. Salat/HeroFolder har sine egne HERO_*-værdier.
const FOLDER_VARIANTS = [
  { tone: '#E7E9DD', width: 366, shoulderWidth: 76,  shoulderStart: 0.28, shoulderDrop: 16 }, // Tomat
  { tone: '#F1EBDD', width: 370, shoulderWidth: 108, shoulderStart: 0.22, shoulderDrop: 20 }, // Agurk
  { tone: '#DCE1D3', width: 364, shoulderWidth: 88,  shoulderStart: 0.36, shoulderDrop: 18 }, // Chili
  { tone: '#ECE4D6', width: 368, shoulderWidth: 114, shoulderStart: 0.24, shoulderDrop: 20 }, // Peberfrugt
  { tone: '#E3E1CE', width: 362, shoulderWidth: 82,  shoulderStart: 0.32, shoulderDrop: 16 }, // Squash
] as const

// Folder-silhuet med en POSITIONERET tab: folderens top ligger på lav-niveau
// (y=shoulderDrop), og en hævet tab (shoulderWidth bred, startende ved
// shoulderStartFrac × W) rejser sig til y0 via bløde S-kurver. Bunden
// forlænges til H (skjult bag kortet). Parametrene gør, at hver mappe i
// stakken kan variere i tab-bredde, tab-placering og tab-fald → arkiv-rytme.
function buildFolderPath(
  W: number,
  H: number,
  shoulderWidth: number,
  shoulderStartFrac: number,
  shoulderDrop: number,
): string {
  const LI = 14 // venstre inset
  const RI = 16 // højre inset
  const CR = 14 // hjørne-radius
  const RISE = 14 // tab-fald/-stigning vandret span
  const DROP = shoulderDrop // lav top ligger DROP under tab-toppen (y0)
  const tabStart = shoulderStartFrac * W
  const tabEnd = tabStart + shoulderWidth
  const BOTTOM = H - 4
  return `
    M ${LI} ${BOTTOM}
    L ${LI} ${DROP + CR}
    Q ${LI} ${DROP} ${LI + CR} ${DROP}
    L ${tabStart - RISE} ${DROP}
    C ${tabStart - RISE + 5} ${DROP} ${tabStart - 5} 0 ${tabStart} 0
    L ${tabEnd} 0
    C ${tabEnd + 5} 0 ${tabEnd + RISE - 5} ${DROP} ${tabEnd + RISE} ${DROP}
    L ${W - RI - CR} ${DROP}
    Q ${W - RI} ${DROP} ${W - RI} ${DROP + CR}
    L ${W - RI} ${BOTTOM}
    Q ${W - RI} ${H} ${W - RI - 4} ${H}
    L ${LI + 4} ${H}
    Q ${LI} ${H} ${LI} ${BOTTOM}
    Z
  `.replace(/\s+/g, ' ').trim()
}

// Folder-lag konfiguration — 12 slots, 105 px spacing, bell-curve shadows.
// Spacing øget fra 81 → 105 så hver mappes synlige strimmel rummer
// både navn OG variety/sort. Folder-højde 135 sikrer 30 px overlap.
// ALLE mapper: SAMME bredde, form, skulder-højde og dropskygge (= creme-mappen).
// De varierer KUN i:
//  - shoulderW: skulderbredden (px). Relativ mm-sekvens (Anna): #2 −8mm, #3 +3mm
//    ift. #2, #4 −10mm ift. #3, osv. → komponeret bølge, base ~165px (=creme-skulder).
//  - xOffset:  let vandret forskydning (1-2mm ≈ 4-8px), varierende nedad — så de
//    ikke aligner helt perfekt.
// Tonen sættes per frø (plantColor.tint), ikke her.
const FOLDER_CONFIG = [
  { y: 28,   zIndex: 1,  shadowOpacity: 0.014, xOffset:  0, shoulderW: 165 },
  { y: 133,  zIndex: 2,  shadowOpacity: 0.018, xOffset:  6, shoulderW: 135 },
  { y: 238,  zIndex: 3,  shadowOpacity: 0.022, xOffset: -4, shoulderW: 146 },
  { y: 343,  zIndex: 4,  shadowOpacity: 0.028, xOffset:  5, shoulderW: 108 },
  { y: 448,  zIndex: 5,  shadowOpacity: 0.032, xOffset: -7, shoulderW: 135 },
  { y: 553,  zIndex: 6,  shadowOpacity: 0.028, xOffset:  4, shoulderW: 120 },
  { y: 658,  zIndex: 7,  shadowOpacity: 0.018, xOffset: -5, shoulderW: 154 },
  { y: 763,  zIndex: 8,  shadowOpacity: 0.014, xOffset:  8, shoulderW: 131 },
  { y: 868,  zIndex: 9,  shadowOpacity: 0.012, xOffset: -3, shoulderW: 139 },
  { y: 973,  zIndex: 10, shadowOpacity: 0.010, xOffset:  6, shoulderW: 108 },
  { y: 1078, zIndex: 11, shadowOpacity: 0.008, xOffset: -6, shoulderW: 127 },
  { y: 1183, zIndex: 12, shadowOpacity: 0.006, xOffset:  5, shoulderW: 116 },
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
  variant,
  yOffset,
  item,
  state,
  onHover,
  onLeave,
}: {
  config: (typeof FOLDER_CONFIG)[number]
  variant: (typeof FOLDER_VARIANTS)[number]
  yOffset: number
  item?: InventoryItem
  state: SlotState
  onHover?: () => void
  onLeave?: () => void
}) {
  const { y, zIndex, shadowOpacity, xOffset } = config
  const { tone, width, shoulderWidth, shoulderStart, shoulderDrop } = variant
  const isHovered = state === 'hovered'
  const isExpanded = state === 'expanded'

  // Folder-højden vokser med kortets synlige længde.
  const currentHeight = isExpanded
    ? FOLDER_HEIGHT + EXPAND_DELTA
    : isHovered
      ? FOLDER_HEIGHT + HOVER_DELTA
      : FOLDER_HEIGHT
  const currentClip = `path('${buildFolderPath(width, currentHeight, shoulderWidth, shoulderStart, shoulderDrop)}')`

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
        marginLeft: -width / 2 + xOffset,
        width: width,
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
          width: width,
          height: currentHeight,
          filter: FOLDER_DROP_SHADOW,
          transition: 'height 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: tone,
            clipPath: currentClip,
            WebkitClipPath: currentClip,
            boxShadow: FOLDER_SHELL_INSET,
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
            left: 18,
            right: 20,
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

// ── HeroFolder — FolderItem 1: Salat hero-kort i sin EGEN creme
// folder-shell. Folderen er containeren; kortet ligger indeni (inset
// i siderne, top under skulderen, bundflade nedenunder). Ingen løs
// creme-forlængelse — mappen ejer sit kort. */
// Salat/HeroFolder bevarer den OPRINDELIGE creme-overgangsmappes form/path
// (samme koordinater som panelets gamle creme-mappe), kun forlænget i højden
// så den kan rumme Salat-kortet. Cascaden bruger derimod den positionerede
// tab (buildFolderPath). shape-bredden ≈ grøn hovedmappe (creme-pathens ~4%
// inset gør, at SVG-bredden skal være lidt større end den synlige form).
// Bund-hjørnernes radius (Anna: HeroFolder shell ≈ 30px — tydeligt blødere
// end Salat-kortets 24px). Skulderformen (top) er LÅST og uændret; kun de to
// nederste hjørner rundes, så cremebunden læses som mappens bløde kant.
const HERO_BOTTOM_RADIUS = 30
function buildHeroFolderPath(W: number, H: number): string {
  const k = W / 1846
  const y = (v: number) => (v - 84) * k
  const LI = 78 * k
  const rEdge = 1758 * k
  const CR = HERO_BOTTOM_RADIUS
  return `
    M ${LI} ${H - CR}
    L ${LI} ${y(150)}
    C ${LI} ${y(112)} ${108 * k} 0 ${148 * k} 0
    L ${984 * k} 0
    C ${1006 * k} 0 ${1022 * k} ${y(94)} ${1032 * k} ${y(112)}
    L ${1044 * k} ${y(134)}
    C ${1052 * k} ${y(148)} ${1068 * k} ${y(154)} ${1088 * k} ${y(154)}
    L ${1698 * k} ${y(154)}
    C ${1732 * k} ${y(154)} ${rEdge} ${y(180)} ${rEdge} ${y(214)}
    L ${rEdge} ${H - CR}
    Q ${rEdge} ${H} ${rEdge - CR} ${H}
    L ${LI + CR} ${H}
    Q ${LI} ${H} ${LI} ${H - CR}
    Z
  `.replace(/\s+/g, ' ').trim()
}

const HERO_FOLDER_WIDTH = 404 // SVG-bredde; creme-formens inset → synlig form ≈ grøn hovedmappe (~368, ~1mm smallere)
const HERO_CARD_INSET_L = 33 // kort-inset venstre (creme-form-inset ~17 + ~16 margin)
const HERO_CARD_INSET_R = 35 // kort-inset højre
const HERO_CARD_TOP = 24 // kortets top 22-26px under skulderens top
const HERO_BOTTOM_PAPER = 36 // synlig creme-bundflade under kortet — plads til ~27px
                             // synlig creme + Tomats lille 9px overlap
const HERO_FOLDER_TONE = '#EFE7D8' // Salat-folderens creme-tone

function HeroFolder({ item }: { item: InventoryItem }) {
  const cardW = HERO_FOLDER_WIDTH - HERO_CARD_INSET_L - HERO_CARD_INSET_R
  const cardH = cardW * 1.25 // InventoryCard er aspect-[4/5]
  const H = HERO_CARD_TOP + cardH + HERO_BOTTOM_PAPER
  const clip = `path('${buildHeroFolderPath(HERO_FOLDER_WIDTH, H)}')`
  return (
    <div
      style={{
        position: 'relative',
        width: HERO_FOLDER_WIDTH,
        height: H,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1,
      }}
    >
      {/* Creme folder-shell (container) — original creme-form + dropskygge */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, filter: HERO_DROP_SHADOW }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: HERO_FOLDER_TONE,
            clipPath: clip,
            WebkitClipPath: clip,
            boxShadow: HERO_SHELL_INSET,
          }}
        />
      </div>
      {/* Salat-kortet INDE i folderen — strammere hjørner end mappen (24<30)
          + tæt, kontrolleret skygge så kortet HVILER i cremen, ikke svæver.
          Værdierne er hero-only overstyringer; alle andre frøkort uændrede. */}
      <div style={{ position: 'absolute', top: HERO_CARD_TOP, left: HERO_CARD_INSET_L, right: HERO_CARD_INSET_R }}>
        <InventoryCard
          item={item}
          cardRadius={24}
          cardShadow="0 8px 18px rgba(55,48,34,0.12), 0 2px 6px rgba(55,48,34,0.06), inset 0 1px 0 rgba(255,255,255,0.10)"
          infoPanelRadiusTop={22}
          infoPanelRadiusBottom={24}
          infoPanelShadow="0 1px 2px rgba(60,54,40,0.04), inset 0 1px 0 rgba(255,255,255,0.42)"
        />
      </div>
    </div>
  )
}

// ── Folder-shells UNDER HeroFolder ──────────────────────────────
// Hver mappe ejer sit kort (som HeroFolder): kortet ligger INDE i
// shellen med 12px sider, 18px top under skulderens højeste punkt og
// 18px synlig bundflade. Mapperne overlapper roligt med 24px.
// ALLE shells deler SAMME skulder-path (buildStackFolderPath) — kun
// mappebredde, papirfarve, skulderbredde og skulderens vandrette
// center varierer (Annas faste sekvens, cyklet). Skulderens
// fald/stigning, hjørneradius og geometri er IDENTISK på tværs af
// hele stakken.
const STACK_CARD_INSET_X = 12 // synlig folder-side venstre/højre
const STACK_CARD_TOP_COLLAPSED = 24 // kort-top under skulderens højeste punkt (collapsed)
const STACK_CARD_TOP_EXPANDED = 28 // kort-top under skulderens højeste punkt (expanded)
const STACK_BOTTOM_PAPER = 34 // synlig folder-bund under kortet (expanded)
const STACK_COLLAPSED_OVERLAP = 18 // collapsed: næste folder dækker forriges åbne bund
const STACK_EXPANDED_OVERLAP = 10 // expanded: næste folder kun 10px ind → åbent kort får luft
const STACK_FOLDER_EXTRA_H = 113 // ca. 3 CSS-cm ekstra mappe, skjult bag næste lag
const STACK_COLLAPSED_H = 150 + STACK_FOLDER_EXTRA_H // collapsed mappe-højde — ekstra bund gemmes bag næste mappe
const STACK_WIDTH_INSET = 22 // ALLE mapper: bredde = container − 22px (næsten ens)
const STACK_ANIM = '260ms cubic-bezier(0.22, 1, 0.36, 1)'

// Folder-shell skygge (Anna, eksakt) — papirlag, ikke svævende card.
// Clip-path klipper box-shadow, så de to ydre lag bæres af wrapper-
// filteret og inset-highlightet af den clippede flade:
//   0 9px 18px rgba(64,58,42,0.10) · 0 3px 7px rgba(64,58,42,0.05)
//   inset 0 1px 0 rgba(255,255,255,0.34)
// Collapsed folder-shell: lidt tydeligere kontakt-skygge mod baggrunden, så
// mapperne ikke flyder ud i siderne.
const STACK_DROP_SHADOW = [
  'drop-shadow(0 10px 20px rgba(64,58,42,0.11))',
  'drop-shadow(0 3px 8px rgba(64,58,42,0.05))',
].join(' ')
// Hver tredje mappe (Chili, Squash, …) en anelse stærkere for diskret rytme.
const STACK_DROP_SHADOW_STRONG = [
  'drop-shadow(0 12px 22px rgba(64,58,42,0.12))',
  'drop-shadow(0 3px 8px rgba(64,58,42,0.06))',
].join(' ')
const STACK_PAGE_BG = 'var(--background)'
// Hvid top-highlight + ultratynd kant-stroke hele vejen rundt (inset) → taktil
// papir-kant, IKKE en hård digital outline. Giver siderne definition.
const STACK_SHELL_INSET =
  'inset 0 1px 0 rgba(255,255,255,0.34), inset 0 0 0 1px rgba(112,104,84,0.06)'
// Expanded mappe — tydeligere løft fra stakken (Anna, eksakt).
const STACK_DROP_SHADOW_EXPANDED = [
  'drop-shadow(0 16px 30px rgba(64,58,42,0.15))',
  'drop-shadow(0 5px 10px rgba(64,58,42,0.08))',
].join(' ')
const STACK_SHELL_INSET_EXPANDED = 'inset 0 1px 0 rgba(255,255,255,0.36)'
// Expanded frøkort — hviler i mappen med en kontrolleret skygge.
const STACK_EXPANDED_CARD_SHADOW =
  '0 10px 22px rgba(55,48,34,0.12), 0 3px 8px rgba(55,48,34,0.06), inset 0 1px 0 rgba(255,255,255,0.10)'
// Collapsed frøkort — dæmpet skygge, så folder-shellens kant er MERE læselig
// end kortets bund/kanter (kort = sekundært i collapsed state).
const STACK_COLLAPSED_CARD_SHADOW = '0 2px 6px rgba(55,48,34,0.10)'

// Faste skulder-konstanter — IDENTISK form for alle mapper.
const STACK_CORNER = 28 // border-radius på shell
const STACK_SHOULDER_DROP = 14 // konstant skulderfald (lav top under tab-top)
const STACK_SHOULDER_RISE = 16 // konstant vandret stigning på tab-siderne

// Annas faste sekvens for de første 7 mapper under HeroFolder. ALLE har
// samme bredde (container − STACK_WIDTH_INSET); variation i skulderbredde +
// skulderplacering + en lille xOffset (0–2px).
// FARVE: hver mappe er en creme/beige arkivmappe FØRST, med kun en meget
// diskret tint i kortets temperatur-retning (varm rosé for røde/orange kort,
// grønlig for grønne, gul-salvie for oliven). Aldrig en fast grøn/rød-
// rækkefølge; kortet er altid det mest mættede element, mappen kun en tonet
// neutral. shoulderCenter = skulderens vandrette midte som andel af bredden.
const FOLDER_SHELLS = [
  { tone: '#F0E7DD', shoulderWidth: 108, shoulderCenter: 0.5, xOffset: 0 }, // Tomat — varm (rød) → svag rosé-creme
  { tone: '#E7E8DB', shoulderWidth: 84, shoulderCenter: 0.38, xOffset: -1 }, // Agurk — grøn → svag grønlig creme
  { tone: '#EFE4D8', shoulderWidth: 116, shoulderCenter: 0.5, xOffset: 1 }, // Chili — varm (orange) → svag rosé-creme
  { tone: '#EEE1D6', shoulderWidth: 92, shoulderCenter: 0.61, xOffset: 0 }, // Peberfrugt California Wonder — varm (rød) → svag rosé-creme
  { tone: '#F0E7DD', shoulderWidth: 104, shoulderCenter: 0.41, xOffset: -2 }, // Corno di Toro Rosso — varm (rød) → svag rosé-creme
  { tone: '#E8E4D4', shoulderWidth: 86, shoulderCenter: 0.58, xOffset: 1 }, // Squash — oliven/grøn → svag gul-salvie creme
  { tone: '#E6E8DC', shoulderWidth: 112, shoulderCenter: 0.5, xOffset: 0 }, // Stangbønne — grøn → svag grønlig creme
] as const

// Fælles skulder-path: lav top (y=DROP) med en hævet, afrundet tab
// (shoulderWidth bred, centreret ved shoulderCenter×W) der rejser sig
// til y0 via bløde S-kurver. STACK_CORNER runder alle fire hjørner ens.
// Kun shoulderWidth + shoulderCenter ændrer formen — alt andet er fast.
function buildStackFolderPath(
  W: number,
  H: number,
  shoulderWidth: number,
  shoulderCenterFrac: number,
  roundedBottom: boolean,
): string {
  const CR = STACK_CORNER // top-hjørner altid afrundede
  // Collapsed = ÅBEN/flad bund (BR=0) → mappen ser ud til at fortsætte ned
  // bag næste mappe (uendeligt arkiv-flow). Expanded = afrundet bund.
  // Samme kommando-struktur i begge → clip-path interpolerer blødt.
  const BR = roundedBottom ? STACK_CORNER : 0
  const DROP = STACK_SHOULDER_DROP
  const RISE = STACK_SHOULDER_RISE
  const tabStart = shoulderCenterFrac * W - shoulderWidth / 2
  const tabEnd = tabStart + shoulderWidth
  const BOTTOM = H - BR
  return `
    M 0 ${BOTTOM}
    L 0 ${DROP + CR}
    Q 0 ${DROP} ${CR} ${DROP}
    L ${tabStart - RISE} ${DROP}
    C ${tabStart - RISE + 6} ${DROP} ${tabStart - 6} 0 ${tabStart} 0
    L ${tabEnd} 0
    C ${tabEnd + 6} 0 ${tabEnd + RISE - 6} ${DROP} ${tabEnd + RISE} ${DROP}
    L ${W - CR} ${DROP}
    Q ${W} ${DROP} ${W} ${DROP + CR}
    L ${W} ${BOTTOM}
    Q ${W} ${H} ${W - BR} ${H}
    L ${BR} ${H}
    Q 0 ${H} 0 ${BOTTOM}
    Z
  `.replace(/\s+/g, ' ').trim()
}

// Mål container-bredden i px (clip-path bruger px-koordinater) så
// folder-bredder calc(100% - Npx) og kort-aspect kan beregnes responsivt.
function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function StackFolder({
  item,
  shell,
  width,
  height,
  top,
  z,
  isExpanded,
  strongShadow,
  onToggle,
}: {
  item: InventoryItem
  shell: (typeof FOLDER_SHELLS)[number]
  width: number
  height: number
  top: number
  z: number
  isExpanded: boolean
  strongShadow: boolean
  onToggle: () => void
}) {
  // Shellen klippes til mappe-formen med den AKTUELLE højde: collapsed
  // → kun top-preview (åben bund); expanded → fuld kort-højde (afrundet).
  // Samme skulder/center → clip-path interpolerer blødt mellem de to.
  const clip = `path('${buildStackFolderPath(width, height, shell.shoulderWidth, shell.shoulderCenter, isExpanded)}')`
  const contentId = `stack-folder-content-${item.id}`
  const label = `Vis ${item.name}${item.variety ? ` ${item.variety}` : ''} i fuld visning`
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-controls={contentId}
      aria-label={label}
      // Tap/click åbner/lukker mappen (ét kort ad gangen). Vi fanger i
      // CAPTURE-fasen, FØR kortets <Link> når sin egen onClick — ellers
      // ville Next-routeren navigere til detalje-siden. preventDefault +
      // stopPropagation dræber navigationen; kun toggle sker.
      onClickCapture={(e) => {
        // LÅST NAVIGATIONSREGEL: "Fold ud først. Åbn frøkort bagefter. Kun via knap."
        // - Kun "åbn frøkort"-CTA'en (data-open-detail) må navigere til detalje-siden.
        // - Klik på resten af kortet (collapsed ELLER expanded) toggler KUN — og
        //   dræber kortets eget <Link>, så hele kortet ALDRIG navigerer.
        if ((e.target as HTMLElement).closest('[data-open-detail]')) return
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      // Tastatur: Enter/Space toggler, Escape lukker et åbent kort.
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        } else if (e.key === 'Escape' && isExpanded) {
          e.preventDefault()
          onToggle()
        }
      }}
      style={{
        position: 'absolute',
        top,
        left: '50%',
        width,
        height,
        zIndex: z,
        // Næsten ens bredde; kun en anelse vandret forskydning (0–2px).
        transform: `translateX(calc(-50% + ${shell.xOffset}px)) translateY(${isExpanded ? -4 : 0}px)`,
        transition: `top ${STACK_ANIM}, height ${STACK_ANIM}, transform ${STACK_ANIM}`,
        cursor: 'pointer',
        overflow: 'visible',
      }}
    >
      {/* Folder-shell (clip-path) — wrapper bærer dropskyggen. Expanded =
          tydeligere løft; ellers hver tredje mappe en anelse stærkere. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          filter: isExpanded
            ? STACK_DROP_SHADOW_EXPANDED
            : strongShadow
              ? STACK_DROP_SHADOW_STRONG
              : STACK_DROP_SHADOW,
          transition: `filter ${STACK_ANIM}`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: shell.tone,
            clipPath: clip,
            WebkitClipPath: clip,
            boxShadow: isExpanded ? STACK_SHELL_INSET_EXPANDED : STACK_SHELL_INSET,
            transition: `clip-path ${STACK_ANIM}, box-shadow ${STACK_ANIM}`,
          }}
        />
      </div>
      {/* Kortet INDE i mappen — klippet til SAMME mappe-form, så collapsed
          kun viser top-preview. Eget filter-frit lag (backdrop-blur i
          kort-panelet virker korrekt). */}
      <div
        id={contentId}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          clipPath: clip,
          WebkitClipPath: clip,
          transition: `clip-path ${STACK_ANIM}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: isExpanded ? STACK_CARD_TOP_EXPANDED : STACK_CARD_TOP_COLLAPSED,
            left: STACK_CARD_INSET_X,
            right: STACK_CARD_INSET_X,
            transition: `top ${STACK_ANIM}`,
          }}
        >
          <InventoryCard
            item={item}
            hideEyebrow={!isExpanded}
            nameScale={isExpanded ? 1 : 0.8}
            cardShadow={isExpanded ? STACK_EXPANDED_CARD_SHADOW : STACK_COLLAPSED_CARD_SHADOW}
          />
        </div>
      </div>
      {/* "åbn frøkort" — den ENESTE vej til detalje-siden fra stakken.
          Vises KUN når mappen er åben (isExpanded); aldrig på tail-mapper
          (de er en separat komponent). Sekundær creme-pille over kortets rene
          bund. data-open-detail → folder-onClickCapture lader den navigere frit,
          mens resten af kortet kun folder ud/sammen. */}
      {isExpanded && (
        <Link
          href={`/froebank/${item.id}`}
          data-open-detail
          // Synlig label er bevidst kort ("åbn frøkort"); aria/title bærer konteksten.
          aria-label={`Åbn frøkort for ${item.name}${item.variety ? ` ${item.variety}` : ''}`}
          title={`Åbn frøkort for ${item.name}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            // Hviler ~15px over kortets info-panel (≈144px højt, top ≈178px over
            // mappebund) → på billedets nederste kant, dækker ingen data og er
            // ikke klemt. Alle stak-kort har samme højde, så værdien holder.
            position: 'absolute',
            bottom: 193,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            height: 32,
            paddingInline: 15,
            borderRadius: 999,
            background: 'rgba(247,242,230,0.93)',
            border: '1px solid rgba(117,101,62,0.22)',
            boxShadow: '0 4px 11px rgba(40,52,26,0.13)',
            color: '#3F5A2A',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          åbn frøkort
          <ArrowRight style={{ width: 14, height: 14, strokeWidth: 2 }} />
        </Link>
      )}
    </div>
  )
}

// Trailing tomme mapper — stakken fortsætter nedad og opløses gradvist.
// Ingen kort, tekst, badge eller interaktion; kun visuel hale. Alle har
// åben bund (fortsætter), så halen aldrig læses som en lukket afslutning.
const TAIL_VISIBLE_H = 193 // 80px + ca. 3 CSS-cm, så tail-mapperne går længere ned bag hinanden
const TAIL_FIRST_OVERLAP = 44
const TAIL_OVERLAP = 12
const TAIL_SECOND_LIFT = 76 // ca. 2 CSS-cm op
const TAIL_THIRD_LIFT = 57 // ca. 1,5 CSS-cm op
const TAIL_FOURTH_DROP_FROM_THIRD = 113 // ca. 3 CSS-cm ned fra tail-3's topkant
// Tomme mapper har INTET kort at reagere på → ren neutral creme (ingen tint).
const TAIL_FOLDERS = [
  { tone: '#EEE8DA', shoulderWidth: 108, shoulderCenter: 0.5, marginTop: 0, rounded: false }, // tail-1
  { tone: '#ECE6D8', shoulderWidth: 84, shoulderCenter: 0.38, marginTop: -(TAIL_OVERLAP + TAIL_SECOND_LIFT), rounded: false }, // tail-2
  { tone: '#F1EBDE', shoulderWidth: 86, shoulderCenter: 0.58, marginTop: -(TAIL_OVERLAP + TAIL_THIRD_LIFT), rounded: false }, // tail-3
  { tone: '#ECE6D8', shoulderWidth: 84, shoulderCenter: 0.38, marginTop: -(TAIL_VISIBLE_H - TAIL_FOURTH_DROP_FROM_THIRD), rounded: false, topContactShadow: true, bottomBlend: true }, // tail-4
] as const
// Hale-stakkens flow-højde (overlap medregnet) + 8px ekstra under sidste tail.
const TAIL_STACK_HEIGHT =
  TAIL_VISIBLE_H + 2 * (TAIL_VISIBLE_H - TAIL_OVERLAP) - TAIL_SECOND_LIFT - TAIL_THIRD_LIFT + TAIL_FOURTH_DROP_FROM_THIRD + 8 // = 543
const STACK_BOTTOM_PADDING = 120 // luft før bottom nav

function TailFolder({
  tail,
  width,
  z,
  last,
}: {
  tail: (typeof TAIL_FOLDERS)[number]
  width: number
  z: number
  last: boolean
}) {
  const clip = `path('${buildStackFolderPath(width, TAIL_VISIBLE_H, tail.shoulderWidth, tail.shoulderCenter, tail.rounded)}')`
  const isBlendTail = 'bottomBlend' in tail && tail.bottomBlend
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: tail.marginTop,
        marginBottom: last ? 8 : 0,
        height: TAIL_VISIBLE_H,
        zIndex: z,
        // Blend-tail (tail-4) bærer skyggen på SELVE folder-shellen (kun opad,
        // så bunden er skyggefri og kan blendes rent væk). De øvrige tails har
        // den almindelige dropskygge på wrapperen.
        filter: isBlendTail ? undefined : STACK_DROP_SHADOW,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: tail.tone,
          clipPath: clip,
          WebkitClipPath: clip,
          boxShadow: STACK_SHELL_INSET,
          // tail-4 bærer SAMME dropskygge som de øvrige mapper (følger clip-
          // formen langs hele overkanten, ikke kun skulderen); blend-overlayet
          // ovenpå dækker den nedre del, så bunden forbliver ren.
          filter: isBlendTail ? STACK_DROP_SHADOW : undefined,
        }}
      />
      {isBlendTail && (
        // OVERLAY — IKKE clippet, INGEN transparens på selve mappen. En
        // baggrunds-farvet gradient lagt OVEN PÅ tail-4's nederste ~60%:
        // transparent foroven (mappen ses uændret) → solid var(--background)
        // forneden. Det strækker sig forbi sider og bund, så mappens underkant
        // dækkes helt og smelter sammen med sidens baggrund — uden clip-kant.
        <div
          style={{
            position: 'absolute',
            left: -10,
            right: -10,
            top: 66,
            bottom: -16,
            background: `linear-gradient(to bottom, rgba(246,240,223,0) 0%, rgba(246,240,223,0) 24%, ${STACK_PAGE_BG} 70%, ${STACK_PAGE_BG} 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

// Lodret stak af kort-bærende folder-shells. DEFAULT: alle collapsed
// (kun top-preview, 156px, overlap 18px, ÅBEN bund → fortsættende arkiv).
// Tap/click åbner ÉT kort i fuld højde (afrundet bund); nyt klik kollapser
// det forrige. Ghost-mapper + fade nederst. Ingen hover-expansion.
function StackCascade({ items }: { items: InventoryItem[] }) {
  const [ref, cw] = useContainerWidth()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Tap udenfor stakken folder det åbne kort sammen igen (native-mønster).
  // Klik PÅ en mappe (role=button[aria-expanded]) håndteres af mappens egen
  // onClickCapture (toggle/navigér); kun klik HELT udenfor lukker her.
  // Effekten tilføjes async (efter render), så det klik der åbnede kortet
  // ikke selv lukker det igen.
  useEffect(() => {
    if (!expandedId) return
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[role="button"][aria-expanded]')) {
        setExpandedId(null)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [expandedId])

  let cumTop = 0
  const folders = items.map((item, i) => {
    const shell = FOLDER_SHELLS[i % FOLDER_SHELLS.length]
    const width = Math.max(0, cw - STACK_WIDTH_INSET)
    const cardW = width - 2 * STACK_CARD_INSET_X
    const cardH = cardW * 1.25 // InventoryCard er aspect-[4/5]
    const fullH = STACK_CARD_TOP_EXPANDED + cardH + STACK_BOTTOM_PAPER
    const isExpanded = expandedId === item.id
    const height = isExpanded ? fullH : STACK_COLLAPSED_H
    const top = cumTop
    // Et EXPANDED kort får mere luft før næste folder (kun 10px overlap).
    const overlap = isExpanded ? STACK_EXPANDED_OVERLAP : STACK_COLLAPSED_OVERLAP + STACK_FOLDER_EXTRA_H
    cumTop = top + height - overlap
    // Hver tredje mappe (Chili = i2, Squash = i5, …) får stærkere skygge.
    const strongShadow = i % 3 === 2
    return { item, shell, width, height, top, isExpanded, strongShadow, z: isExpanded ? 30 : i + 10 }
  })
  const last = folders[folders.length - 1]
  const hasFolders = folders.length > 0
  const realBottom = last ? last.top + last.height : 0
  const tailBaseZ = last ? last.z + 1 : 10
  // Hale-stakken overlapper sidste rigtige mappes bund som en normal næste
  // mappe → sidste rigtige mappe læses ikke som afslutning.
  const tailTop = realBottom - TAIL_FIRST_OVERLAP - STACK_FOLDER_EXTRA_H
  const totalH = !cw
    ? 0
    : hasFolders
      ? tailTop + TAIL_STACK_HEIGHT + STACK_BOTTOM_PADDING
      : realBottom

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: '100%',
        height: totalH,
        overflow: 'visible',
        transition: `height ${STACK_ANIM}`,
      }}
    >
      {cw > 0 &&
        folders.map((f) => (
          <StackFolder
            key={f.item.id}
            item={f.item}
            shell={f.shell}
            width={f.width}
            height={f.height}
            top={f.top}
            z={f.z}
            isExpanded={f.isExpanded}
            strongShadow={f.strongShadow}
            onToggle={() =>
              setExpandedId((prev) => (prev === f.item.id ? null : f.item.id))
            }
          />
        ))}

      {/* Trailing tomme mapper — arkivet fortsætter og opløses nedad. */}
      {cw > 0 && hasFolders && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: tailTop,
            left: 0,
            right: 0,
            height: TAIL_STACK_HEIGHT,
            overflow: 'visible',
            pointerEvents: 'none',
            transition: `top ${STACK_ANIM}`,
          }}
        >
          {TAIL_FOLDERS.map((t, i) => (
            <TailFolder
              key={i}
              tail={t}
              width={Math.max(0, cw - STACK_WIDTH_INSET)}
              z={tailBaseZ + i}
              last={i === TAIL_FOLDERS.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Tom frøbank → tre naturlige veje ind (Annas adaptive onboarding, SPEC 3).
 * Gevinst før funktion; positiv formulering (aldrig "Jeg ved ikke…").
 * Kun ved ÆGTE tom bank — aldrig ved søge-/filter-miss.
 */
function TomBankTreVeje() {
  const veje = [
    { titel: 'Jeg har frøposer', tekst: 'Scan, tag billede eller opret manuelt.', href: '/froebank/tilfoej' },
    { titel: 'Hvad kan haven blive til?', tekst: 'Find idéer til det, du drømmer om at lave.', href: FORVANDLINGER_ROUTE },
    { titel: 'Jeg vil gemme idéer', tekst: 'Gem sorter, du overvejer, på ønskelisten.', href: '/froebank?kategori=indkoebsliste' },
  ]
  return (
    <div className="px-1.5 pb-5 space-y-2">
      <p className="text-sm text-muted-foreground" style={{ maxWidth: '36ch' }}>
        Potalot lærer din have at kende. Når du tilføjer frø og planter, kan vi
        vise råd, opgaver og idéer, der passer til netop det, du dyrker.
      </p>
      {veje.map(v => (
        <Link
          key={v.href}
          href={v.href}
          className="no-underline flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/50 transition-colors"
        >
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-foreground">{v.titel}</span>
            <span className="block text-xs text-muted-foreground">{v.tekst}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      ))}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────
export function InventoryArchiveStack({
  inventory,
  erTomBank,
}: {
  inventory: InventoryItem[]
  /** Hele banken er tom (ikke bare et filter/en søgning uden match). */
  erTomBank?: boolean
}) {
  // Ingen frø at vise: skeln ÆGTE tom bank (→ tre veje ind, adaptive
  // onboarding) fra et filter/en søgning uden match (håndteres af kalderen).
  if (inventory.length === 0) {
    return (
      <div style={{ width: '100%' }} aria-label="Tomt frøbank-arkiv">
        {erTomBank && <TomBankTreVeje />}
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
    <div
      style={{
        width: '100%',
        paddingTop: 24,
        paddingBottom: 0,
        overflow: 'visible',
      }}
      aria-label="Frøbank-arkiv"
    >
      {/* FolderItem 1 — Salat hero-kort i sin EGEN creme folder-shell. */}
      <HeroFolder item={hero} />

      {/* Folder-cascade — Tomat, Agurk, … hver i sin egen kort-bærende
          folder-shell. Salat er den ÅBNE introduktionsmappe (afrundet bund);
          Tomat overlapper kun dens cremebund ~9px, så der står ~27px synlig
          creme under Salat-kortet → "åben intro → collapsed arkivstak". */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: -9 }}>
        <StackCascade items={stackItems} />
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
              variant={FOLDER_VARIANTS[i % FOLDER_VARIANTS.length]}
              yOffset={computeYOffset(i)}
              item={item}
              state={item ? getState(i) : 'default'}
              onHover={item ? () => onHover(i) : undefined}
              onLeave={item ? onLeave : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
