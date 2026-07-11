import Link from 'next/link'
import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileMenu } from './profile-menu'
import { NotificationBell } from './notification-bell'
import { WeatherChip } from './weather-chip'
import { getUnreadCount } from '@/actions/notifications'
import { getGardenWeather } from '@/actions/weather'
import type { Profile } from '@/lib/types'

export async function Topbar({ profile }: { profile: Profile | null }) {
  const [unreadCount, weather] = profile
    ? await Promise.all([getUnreadCount(), getGardenWeather()])
    : [0, null]
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
      <div className="relative mx-auto flex w-full max-w-[480px] items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          <span className="font-serif text-xl text-foreground">PotAlot</span>
        </Link>
        {profile ? (
          <div className="flex items-center gap-2">
            <WeatherChip weather={weather} />
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
    </header>
  )
}
