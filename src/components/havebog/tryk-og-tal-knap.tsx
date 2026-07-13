'use client'

import { useState } from 'react'
import { Mic } from 'lucide-react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog'
import { TalOptager } from './tal-optager'

/**
 * Global "tryk og tal"-indgang (launch) — én knap i topbaren der åbner den
 * eksisterende optag → forslag → godkend → gem-kæde (TalOptager) fra alle
 * hovedsider, så brugeren kan fange noget hurtigt mens de står i haven uden
 * først at finde Havebog-forsiden. Ingen ny motor: dialogen genbruger 1:1 den
 * kæde der allerede kører som RUM 3 på forsiden.
 */
export function TrykOgTalKnap() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Tryk og tal — noter noget til haven"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]"
        >
          <Mic className="h-[18px] w-[18px]" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" /> Tal til din have
        </DialogTitle>
        <DialogDescription>
          Tal eller skriv løst hvad du har set eller gjort — jeg foreslår, og du
          godkender, hvad der skal i din have-log.
        </DialogDescription>
        <TalOptager />
      </DialogContent>
    </Dialog>
  )
}
