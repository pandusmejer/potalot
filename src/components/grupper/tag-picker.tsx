'use client'

import { TAG_AXES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  maxTags?: number
}

export function TagPicker({ value, onChange, maxTags = 5 }: Props) {
  const selected = new Set(value)
  const atMax = value.length >= maxTags

  function toggle(id: string) {
    if (selected.has(id)) {
      onChange(value.filter(t => t !== id))
    } else if (!atMax) {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground">
        Valgt: {value.length}/{maxTags}
      </p>
      {TAG_AXES.map(axis => (
        <div key={axis.id}>
          <p className="text-xs font-medium text-foreground mb-1.5">{axis.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {axis.tags.map(t => {
              const isSelected = selected.has(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  disabled={!isSelected && atMax}
                  className={cn(
                    'text-xs px-3 py-1 rounded-full border transition',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : atMax
                        ? 'border-border text-muted-foreground/50 cursor-not-allowed'
                        : 'border-border text-foreground hover:bg-accent/30',
                  )}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
