import { OnboardingForm } from '@/components/auth/onboarding-form'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sprout } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Hvis allerede onboarded, send ind
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarded) redirect('/')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Sprout className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif text-foreground">Velkommen</h1>
          <p className="text-sm text-muted-foreground">
            Lad os få din profil på plads.
          </p>
        </div>

        <OnboardingForm email={user.email ?? ''} />
      </div>
    </div>
  )
}
