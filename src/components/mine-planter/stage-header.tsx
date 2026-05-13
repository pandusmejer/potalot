'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PLANT_STATUS_META } from '@/lib/constants'
import { nextStage, previousStage, STAGE_ORDER } from '@/lib/plant-stages'
import { updatePlantStatus } from '@/actions/mine-planter'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PlantStatus } from '@/lib/types'
import { dageSiden, idag } from '@/lib/datetime'

interface Props {
  plantId: string
  status: PlantStatus
  /** Hvilken dato (ISO) markerer indgangen til nuværende stadie? Bruges til alder-display. */
  stageEnteredOn?: string | null
}

/**
 * Stadie-overskrift med stort label, beskrivelse + frem/tilbage-knapper
 * til manuel stadie-overgang. Åbner dato-dialog så brugeren kan angive
 * den faktiske dato hvor stadie-skiftet skete (default i dag).
 */
export function StageHeader({ plantId, status, stageEnteredOn }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ target: PlantStatus; date: string } | null>(null)

  const meta = PLANT_STATUS_META[status]
  const prev = previousStage(status)
  const next = nextStage(status)
  const dage = stageEnteredOn ? dageSiden(stageEnteredOn) : null
  const currentIdx = STAGE_ORDER.indexOf(status)

  function openConfirm(target: PlantStatus) {
    setError(null)
    setConfirm({ target, date: idag() })
  }

  function commitChange() {
    if (!confirm) return
    setError(null)
    startTransition(async () => {
      const res = await updatePlantStatus(plantId, confirm.target, confirm.date)
      if ('error' in res) { setError(res.error); return }
      setConfirm(null)
      router.refresh()
    })
  }

  return (
    <>
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
                  onClick={() => openConfirm(next)}
                  disabled={pending}
                  className="bg-primary/90 hover:bg-primary"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  Næste: {PLANT_STATUS_META[next].label}
                </Button>
              )}
              {prev && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => openConfirm(prev)}
                  disabled={pending}
                  className="text-xs"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Tilbage til {PLANT_STATUS_META[prev].label}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          {confirm && (
            <>
              <DialogTitle>
                Skift stadie til &ldquo;{PLANT_STATUS_META[confirm.target].label}&rdquo;
              </DialogTitle>
              <DialogDescription>
                Hvornår skete det? Du kan vælge en tidligere dato hvis du
                logger skiftet bagefter.
              </DialogDescription>

              <div className="space-y-2 py-2">
                <Label>Dato</Label>
                <Input
                  type="date"
                  value={confirm.date}
                  max={idag()}
                  onChange={(e) => setConfirm({ ...confirm, date: e.target.value })}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground italic">
                  Bruges til at beregne &ldquo;X dage i dette stadie&rdquo; og dukker op i tidslinjen.
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setConfirm(null)} disabled={pending}>
                  Annullér
                </Button>
                <Button
                  type="button"
                  onClick={commitChange}
                  disabled={pending || !confirm.date}
                  className="bg-primary"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  Skift stadie
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
