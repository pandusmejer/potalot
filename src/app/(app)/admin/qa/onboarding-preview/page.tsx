import { OnboardingShell } from '@/components/onboarding/onboarding-shell'

export const dynamic = 'force-dynamic'

/**
 * Gated QA-preview af onboarding-shellen (V1B) i mobil-bredde. Annas rigtige
 * konto er onboarded=true, så /onboarding redirecter — denne rute viser shellen
 * isoleret med demo-data. Ikke i navigation; fjernes når review er slut.
 * Bemærk: gem-handlinger kræver login og er ikke aktive her (ren visuel QA).
 */
export default function OnboardingPreviewPage() {
  return (
    <div className="py-6 space-y-14">
      <div>
        <p className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">
          Tom have (ny bruger)
        </p>
        <OnboardingShell
          gardenLocations={[]}
          existingNames={['Tomat']}
          plantCount={0}
          seedCount={0}
        />
      </div>
      <div>
        <p className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">
          Med indhold (fortsæt-senere-retur)
        </p>
        <OnboardingShell
          gardenLocations={[]}
          existingNames={['Tomat', 'Gulerod']}
          plantCount={3}
          seedCount={5}
        />
      </div>
    </div>
  )
}
