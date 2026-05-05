import Link from 'next/link'
import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileMenu } from './profile-menu'
import type { Profile } from '@/lib/types'

export function Topbar({ profile }: { profile: Profile | null }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3 border-b border-border bg-card/95 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 lg:invisible">
        <Sprout className="h-5 w-5 text-primary" />
        <span className="font-serif text-xl text-foreground">PotAlot</span>
      </Link>
      {profile ? (
        <ProfileMenu profile={profile} />
      ) : (
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log ind</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/opret">Opret bruger</Link>
          </Button>
        </div>
      )}
    </header>
  )
}
