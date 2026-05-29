'use client'

/**
 * "EmptyFolderStack" — premium arkiv-papir stak.
 *
 * Genereret af v0.dev efter reference-billede + spec, integreret i
 * Potalot. Beholder v0's eksakte SVG-geometri, dimensioner og lag-
 * konfiguration. Wrapped i et responsivt centrerings-layer så den
 * sidder pænt på alle skærmstørrelser uden at overflow.
 *
 * 7 hvide papirmapper med subtil top-venstre skulder-notch, stakket
 * i en warm beige container (#F7F6F1). Bagerste mappe har lavest
 * z-index / opacity; forreste mappe er fuldt synlig.
 *
 * Designet er låst — sig til hvis du vil iterere videre i v0 og
 * sende en ny version.
 */

import React from 'react'

// ── Folder geometry (fra v0) ────────────────────────────────────
const FOLDER_WIDTH = 342
const FOLDER_HEIGHT = 111 // 101 body + 10 shoulder (vokset 19 px ≈ 5 mm nedad)

// ── Container dimensioner ──────────────────────────────────────
const CONTAINER_WIDTH = 390
const CONTAINER_HEIGHT = 510
const CONTAINER_BG = 'rgba(243,242,237,0.72)'
const CONTAINER_RADIUS = 38

/**
 * SVG-path for mappe-silhuetten (1:1 fra v0).
 *
 * Geometri:
 *   - Skulder-notch på top-venstre: 0→110 px, 10 px elevation
 *   - 16 px corner-radius på alle 4 hjørner
 *   - 342 × 92 viewBox
 */
function generateFolderPath(): string {
  // Notch bredde udvidet med ~30 px (≈ 8 mm @ 96 dpi):
  // skulder-toppen forlænget fra x=80 til x=110, descent-kurven
  // skubbet fra x=110 til x=140.
  //
  // Bunden vokset 19 px nedad (≈ 5 mm) og har en GANSKE GANSKE blød
  // afrunding + bow:
  //   • 4 px corner-radius på bottom-left og bottom-right (knap synligt)
  //   • 2 px sag i midten af bundkanten (control y=113) så bunden buer
  //     blødt mod den foranliggende mappe i stedet for at klippe hårdt
  return `
    M 0 26
    Q 0 0 16 0
    L 110 0
    Q 130 0 140 10
    L 326 10
    Q 342 10 342 26
    L 342 107
    Q 342 111 338 111
    Q 171 113 4 111
    Q 0 111 0 107
    Z
  `.replace(/\s+/g, ' ').trim()
}

/**
 * Folder lag-konfiguration. Bagerste mappe øverst (lowest zIndex),
 * forreste mappe nederst (highest zIndex). 54 px lodret slip mellem
 * mapperne så hver skulder-notch peeker frem.
 *
 * shadowOpacity følger en bell-curve: stærkest i midten (Lag 3),
 * blødere i begge ender — så stakken visuelt "trykkes sammen" på
 * midten og fader ud i for- og bagende.
 *   Lag 1 (front):     0.018
 *   Lag 2:             0.028
 *   Lag 3 (peak):      0.032
 *   Lag 4:             0.028
 *   Lag 5:             0.022
 *   Lag 6:             0.018 (fortsætter descent)
 *   Lag 7 (back):      0.014
 */
const FOLDER_CONFIG = [
  // xOffset: 1-2 px forskel mellem mapperne bryder den perfekte
  // SVG-stak og giver papir-stak-følelse (som om mapperne er stablet
  // i hånden). Holdes inden for ±1 px så variationen er en antydning,
  // ikke en åbenlys forskudt stack.
  //
  // Spacing: 81 px mellem hver mappe (= 54 + 27 ≈ 7 mm bredere end før).
  { y: 28,  zIndex: 1,  opacity: 0.935, shadowOpacity: 0.014, xOffset:  0 }, // bagerste
  { y: 109, zIndex: 2,  opacity: 0.945, shadowOpacity: 0.018, xOffset:  1 },
  { y: 190, zIndex: 3,  opacity: 0.955, shadowOpacity: 0.022, xOffset: -1 },
  { y: 271, zIndex: 4,  opacity: 0.965, shadowOpacity: 0.028, xOffset:  1 },
  { y: 352, zIndex: 5,  opacity: 0.975, shadowOpacity: 0.032, xOffset:  0 }, // peak
  { y: 433, zIndex: 6,  opacity: 0.985, shadowOpacity: 0.028, xOffset: -1 },
  { y: 514, zIndex: 7,  opacity: 1,     shadowOpacity: 0.018, xOffset:  0 },
  // Yderligere mapper der fortsætter ud over containerens bund.
  // Mask-gradienten fader disse blødt ud — stakken føles uendelig.
  { y: 595, zIndex: 8,  opacity: 1,     shadowOpacity: 0.014, xOffset:  1 },
  { y: 676, zIndex: 9,  opacity: 1,     shadowOpacity: 0.012, xOffset: -1 },
  { y: 757, zIndex: 10, opacity: 1,     shadowOpacity: 0.010, xOffset:  0 },
  { y: 838, zIndex: 11, opacity: 1,     shadowOpacity: 0.008, xOffset:  1 },
  { y: 919, zIndex: 12, opacity: 1,     shadowOpacity: 0.006, xOffset: -1 }, // forreste, fader helt ud
]

function FolderLayer({
  y,
  zIndex,
  opacity,
  shadowOpacity,
  xOffset,
}: {
  y: number
  zIndex: number
  opacity: number
  shadowOpacity: number
  xOffset: number
}) {
  const folderPath = generateFolderPath()

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        // Centrér mappe i container, plus 1-2 px lateral jitter per lag
        // så stakken føles håndstablet — ikke perfekt SVG-aligned.
        left: (CONTAINER_WIDTH - FOLDER_WIDTH) / 2 + xOffset,
        width: FOLDER_WIDTH,
        zIndex,
        opacity,
      }}
    >
      <svg
        viewBox={`0 0 ${FOLDER_WIDTH} ${FOLDER_HEIGHT}`}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          filter: [
            'drop-shadow(0 1px 1px rgba(0,0,0,0.018))',
            'drop-shadow(0 3px 8px rgba(32,28,18,0.032))',
            'drop-shadow(0 10px 24px rgba(32,28,18,0.022))',
          ].join(' '),
        }}
      >
        <path d={folderPath} fill="#FCFCFA" />
      </svg>

      {/* Kontakt-skygge — blød horisontal smudge der antyder at mappen
          hviler på det nedenunder. 18 px inset så den er smallere end
          mappen og falder af på siderne. Opacity varierer per lag for
          en bell-curve effekt der trykker midten af stakken sammen. */}
      <div
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: -2,
          height: 10,
          borderRadius: 999,
          background: `rgba(0,0,0,${shadowOpacity})`,
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export function EmptyFolderStack() {
  return (
    // Responsivt centrerings-lag: på skærme < 390 px skaler ned så
    // hele 390×510-designet stadig sidder centreret uden overflow.
    <div
      aria-hidden
      style={{
        width: '100%',
        maxWidth: CONTAINER_WIDTH,
        marginInline: 'auto',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: CONTAINER_WIDTH,
          height: CONTAINER_HEIGHT,
          maxWidth: '100%',
          backgroundColor: CONTAINER_BG,
          borderRadius: CONTAINER_RADIUS,
          overflow: 'hidden',
          // marginInline auto på inderste også, hvis container
          // skaleres ned af en parent-constraint
          marginInline: 'auto',
        }}
      >
        {/* Inner stack-wrapper med gradient mask — fader de nederste
            mapper blødt ud så stakken føles uendelig (ikke hård cutoff
            ved containerens bund). Mask gælder kun mapperne, ikke
            containerens baggrund. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
          }}
        >
          {FOLDER_CONFIG.map((config, index) => (
            <FolderLayer
              key={index}
              y={config.y}
              zIndex={config.zIndex}
              opacity={config.opacity}
              shadowOpacity={config.shadowOpacity}
              xOffset={config.xOffset}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
