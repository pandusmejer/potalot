import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sprout } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllInventoryItems } from '@/actions/froebank'

export const dynamic = 'force-dynamic'

/**
 * Onboarding V2 — Klar-skærmen. Fælles, varm afslutning for ALLE veje:
 * "starter"/"flere måneder" (direkte) OG "godt i gang" (efter import-shellen).
 * Fortæller hvad der er i haven nu, hvad man kan gøre, og at Potalot vokser med.
 */
export default async function OnboardingFaerdigPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [plants, seeds] = await Promise.all([getAllPlants(), getAllInventoryItems()])
  const harNoget = plants.length > 0 || seeds.length > 0

  const dele: string[] = []
  if (plants.length > 0) dele.push(`${plants.length} plante${plants.length === 1 ? '' : 'r'}`)
  if (seeds.length > 0) dele.push(`${seeds.length} frø`)
  const oversigt = dele.join(' og ')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background py-8">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="flex justify-center"><Sprout className="h-11 w-11 text-primary" /></div>
        <h1 className="text-3xl font-serif text-foreground">Så er du klar</h1>

        {harNoget ? (
          <p className="text-sm text-foreground">
            Du har allerede <span className="font-medium">{oversigt}</span> i din have.
            Potalot holder styr på spiring, udplantning og høst herfra.
          </p>
        ) : (
          <p className="text-sm text-foreground">
            Din have er tom endnu — og det er helt fint. Tilføj det første, når du er klar,
            så begynder Potalot at følge med.
          </p>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">
          Jo mere du dyrker, observerer og høster, desto mere vokser Potalot med dig.
          Nyt indhold og nye funktioner dukker op undervejs, når de bliver relevante for din have.
        </p>

        <div className="pt-1 space-y-2.5">
          <Link href="/" className="block w-full rounded-xl bg-primary text-primary-foreground font-medium py-3 no-underline">
            Gå til min have
          </Link>
          <Link href="/kalender" className="block w-full text-sm text-muted-foreground hover:text-foreground no-underline py-1">
            Se hvad der er relevant nu i kalenderen
          </Link>
        </div>
      </div>
    </div>
  )
}
