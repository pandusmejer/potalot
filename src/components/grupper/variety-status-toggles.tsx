'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Check } from 'lucide-react'
import { setVarietyStatus } from '@/actions/group-varieties'
import { VARIETY_STATUS_OPTIONS, type VarietyStatus } from '@/lib/varieties-shared'
import { cn } from '@/lib/utils'

interface Props {
  varietyId: string
  initialStatuses: VarietyStatus[]
  isMember: boolean
}

export function VarietyStatusToggles({ varietyId, initialStatuses, isMember }: Props) {
  const router = useRouter()
  const [statuses, setStatuses] = useState<Set<VarietyStatus>>(new Set(initialStatuses))
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(status: VarietyStatus) {
    if (!isMember) return
    const enabled = !statuses.has(status)
    // Optimistic
    const next = new Set(statuses)
    if (enabled) next.add(status); else next.delete(status)
    setStatuses(next)
    setError(null)
    startTransition(async () => {
      const res = await setVarietyStatus({ varietyId, status, enabled })
      if ('error' in res) {
        setError(res.error)
        // Revert
        const revert = new Set(statuses)
        setStatuses(revert)
      } else {
        router.refresh()
      }
    })
  }

  const erfaring = VARIETY_STATUS_OPTIONS.filter(o => o.group === 'erfaring')
  const froe = VARIETY_STATUS_OPTIONS.filter(o => o.group === 'froe')

  if (!isMember) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Kun medlemmer kan markere statusser. Deltag i gruppen for at bidrage.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Erfaring</p>
        <div className="flex flex-wrap gap-1.5">
          {erfaring.map(o => (
            <Pill
              key={o.id}
              label={o.label}
              active={statuses.has(o.id)}
              onClick={() => toggle(o.id)}
              disabled={pending}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Frø</p>
        <div className="flex flex-wrap gap-1.5">
          {froe.map(o => (
            <Pill
              key={o.id}
              label={o.label}
              active={statuses.has(o.id)}
              onClick={() => toggle(o.id)}
              disabled={pending}
            />
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function Pill({
  label, active, onClick, disabled,
}: { label: string; active: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-xs px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-foreground hover:bg-accent/30',
        disabled && 'opacity-60',
      )}
    >
      {disabled
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : active && <Check className="h-3 w-3" />}
      {label}
    </button>
  )
}
