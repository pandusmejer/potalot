'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react'
import { promoteGuideToMaster } from '@/actions/guides-admin'

interface Props {
  guideId: string
  guideTitle: string
}

export function PromoteToMasterButton({ guideId, guideTitle }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ id: string; label: string } | null>(null)

  function handleOpen() {
    setOpen(true)
    setError(null)
    setConflict(null)
  }

  function doPromote(replaceExistingMasterId: string | null = null) {
    setError(null)
    startTransition(async () => {
      const res = await promoteGuideToMaster(
        guideId,
        replaceExistingMasterId ? { replaceExistingMasterId } : undefined
      )
      if ('error' in res) {
        setError(res.error)
        return
      }
      if ('conflict' in res) {
        setConflict({ id: res.existingMasterId, label: res.existingMasterLabel })
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="text-green-800 hover:text-green-900 hover:bg-green-50"
        title="Gør denne guide til en master tilgængelig for alle brugere"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Gør til master
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-700" />
            Gør til master-guide?
          </DialogTitle>
          <DialogDescription>
            &ldquo;{guideTitle}&rdquo; bliver synlig for alle brugere som master.
          </DialogDescription>

          {!conflict ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Når du promoverer:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Guiden bliver synlig for alle brugere som <strong>kuratet master</strong></li>
                <li>Du bliver registreret som creator</li>
                <li>Du mister din private &ldquo;Min&rdquo;-version — guiden er nu fælles</li>
                <li>Andre kan klone den til deres eget brug</li>
              </ul>
              <p className="pt-1 text-xs italic">
                Tip: Hvis du vil beholde din private kopi også, så klon guiden først (via &ldquo;Tilpas til mig&rdquo;) og promovér originalen.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2">
              <p className="text-sm font-medium text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Der findes allerede en master
              </p>
              <p className="text-xs text-amber-900/90">
                &ldquo;{conflict.label}&rdquo; eksisterer som master. Vil du erstatte den?
              </p>
              <p className="text-xs text-amber-900/80 italic">
                Den eksisterende master bliver slettet, og alle items/planter/sorter der peger på den bliver auto-relinket til denne guide.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annullér
            </Button>
            {!conflict ? (
              <Button
                type="button"
                onClick={() => doPromote()}
                disabled={pending}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Promovér til master
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => doPromote(conflict.id)}
                disabled={pending}
                className="bg-amber-700 hover:bg-amber-800 text-white"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Erstat eksisterende master
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
