/**
 * BotanicalBleed — V3 §9 + §15.10
 *
 * "Pause. Stemning. Rytme. Ikke information."
 *
 * Et makrofoto der afbryder tekstrytmen og giver et rent visuelt
 * vejrtræk. Edge-to-edge på mobil. Ingen tekst, ingen CTA, ingen
 * caption — billedet skal stå nøgent.
 *
 * V3-spec:
 *   - Højde 180-240px
 *   - Fade til baggrund (top og bund) — derfor "bleed"
 *   - Ingen tekst, CTA, caption
 *   - Bruges mellem sektioner
 *
 * Spec-kilde: Docs/design-system/guides.md §9 (Botanical Bleed)
 * og §15.10 (specifikke værdier).
 */

interface Props {
  src: string
  /** alt-tekst til skærmlæsere — ikke synlig som caption */
  alt: string
  /** Højde i px. Default 200. V3: 180-240px. */
  height?: number
  /** Fade-color skal matche siden Bleed'en ligger på. Default creme. */
  fadeColor?: string
}

export function BotanicalBleed({
  src,
  alt,
  height = 200,
  fadeColor = '#EAE6D8',
}: Props) {
  return (
    <div
      role="presentation"
      className="relative w-full overflow-hidden"
      style={{ height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Fade — top og bund, så billedet "slipper" siden i begge ender */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0"
        style={{
          height: 60,
          background: `linear-gradient(180deg, ${fadeColor} 0%, transparent 100%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0"
        style={{
          height: 60,
          background: `linear-gradient(0deg, ${fadeColor} 0%, transparent 100%)`,
        }}
      />
    </div>
  )
}
