'use client'

import { useState } from 'react'
import { Mic } from 'lucide-react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog'
import { TalOptager } from './tal-optager'

/**
 * Global topbar-indgang — "Fang en tanke". Samme motor som Havebog-recorderen,
 * men en anden mental model: lynhurtig note (10 sekunder, hurtigt ind/ud), ikke
 * "fortæl dagens historie". Derfor `kontekst="hurtig"` → kompakt guide-ark.
 */
export function TrykOgTalKnap() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Fang en tanke — hurtig note til haven"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]"
        >
          <Mic className="h-[18px] w-[18px]" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" /> Fang en tanke
        </DialogTitle>
        <DialogDescription>
          En hurtig note til haven — sig løst, hvad du kom i tanke om, så
          organiserer Potalot resten.
        </DialogDescription>
        <TalOptager kontekst="hurtig" />
      </DialogContent>
    </Dialog>
  )
}
