'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProfileMenu } from './profile-menu'
import { NotificationBell } from './notification-bell'
import { TrykOgTalKnap } from '@/components/havebog/tryk-og-tal-knap'
import { getProfile } from '@/actions/profil'
import { harAuthCookie } from '@/lib/auth-cookie'
import type { Profile } from '@/lib/types'

/**
 * Topbarens højre side når serveren IKKE kendte en profil — dvs. anonyme
 * besøg OG statisk genererede sider (build uden cookies). SSR/static viser
 * login-knapperne (den anonyme grundform); efter mount opgraderes til de
 * rigtige kontroller, hvis der findes en auth-cookie. Knap-markup er den
 * låste topbar-variant, flyttet 1:1 fra topbar.tsx.
 */
export function TopbarAuthOmraade() {
  const [erAuth, setErAuth] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!harAuthCookie()) return
    setErAuth(true)
    getProfile()
      .then((p) => { if (p) setProfile(p) })
      .catch(() => setErAuth(false))
  }, [])

  if (erAuth) {
    // Kort tomrum (samme højde) mens profilen hentes — bedre end at vise
    // "Log ind" til en logget ind bruger.
    if (!profile) return <div aria-hidden className="h-9" />
    return (
      <div className="flex items-center gap-1.5">
        <TrykOgTalKnap />
        <NotificationBell initialUnreadCount={0} fetchCountOnMount />
        <ProfileMenu profile={profile} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm" className="font-medium text-foreground">
        <Link href="/login">Log ind</Link>
      </Button>
      {/* Dæmpet oliven CTA (Annas spec) — mindre farvemættet end den
          tidligere mørkegrønne, matcher Havebog-creme-universet. */}
      <Button
        asChild
        size="sm"
        className="rounded-full px-5 text-[#F7F4EA] hover:opacity-90"
        style={{ background: '#6D7752' }}
      >
        <Link href="/opret">Opret bruger</Link>
      </Button>
    </div>
  )
}
