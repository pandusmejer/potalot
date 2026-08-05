import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Magic-link callback. Supabase sender brugeren hertil med en `code`-parameter
 * efter de har klikket på linket i mailen. Vi exchanger code for session og
 * sender dem videre — til /onboarding hvis profil ikke er færdig, ellers /.
 */

/**
 * Bag Netlifys proxy er request.url's origin den INTERNE deploy-host
 * (main--potalotapp.netlify.app) — en redirect dertil sender brugeren til en
 * adresse, hvor session-cookien ikke gælder (opdaget 5/8 ved domæne-test).
 * Byg origin af x-forwarded-host/-proto (det, browseren faktisk bad om).
 */
function eksterntOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return new URL(request.url).origin
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = eksterntOrigin(request)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  // Kun interne stier — en absolut/protokol-relativ `next` må aldrig kunne
  // sende brugeren ud af huset efter login.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Tjek om brugeren har gennemført onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', user.id)
          .maybeSingle()
        if (!profile?.onboarded) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
