'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PLANT_STATUS_META } from '@/lib/constants'
import { nextStage, previousStage, STAGE_ORDER } from '@/lib/plant-stages'
import { updatePlantStatus } from '@/actions/mine-planter'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PlantStatus } from '@/lib/types'
import { dageSiden } from '@/lib/datetime'

interface Props {
  plantId: string
  status: PlantStatus
  /** Hvilken dato (ISO) markerer indgangen til nuværende stadie? Bruges til alder-display. */
  stageEnteredOn?: string | null
}

/**
 * Stadie-overskrift med stort label, beskrivelse + frem/tilbage-knapper
 * til manuel stadie-overgang.
 */
export function StageHeader({ plantId, status, stageEnteredOn }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const meta = PLANT_STATUS_META[status]
  const prev = previousStage(status)
  const next = nextStage(status)
  const dage = stageEnteredOn ? dageSiden(stageEnteredOn) : null
  const currentIdx = STAGE_ORDER.indexOf(status)

  function advanceTo(target: PlantStatus) {
    setError(null)
    startTransition(async () => {
      const res = await updatePlantStatus(plantId, target)
      if ('error' in res) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-card border-primary/20">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Stadium {currentIdx + 1} af {STAGE_ORDER.length}
            </p>
            <h2 className="text-xl sm:text-2xl font-serif text-foreground">{meta.label}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{meta.description}</p>
            {dage !== null && dage >= 0 && (
              <p className="text-[11px] text-muted-foreground mt-1.5 italic">
                {dage === 0 ? 'I dag' : `${dage} dag${dage === 1 ? '' : 'e'} i dette stadie`}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            {next && (
              <Button
                type="button"
                size="sm"
                onClick={() => advanceTo(next)}
                disabled={pending}
                className="bg-primary/90 hover:bg-primary"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                Næste: {PLANT_STATUS_META[next].label}
              </Button>
            )}
            {prev && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => advanceTo(prev)}
                disabled={pending}
                className="text-xs"
              >
                <ChevronLeft className="h-3 w-3" />
                Tilbage til {PLANT_STATUS_META[prev].label}
              </Button>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </CardContent>
    </Card>
  )
}
