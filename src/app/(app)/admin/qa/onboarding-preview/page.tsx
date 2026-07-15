import { OnboardingShell } from '@/components/onboarding/onboarding-shell'
import { HaveTekstFlow } from '@/components/onboarding/have-tekst-flow'
import type { HaveForslag } from '@/actions/have-tekst'

export const dynamic = 'force-dynamic'

/**
 * Gated QA-preview af onboarding-shellen (V1B) i mobil-bredde. Annas rigtige
 * konto er onboarded=true, så /onboarding redirecter — denne rute viser shellen
 * + fortæl-fra-tekst review-listen isoleret med demo-data. Ikke i navigation;
 * fjernes når review er slut. Gem-handlinger kræver login (ren visuel QA).
 */
const DEMO_FORSLAG: HaveForslag[] = [
  { id: 'd1', kind: 'plante', name: 'Tomat', variety: 'San Marzano', quantity: 3, location: 'Drivhus', sowingMonths: null, primaryCategoryId: null, usikkerhed: 'hoej' },
  { id: 'd2', kind: 'plante', name: 'Gulerod', variety: null, quantity: null, location: 'Højbed 2', sowingMonths: null, primaryCategoryId: null, usikkerhed: 'lav' },
  { id: 'd3', kind: 'froe', name: 'Spinat', variety: null, quantity: 1, location: null, sowingMonths: [3, 4], primaryCategoryId: 'fro', usikkerhed: 'mellem' },
]

export default function OnboardingPreviewPage() {
  return (
    <div className="max-w-[390px] mx-auto py-6 space-y-12">
      <div>
        <p className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">Shell · tom have</p>
        <OnboardingShell gardenLocations={[]} existingNames={['Tomat']} plantCount={0} seedCount={0} />
      </div>
      <div>
        <p className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">Shell · med indhold</p>
        <OnboardingShell gardenLocations={[]} existingNames={['Tomat']} plantCount={3} seedCount={5} />
      </div>
      <div className="rounded-2xl border border-input p-4">
        <p className="text-[10.5px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">Fortæl-fra-tekst · review-liste (dublet=Tomat)</p>
        <HaveTekstFlow existingNames={['Tomat']} demoForslag={DEMO_FORSLAG} />
      </div>
    </div>
  )
}
