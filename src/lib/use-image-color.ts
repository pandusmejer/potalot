'use client'

import { useEffect, useState } from 'react'

/**
 * Udtræk plante-kortets blokfarve fra det fritlagte foto.
 * Cut-out-billeder er transparente PNG'er → kun ikke-gennemsigtige
 * pixels tæller. Gennemsnitsfarven "styrkes" (mættes op, lysstyrke
 * loftes) så blokken er en kraftig flade med læsbar hvid tekst.
 *
 * Returnerer null indtil/uden et brugbart foto (fx CORS-fejl eller
 * intet billede) — kaldere falder tilbage til navne-baseret farve.
 */
export function useImageColor(src?: string | null): string | null {
  // Knyt farven til den src den blev udledt fra, så et skift
  // af src ikke viser forrige plantes farve — og så effekten
  // aldrig kalder setState synkront (kun i async onload).
  const [resolved, setResolved] = useState<{ src: string; color: string } | null>(null)

  useEffect(() => {
    if (!src) return
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      try {
        const S = 36
        const canvas = document.createElement('canvas')
        canvas.width = S
        canvas.height = S
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, S, S)
        const { data } = ctx.getImageData(0, 0, S, S)
        let r = 0, g = 0, b = 0, n = 0
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]
          if (a < 128) continue // spring transparent baggrund over
          // spring næsten-hvide/grå pixels over (lys baggrund/skygge)
          const rr = data[i], gg = data[i + 1], bb = data[i + 2]
          const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb)
          if (mx > 235 && mx - mn < 18) continue
          r += rr; g += gg; b += bb; n++
        }
        if (n < 12) return // for lidt motiv — brug fallback
        setResolved({ src, color: strengthen(r / n, g / n, b / n) })
      } catch {
        /* CORS-taint e.l. → behold fallback */
      }
    }
    img.onerror = () => { /* behold fallback */ }
    img.src = src
    return () => { cancelled = true }
  }, [src])

  return resolved && src && resolved.src === src ? resolved.color : null
}

/** RGB-gennemsnit → mættet, dyrket blokfarve (hvid tekst læsbar) */
function strengthen(r: number, g: number, b: number): string {
  const [h, s, l] = rgbToHsl(r, g, b)
  const sat = Math.min(100, Math.max(38, s * 1.35))
  const light = Math.min(64, Math.max(42, l))
  return `hsl(${Math.round(h)} ${Math.round(sat)}% ${Math.round(light)}%)`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  const d = mx - mn
  let h = 0
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (mx + mn) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return [h, s * 100, l * 100]
}
