'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { sætUserMode } from '@/actions/onboarding'
import { MODES, type UserMode } from '@/lib/user-modes'
import { Sprout, Target, Leaf, Moon, Check } from 'lucide-react'

const IKON: Record<UserMode, React.ComponentType<{ className?: string }>> = {
  maalrettet: Target,
  afslappet: Leaf,
  minimal: Moon,
}

export function ModePicker({ open, currentMode }: { open: boolean; currentMode?: string | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<UserMode>((currentMode as UserMode) ?? 'afslappet')

  function bekraft() {
    startTransition(async () => {
      await sætUserMode(selected)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onClose={() => {}} className="max-w-lg">
      <div className="text-center mb-5">
        <Sprout className="h-10 w-10 text-primary mx-auto mb-3" />
        <h2 className="font-serif text-2xl text-foreground">Velkommen til PotAlot</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Vælg hvor meget motoren skal minde dig. Du kan altid skifte senere under Indstillinger.
        </p>
      </div>

      <div className="space-y-2">
        {(Object.keys(MODES) as UserMode[]).map(m => {
          const info = MODES[m]
          const Icon = IKON[m]
          const active = selected === m
          return (
            <button
              key={m}
              onClick={() => setSelected(m)}
              className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:bg-accent/30'
              }`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{info.label}</h3>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {info.beskrivelse}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end mt-5">
        <Button onClick={bekraft} disabled={isPending}>
          {isPending ? 'Gemmer…' : 'Kom i gang'}
        </Button>
      </div>
    </Dialog>
  )
}
