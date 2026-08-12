import Link from 'next/link'
import { Sprout } from 'lucide-react'
import { ProfileMenu } from './profile-menu'
import { NotificationBell } from './notification-bell'
import { TopbarAuthOmraade } from './topbar-auth-omraade'
import { TrykOgTalKnap } from '@/components/havebog/tryk-og-tal-knap'
import { Suspense } from 'react'
import { getUnreadCount } from '@/actions/notifications'
import { getGardenWeather } from '@/actions/weather'
import type { Profile } from '@/lib/types'

/** Async ø: badge-tallet streames ind — klokken selv venter ikke. */
async function BellMedTal() {
  const unreadCount = await getUnreadCount()
  return <NotificationBell initialUnreadCount={unreadCount} />
}

/** Async ø: vejrlinjen streames ind under topbaren.
 * Vejret er KONTEKST, ikke en handling (Annas retning 13/7): ingen chip,
 * ingen baggrund, ingen ikon — en diskret redaktionel statuslinje under
 * topbaren. "22° · Let støvregn i Brabrand" (bynavn uden postnummer). */
async function VejrLinje() {
  const weather = await getGardenWeather()
  if (!weather) return null
  const by = weather.locationName?.replace(/^\d{3,4}\s*/, '').trim() || null
  const vejrLinje = `${weather.tempC}° · ${weather.label}${by ? ` i ${by}` : ''}`
  return (
    <Link
      href="/indstillinger"
      title={weather.summary}
      className="mt-0.5 block max-w-full truncate text-[12.5px] leading-[1.45] text-muted-foreground tabular-nums hover:text-foreground transition-colors"
    >
      {vejrLinje}
    </Link>
  )
}

export function Topbar({ profile }: { profile: Profile | null }) {
  // syncTaskReminders (DB-write) kører IKKE længere her — den blokerede hver
  // eneste navigation. NotificationBell fyrer den fra klienten, throttlet.
  // Ulæste-tal og vejr er Suspense-øer, så første byte ikke venter på dem.
  return (
    <header
      className="sticky top-0 z-30 border-b border-[color-mix(in_oklab,var(--primary)_22%,var(--border))] backdrop-blur-md"
      style={{ background: 'color-mix(in oklab, var(--card) 86%, var(--primary))' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--deco-gold), transparent)' }}
      />
      <div className="relative mx-auto w-full max-w-[480px] px-4 pt-2.5 pb-2">
        {/* Række 1 — logo (tilbageholdent) + klokke/profil */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <Sprout className="h-[18px] w-[18px] text-primary" />
            <span className="font-serif text-lg text-foreground">Potalot</span>
          </Link>
          {profile ? (
            <div className="flex items-center gap-1.5">
              <TrykOgTalKnap />
              <Suspense fallback={<NotificationBell initialUnreadCount={0} />}>
                <BellMedTal />
              </Suspense>
              <ProfileMenu profile={profile} />
            </div>
          ) : (
            // Anonym ELLER statisk side: klient-komponenten viser login-
            // knapperne og opgraderer selv til auth-kontroller via cookie.
            <TopbarAuthOmraade />
          )}
        </div>

        {/* Række 2 — vejret som stille redaktionel linje (kun m. lokation).
            Fallback holder linjens højde, så indholdet ikke hopper når vejret
            streames ind (kun brugere MED lokation får linjen). */}
        {profile?.latitude != null && profile?.longitude != null && (
          <Suspense
            fallback={
              <span aria-hidden className="mt-0.5 block max-w-full truncate text-[12.5px] leading-[1.45]">
                &nbsp;
              </span>
            }
          >
            <VejrLinje />
          </Suspense>
        )}
      </div>
    </header>
  )
}
