'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { USER_MODES } from '@/lib/constants'
import type { Profile, UserMode } from '@/lib/types'
import { Target, Leaf, Moon, Check, Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Onboarding-gate.
 * Vises ved første besøg (profile.onboarded === false).
 *
 * TODO (database): Gem onboarding-valg til Supabase via server action.
 * Lige nu: gemmer til localStorage som mock.
 */
export function OnboardingGate({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email)
  const [selectedMode, setSelectedMode] = useState<UserMode>(profile.userMode)

  useEffect(() => {
    // Check localStorage for onboarding state (mock for DB)
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('potalot:onboarded') : null
    if (!saved && !profile.onboarded) {
      setOpen(true)
    }
  }, [profile.onboarded])

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !email.trim()) return
    setStep(2)
  }

  function handleComplete() {
    // TODO (database): Kald server action til at gemme profile + mode
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('potalot:onboarded', JSON.stringify({
        username, email, mode: selectedMode, at: new Date().toISOString(),
      }))
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sprout className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Trin {step} af 2
          </span>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1Next} className="space-y-4">
            <DialogTitle className="text-2xl">Velkommen til PotAlot</DialogTitle>
            <DialogDescription>
              Først lidt om dig. Du kan altid ændre det senere under indstillinger.
            </DialogDescription>

            <div className="space-y-3">
              <div>
                <Label htmlFor="username">Navn</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Fx. Rasmus fra Østjylland"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="dig@eksempel.dk"
                  required
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Bruges til login.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">Næste</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogTitle className="text-2xl">Hvordan vil du bruge PotAlot?</DialogTitle>
            <DialogDescription>
              Vælg en tilgang der passer dig. Du kan altid ændre det senere.
            </DialogDescription>

            <div className="space-y-2">
              {(Object.keys(USER_MODES) as UserMode[]).map(mode => {
                const info = USER_MODES[mode]
                const Icon = mode === 'maalrettet' ? Target : mode === 'afslappet' ? Leaf : Moon
                const active = selectedMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3',
                      active
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:bg-accent/30'
                    )}
                  >
                    <span
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{info.label}</h3>
                        <span className="text-xs text-muted-foreground">— {info.tagline}</span>
                        {active && <Check className="h-4 w-4 text-primary ml-auto" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {info.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Tilbage
              </Button>
              <Button onClick={handleComplete}>Kom i gang</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
