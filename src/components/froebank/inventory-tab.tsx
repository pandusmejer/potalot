'use client'

/**
 * "InventoryTab" — arkivmappe i stilen af klassiske manilamapper i et
 * kartotek (1:1 efter spec i `Specs og design manila-mapper frøbank.png`).
 *
 * Form:
 *   ┌─┐
 *   │█│      ← lille farve-tab (16×16) top-venstre, 24px fra venstre
 *   ╭┴───────────────────────────────────╮
 *   │                                     │
 *   │  Plante                       [7]  │
 *   │  Sort                         frø  │
 *   ╰─────────────────────────────────────╯
 *
 * Spec-detaljer:
 *   • Folder: 342×82 px, 14 px border-radius på alle hjørner, hvid (#FFFFFF)
 *   • Tab:    16×16 px, sidder UDOVER folderens top med 16 px,
 *             24 px fra venstre, fyldt med plantens identitets-farve
 *   • Skygge: 0 2px 4px rgba(0,0,0,0.04) — meget subtil
 *
 * Designprincip: WHITE folders sidder INDE i en warm-beige container
 * (håndteres i `inventory-list.tsx`). Selve folderen er bevidst flad og
 * neutral — det er TABBEN øverst der bærer farve-identiteten.
 */

import { plantColor } from '@/lib/plant-color'
import type { InventoryItem } from '@/lib/types'

const sans = 'var(--font-manrope)'

interface Props {
  item: InventoryItem
}

// Spec-dimensioner.
const FOLDER_HEIGHT = 82
const FOLDER_RADIUS = 14
const TAB_SIZE = 16              // 16×16 px firkant
const TAB_OFFSET_LEFT = 24       // tab sidder 24 px fra venstre
const TAB_RADIUS = 3             // ganske let afrunding på selve tabben

export function InventoryTab({ item }: Props) {
  const { field } = plantColor(item.name, item.variety)
  const remaining = item.seedsRemaining ?? item.seedCount ?? 0
  const hasSeedCount = item.seedCount != null

  return (
    // Wrapper: padding-top giver plads til den lille tab der stikker op
    // OVER selve folderen. Inset uden margin/padding er vigtigt — gaps
    // styres af forælder-listens `gap`.
    <div
      style={{
        position: 'relative',
        paddingTop: TAB_SIZE,
      }}
    >
      {/* Tab — den lille farve-firkant der stikker op over folderen.
          Det er HER plantens identitet sidder. Rounded top, flad bund
          så den smelter ind i folderens runde top-hjørne. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: TAB_OFFSET_LEFT,
          width: TAB_SIZE,
          height: TAB_SIZE,
          background: field,
          borderTopLeftRadius: TAB_RADIUS,
          borderTopRightRadius: TAB_RADIUS,
          // Bund-radius matcher folderens top-radius så de visuelt
          // hænger sammen som ÉN form, ikke to enheder.
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />

      {/* Selve folderen — hvid, fuld 14 px rundet, meget subtil skygge. */}
      <div
        style={{
          position: 'relative',
          height: FOLDER_HEIGHT,
          background: '#FFFFFF',
          borderRadius: FOLDER_RADIUS,
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: 22,
        }}
      >
        <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
          <h3
            style={{
              fontFamily: sans,
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: '#24301F',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.name}
          </h3>
          {item.variety && (
            <p
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: '0.01em',
                color: 'rgba(36,48,31,0.55)',
                margin: 0,
                marginTop: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.variety}
            </p>
          )}
        </div>

        {/* Frø-tæller — slank cirkel-pille til højre. */}
        {hasSeedCount && (
          <div
            style={{
              flexShrink: 0,
              minWidth: 42,
              height: 42,
              paddingInline: 4,
              borderRadius: 999,
              border: '1px solid rgba(36,48,31,0.14)',
              background: 'rgba(252,248,240,0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#24301F',
            }}
          >
            <span
              style={{
                fontFamily: sans,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {remaining}
            </span>
            <span
              style={{
                fontFamily: sans,
                fontSize: 8,
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: '0.10em',
                opacity: 0.62,
                marginTop: 2,
              }}
            >
              frø
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
