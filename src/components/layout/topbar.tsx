import Link from 'next/link'
import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileMenu } from './profile-menu'
import { NotificationBell } from './notification-bell'
import { TrykOgTalKnap } from '@/components/havebog/tryk-og-tal-knap'
import { getUnreadCount } from '@/actions/notifications'
import { getGardenWeather } from '@/actions/weather'
import type { Profile } from '@/lib/types'

export async function Topbar({ profile }: { profile: Profile | null }) {
  // syncTaskReminders (DB-write) kører IKKE længere her — den blokerede hver
  // eneste navigation. NotificationBell fyrer den fra klienten, throttlet.
  const [unreadCount, weather] = profile
    ? await Promise.all([getUnreadCount(), getGardenWeather()])
    : [0, null]

  // Vejret er KONTEKST, ikke en handling (Annas retning 13/7): ingen chip,
  // ingen baggrund, ingen ikon — en diskret redaktionel statuslinje under
  // topbaren. "22° · Let støvregn i Brabrand" (bynavn uden postnummer).
  const by = weather?.locationName?.replace(/^\d{3,4}\s*/, '').trim() || null
  const vejrLinje = weather
    ? `${weather.tempC}° · ${weather.label}${by ? ` i ${by}` : ''}`
    : null

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
            <span className="font-serif text-lg text-foreground">PotAlot</span>
          </Link>
          {profile ? (
            <div className="flex items-center gap-1.5">
              <TrykOgTalKnap />
              <NotificationBell initialUnreadCount={unreadCount} />
              <ProfileMenu profile={profile} />
            </div>
          ) : (
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
          )}
        </div>

        {/* Række 2 — vejret som stille redaktionel linje (kun m. lokation) */}
        {vejrLinje && (
          <Link
            href="/indstillinger"
            title={weather!.summary}
            className="mt-0.5 block max-w-full truncate text-[12.5px] leading-[1.45] text-muted-foreground tabular-nums hover:text-foreground transition-colors"
          >
            {vejrLinje}
          </Link>
        )}
      </div>
    </header>
  )
}
