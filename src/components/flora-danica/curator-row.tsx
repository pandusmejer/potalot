'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { godkendAsset, afvisAsset, regenererAsset } from '@/actions/flora-danica'
import { Check, X, RefreshCw, Loader2 } from 'lucide-react'
import type { Variety } from '@/lib/types'

interface Props {
  variety: Variety
  mode: 'pending' | 'approved'
}

export function CuratorRow({ variety, mode }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState<'approve' | 'reject' | 'regenerate' | null>(null)

  function handleApprove() {
    setBusy('approve')
    startTransition(async () => {
      await godkendAsset(variety.id)
      router.refresh()
    })
  }

  function handleReject() {
    if (!confirm('Afvis og slet illustration?')) return
    setBusy('reject')
    startTransition(async () => {
      await afvisAsset(variety.id)
      router.refresh()
    })
  }

  function handleRegenerate() {
    setBusy('regenerate')
    startTransition(async () => {
      await regenererAsset(variety.id)
      router.refresh()
    })
  }

  const label = variety.variety_name
    ? `${variety.species_name} — ${variety.variety_name}`
    : variety.species_name

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {variety.illustration_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={variety.illustration_url}
          alt={label}
          className="w-full aspect-square object-contain bg-amber-50/40"
        />
      )}
      <div className="p-3 space-y-2">
        <div>
          <p className="font-serif text-base text-foreground">{label}</p>
          {variety.botanical_name && (
            <p className="text-xs italic text-muted-foreground">{variety.botanical_name}</p>
          )}
        </div>

        {isPending && busy === 'regenerate' && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Genererer ny…
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {mode === 'pending' ? (
            <>
              <Button size="sm" onClick={handleApprove} disabled={isPending}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Godkend
              </Button>
              <Button size="sm" variant="secondary" onClick={handleRegenerate} disabled={isPending}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Generér ny
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReject} disabled={isPending} className="text-destructive">
                <X className="h-3.5 w-3.5 mr-1" />
                Afvis
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={handleRegenerate} disabled={isPending}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Generér ny
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReject} disabled={isPending} className="text-destructive">
                <X className="h-3.5 w-3.5 mr-1" />
                Fjern
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
