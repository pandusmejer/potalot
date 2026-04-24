import Link from 'next/link'
import { Sprout } from 'lucide-react'
import { ProfileMenu } from './profile-menu'
import type { Profile } from '@/lib/types'

/**
 * Mobile + desktop topbar. Profil-menu i højre side.
 * På mobil vises logo til venstre. På desktop er logo i sidebar, så topbar er tom til venstre.
 */
export function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3 border-b border-border bg-card/95 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 lg:invisible">
        <Sprout className="h-5 w-5 text-primary" />
        <span className="font-serif text-xl text-foreground">PotAlot</span>
      </Link>
      <ProfileMenu profile={profile} />
    </header>
  )
}
