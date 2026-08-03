'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bookmark, Check } from 'lucide-react'
import { createInventoryItem } from '@/actions/froebank'

/**
 * GemTilOenskeliste — guide-detaljens tredje handling (adaptive onboarding,
 * SPEC 6). Quick-save: opretter et ønskeliste-item (kategori indkoebsliste)
 * med guidens art/sort — INGEN guideId sendes (imported guides har slug-id,
 * ikke DB-uuid; ensureGuideForInventoryItem kobler korrekt i baggrunden).
 * Kvittering inline (husets 'Gemt'-mønster) + link til destinationen
 * (ingen blindgyder).
 */
export function GemTilOenskeliste({ name, variety }: { name: string; variety?: string | null }) {
  const [pending, startTransition] = useTransition()
  const [gemt, setGemt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function gem() {
    setError(null)
    startTransition(async () => {
      const res = await createInventoryItem({
        name,
        variety: variety ?? undefined,
        primaryCategoryId: 'indkoebsliste',
      })
      if ('error' in res) {
        setError('Kunne ikke gemme — log ind for at bruge ønskelisten.')
        return
      }
      setGemt(true)
    })
  }

  if (gemt) {
    return (
      <p
        className="m-0 mt-2.5 flex items-center justify-center gap-1.5"
        style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 600, color: '#5E6C49' }}
      >
        <Check className="h-3.5 w-3.5" />
        Gemt på ønskelisten
        <Link href="/froebank?kategori=indkoebsliste" className="underline underline-offset-2" style={{ color: '#5E6C49' }}>
          Se den
        </Link>
      </p>
    )
  }

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={gem}
        disabled={pending}
        className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 hover:bg-secondary/30 transition"
        style={{
          background: 'transparent',
          color: 'rgba(45,42,36,0.75)',
          border: '1px dashed rgba(36,48,31,0.25)',
          fontFamily: 'var(--font-manrope)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        <Bookmark className="h-3.5 w-3.5" />
        {pending ? 'Gemmer…' : 'Gem til ønskelisten'}
      </button>
      {error && (
        <p className="m-0 mt-1.5 text-center" style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'rgba(36,48,31,0.55)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
