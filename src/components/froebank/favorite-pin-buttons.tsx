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

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant={isFav ? 'default' : 'outline'}
        onClick={handleFav}
        disabled={pending}
        aria-label={isFav ? 'Fjern favorit' : 'Markér som favorit'}
        className="h-8 w-8"
      >
        <Star className={isFav ? 'h-3.5 w-3.5 fill-current' : 'h-3.5 w-3.5'} />
      </Button>
      <Button
        size="icon"
        variant={isPin ? 'default' : 'outline'}
        onClick={handlePin}
        disabled={pending}
        aria-label={isPin ? 'Fjern fastgørelse' : 'Fastgør'}
        className="h-8 w-8"
      >
        <Pin className={isPin ? 'h-3.5 w-3.5 fill-current' : 'h-3.5 w-3.5'} />
      </Button>
    </div>
  )
}
