import { hentOnboardingStatus } from '@/actions/onboarding'
import { ModePicker } from './mode-picker'

/**
 * Server-side onboarding-gate.
 * Viser mode-picker ved første besøg. Ikke en blokerende overlay —
 * kan lukkes ved at vælge en mode.
 */
export async function OnboardingGate() {
  const status = await hentOnboardingStatus()
  if (!status) return null
  if (status.onboarded) return null

  return <ModePicker open={true} currentMode={status.user_mode} />
}
