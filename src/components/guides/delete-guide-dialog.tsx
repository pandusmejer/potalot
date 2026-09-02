'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertTriangle, Link2 } from 'lucide-react'
import { getGuideUsageStats, deleteGuide, type GuideUsageStats } from '@/actions/guides'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  guideId: string
  guideTitle: string
  /** Hvor brugeren sendes hen efter sletning */
  redirectTo?: string
}

export function DeleteGuideDialog({
  open, onOpenChange, guideId, guideTitle, redirectTo = '/guides',
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [stats, setStats] = useState<GuideUsageStats | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [applyRelink, setApplyRelink] = useState(true)
  const [notifyAffected, setNotifyAffected] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoadError(null)
    setStats(null)
    getGuideUsageStats(guideId).then(res => {
      if (!active) return
      if ('error' in res) setLoadError(res.error)
      else setStats(res)
    })
    return () => { active = false }
  }, [open, guideId])

  function handleConfirm() {
    setSubmitError(null)
    const replacement = applyRelink ? (stats?.replacementGuideId ?? null) : null
    startTransition(async () => {
      const res = await deleteGuide(guideId, {
        replacementGuideId: replacement,
        notifyAffectedUsers: notifyAffected,
      })
      if ('error' in res) { setSubmitError(res.error); return }
      onOpenChange(false)
      router.push(redirectTo)
    })
  }

  const isAffected = stats ? (stats.inventoryItems + stats.plants + stats.varieties) > 0 : false
  const hasReplacement = !!stats?.replacementGuideId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          Slet &ldquo;{guideTitle}&rdquo;?
        </DialogTitle>
        <DialogDescription>
          Denne handling kan ikke fortrydes.
        </DialogDescription>

        <div className="space-y-3">
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : !stats ? (
            <p className="text-sm text-muted-foreground italic">Henter brug…</p>
          ) : !isAffected ? (
            <p className="text-sm text-muted-foreground">
              Guiden er ikke linket fra nogen items, planter eller sorter — sletning er sikker.
            </p>
          ) : (
            <>
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-1">
                <p className="text-xs font-medium text-amber-900">Guiden er linket fra:</p>
                <ul className="text-xs text-amber-900/90 space-y-0.5 list-disc list-inside">
                  {stats.inventoryItems > 0 && (
                    <li>{stats.inventoryItems} item{stats.inventoryItems === 1 ? '' : 's'} i frøbanken</li>
                  )}
                  {stats.plants > 0 && (
                    <li>{stats.plants} plante{stats.plants === 1 ? '' : 'r'} i Mine planter</li>
                  )}
                  {stats.varieties > 0 && (
                    <li>{stats.varieties} sort{stats.varieties === 1 ? '' : 'er'} i gruppe-kataloger</li>
                  )}
                  {stats.affectedUsers > 1 && (
                    <li className="font-medium">{stats.affectedUsers} brugere berøres</li>
                  )}
                </ul>
              </div>

              {hasReplacement && (
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyRelink}
                    onChange={e => setApplyRelink(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="font-medium text-foreground inline-flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      Knyt automatisk til &ldquo;{stats.replacementGuideLabel}&rdquo;
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Berørte frø og planter knyttes til den alternative guide i stedet for at miste deres guide.
                    </span>
                  </span>
                </label>
              )}
              {!hasReplacement && (
                <p className="text-xs text-muted-foreground italic">
                  Ingen alternativ guide med samme plantenavn findes — berørte frø og planter mister deres guide, og brugerne kan selv knytte en ny til via &ldquo;Mangler guide&rdquo;-filteret.
                </p>
              )}

              {stats.affectedUsers > 0 && (
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAffected}
                    onChange={e => setNotifyAffected(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="font-medium text-foreground">
                      Notificér {stats.affectedUsers} berørt{stats.affectedUsers === 1 ? '' : 'e'} bruger{stats.affectedUsers === 1 ? '' : 'e'}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      De får besked om at guiden er slettet med link til frøbankens &ldquo;Mangler guide&rdquo;-filter.
                    </span>
                  </span>
                </label>
              )}
            </>
          )}

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annullér</Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={pending || !!loadError || !stats}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Slet permanent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
