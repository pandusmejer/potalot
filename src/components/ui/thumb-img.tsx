'use client'

import { useState } from 'react'
import { thumbSrc, thumbSrcSet } from '@/lib/images/thumb'

interface Props {
  src: string
  width: number
  height: number
  className?: string
}

/**
 * Thumbnail (dekorativ, alt="") der henter en lille udgave af brugerens egne
 * Supabase-fotos i stedet for originalen — se lib/images/thumb.ts.
 *
 * Fallback: svigter billedtjenesten (fejl, afvist URL), vises originalen i
 * stedet, så et foto aldrig forsvinder. Kuraterede billeder og alt, der ikke
 * er et Supabase-foto, vises præcis som før.
 */
export function ThumbImg({ src, width, height, className }: Props) {
  const [fejlet, setFejlet] = useState(false)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const srcSet = fejlet ? null : thumbSrcSet(src, supabaseUrl)
  const lille = fejlet ? null : thumbSrc(src, supabaseUrl)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={lille ?? src}
      srcSet={srcSet ?? undefined}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => { if (srcSet) setFejlet(true) }}
    />
  )
}
