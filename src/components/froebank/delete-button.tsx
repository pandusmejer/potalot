'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { deleteInventoryItem } from '@/actions/froebank'

export function DeleteInventoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteInventoryItem(id)
      if (!('error' in res)) {
        setOpen(false)
        router.push('/froebank')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto hover:bg-transparent"
          style={{ height: 44, paddingInline: 14, background: 'transparent', border: 'none', boxShadow: 'none', fontSize: 14, fontWeight: 600, color: '#B85D34' }}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.9} />
          Slet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogTitle>Slet {name}?</DialogTitle>
        <DialogDescription>
          Dette kan ikke fortrydes. Linkede aktive planter forbliver, men referencen mistes.
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            Slet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
