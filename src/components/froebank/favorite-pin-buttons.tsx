'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Star, Pin } from 'lucide-react'
import { toggleFavorite, togglePinned } from '@/actions/froebank'

interface Props {
  id: string
  isFavorite: boolean
  isPinned: boolean
  /** Vis i kompakt format (i kort) eller fuld */
  compact?: boolean
}

export function FavoritePinButtons({ id, isFavorite: initialFav, isPinned: initialPin, compact = false }: Props) {
  const [isFav, setFav] = useState(initialFav)
  const [isPin, setPin] = useState(initialPin)
  const [pending, startTransition] = useTransition()

  function handleFav(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const optimistic = !isFav
    setFav(optimistic)
    startTransition(async () => {
      const res = await toggleFavorite(id)
      if ('error' in res) setFav(initialFav)
      else setFav(res.isFavorite)
    })
  }

  function handlePin(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const optimistic = !isPin
    setPin(optimistic)
    startTransition(async () => {
      const res = await togglePinned(id)
      if ('error' in res) setPin(initialPin)
      else setPin(res.isPinned)
    })
  }

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleFav}
          disabled={pending}
          aria-label={isFav ? 'Fjern favorit' : 'Markér som favorit'}
          className="h-7 w-7 rounded-full hover:bg-accent/50 flex items-center justify-center transition-colors"
        >
          <Star className={isFav ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400' : 'h-3.5 w-3.5 text-muted-foreground'} />
        </button>
        <button
          onClick={handlePin}
          disabled={pending}
          aria-label={isPin ? 'Fjern fastgørelse' : 'Fastgør'}
          className="h-7 w-7 rounded-full hover:bg-accent/50 flex items-center justify-center transition-colors"
        >
          <Pin className={isPin ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 text-muted-foreground'}
                style={isPin ? { color: 'var(--accent-copper)', fill: 'var(--accent-copper)' } : undefined} />
        </button>
      </div>
    )
  }

  // Frøkort-detail hero: star/pin som afrundede firkanter (squircles), samme
  // komponentfamilie. Aktiv = grøn fyld + hvidt ikon; inaktiv = creme + mørkt.
  const squircle = { width: 38, height: 38, borderRadius: 12 }
  const cremeBtn = {
    ...squircle,
    background: '#F6F1E4',
    border: '1px solid rgba(117,101,62,0.16)',
    boxShadow: '0 3px 8px rgba(64,58,42,0.08), inset 0 1px 0 rgba(255,255,255,0.60)',
  }
  const greenBtn = {
    ...squircle,
    background: '#5C7142',
    boxShadow: '0 5px 12px rgba(64,58,42,0.16), inset 0 1px 0 rgba(255,255,255,0.14)',
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleFav}
        disabled={pending}
        aria-label={isFav ? 'Fjern favorit' : 'Markér som favorit'}
        className="inline-flex items-center justify-center transition-transform active:scale-95"
        style={isFav ? greenBtn : cremeBtn}
      >
        <Star style={{ width: 16, height: 16, strokeWidth: 2, color: isFav ? '#FFFDF4' : '#33301F', fill: isFav ? '#FFFDF4' : 'none' }} />
      </button>
      <button
        onClick={handlePin}
        disabled={pending}
        aria-label={isPin ? 'Fjern fastgørelse' : 'Fastgør'}
        className="inline-flex items-center justify-center transition-transform active:scale-95"
        style={isPin ? greenBtn : cremeBtn}
      >
        <Pin style={{ width: 15, height: 15, strokeWidth: 2, color: isPin ? '#FFFDF4' : '#33301F', fill: isPin ? '#FFFDF4' : 'none' }} />
      </button>
    </div>
  )
}
