'use client'

import { useState } from 'react'
import { Sprout } from 'lucide-react'
import { OnboardingForm } from '@/components/auth/onboarding-form'
import { OnboardingShell } from '@/components/onboarding/onboarding-shell'
import type { GardenLocation } from '@/lib/types'

interface Props {
  email: string
  /** 'have' hvis profilen allerede er udfyldt (fortsæt-senere-retur). */
  startPhase: 'profil' | 'have'
  gardenLocations: GardenLocation[]
  existingNames: string[]
  plantCount: number
  seedCount: number
}

/**
 * To-faset onboarding: profil → have-opsætning. `onboarded` sættes først i
 * shellens afslutning, så et retur til /onboarding genoptager på have-fasen
 * (fremskridt bevaret) frem for at tvinge profil-trinnet igen.
 */
export function OnboardingWizard({
  email, startPhase, gardenLocations, existingNames, plantCount, seedCount,
}: Props) {
  const [phase, setPhase] = useState<'profil' | 'have'>(startPhase)

  if (phase === 'profil') {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Sprout className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif text-foreground">Velkommen</h1>
          <p className="text-sm text-muted-foreground">Lad os få din profil på plads.</p>
        </div>
        <OnboardingForm email={email} onComplete={() => setPhase('have')} />
      </div>
    )
  }

  return (
    <OnboardingShell
      gardenLocations={gardenLocations}
      existingNames={existingNames}
      plantCount={plantCount}
      seedCount={seedCount}
    />
  )
}
