import { Sprout } from 'lucide-react'
import Link from 'next/link'
import { GardenSwitcher } from './garden-switcher'
import { ProfileMenu } from './profile-menu'
import { getGardens } from '@/actions/gardens'

export async function Header() {
  const gardens = await getGardens()

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-30">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Sprout className="h-5 w-5 text-primary" />
        <span className="font-bold text-foreground">PotAlot</span>
      </Link>

      <div className="flex items-center gap-2">
        {gardens.length > 1 && <GardenSwitcher gardens={gardens} />}
        <ProfileMenu />
      </div>
    </header>
  )
}
