'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteAccount } from '@/actions/account'

/**
 * Slet konto (F3, GDPR). Tydelig advarsel + "skriv SLET"-bekræftelse. Ikke gemt
 * bag support. Ved succes er login-brugeren væk → send til /login.
 */
export function DeleteAccountSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deleteAccount(confirm)
      if ('error' in res) { setError(res.error); return }
      // Kontoen + sessionen er væk. Til login.
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          Konto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          Slet din konto og alle dine data permanent. Handlingen kan ikke fortrydes.
        </p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setConfirm(''); setError(null) } }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
              Slet konto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Slet din konto
            </DialogTitle>
            <DialogDescription>
              Dette sletter din konto og <span className="font-medium text-foreground">alle dine data</span> i
              Potalot — planter, frø, noter, opgaver, guides og alt du har tilføjet.
              Handlingen kan <span className="font-medium text-foreground">ikke fortrydes</span>.
            </DialogDescription>
            <div className="space-y-2 py-1">
              <label className="text-sm text-foreground">Skriv <span className="font-semibold">SLET</span> for at bekræfte:</label>
              <Input
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="SLET"
                autoFocus
                autoCapitalize="characters"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Annullér</Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={pending || confirm !== 'SLET'}
              >
                {pending ? 'Sletter…' : 'Slet min konto permanent'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
