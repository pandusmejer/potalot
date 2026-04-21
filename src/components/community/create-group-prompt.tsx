'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { oprettOgAccepterGruppe } from '@/actions/community'
import { Users, Check } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  speciesName: string
  varietyName: string | null
  hasProfile: boolean
}

/**
 * Popup der vises EFTER en plante er oprettet.
 * Tilbyder at oprette gruppe for enten specifik sort eller kategori.
 * Kan altid oprettes senere under Community.
 */
export function CreateGroupPrompt({ open, onClose, speciesName, varietyName, hasProfile }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<string | null>(null)

  function handleVælg(niveau: 'variety' | 'species') {
    startTransition(async () => {
      const result = await oprettOgAccepterGruppe({
        species_name: speciesName,
        variety_name: varietyName,
        niveau,
      })

      if ('error' in result) {
        onClose()
        return
      }

      setDone(result.group.title)

      setTimeout(() => {
        setDone(null)
        onClose()
        router.refresh()
      }, 1200)
    })
  }

  function handleSpringOver() {
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleSpringOver} className="max-w-md">
      {done ? (
        <div className="py-8 text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-primary/10 items-center justify-center mb-3">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-serif text-xl text-foreground">Velkommen i {done}.</h2>
        </div>
      ) : (
        <>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Del oplevelsen?
            </span>
          </DialogTitle>

          {!hasProfile ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Du kunne oprette en gruppe for <strong>{varietyName || speciesName}</strong> og
                dele erfaringer med andre dyrkere. Men det kræver en community-profil først.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Kan altid oprettes senere under Community.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={handleSpringOver}>Ikke nu</Button>
                <Button onClick={() => { onClose(); router.push('/community') }}>
                  Opret community-profil
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Vil du oprette en gruppe hvor du kan chatte og dele erfaringer med andre
                der dyrker det samme?
              </p>

              {varietyName && (
                <button
                  onClick={() => handleVælg('variety')}
                  disabled={isPending}
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/40 transition-colors disabled:opacity-50"
                >
                  <p className="font-medium text-foreground">{varietyName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kun andre der dyrker den specifikke sort
                  </p>
                </button>
              )}

              <button
                onClick={() => handleVælg('species')}
                disabled={isPending}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/40 transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-foreground">Alle {speciesName}-dyrkere</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bredere gruppe — alle sorter af {speciesName.toLowerCase()}
                </p>
              </button>

              <div className="flex justify-end pt-1">
                <Button variant="ghost" onClick={handleSpringOver} disabled={isPending}>
                  Ikke nu
                </Button>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Kan altid oprettes senere under Community.
              </p>
            </div>
          )}
        </>
      )}
    </Dialog>
  )
}
