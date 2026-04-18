import { Sprout } from 'lucide-react'
import Link from 'next/link'
import { getGardens } from '@/actions/gardens'
import { SidebarNav } from './sidebar-nav'
import { GardenSwitcher } from './garden-switcher'
import { ProfileMenu } from './profile-menu'

export async function Sidebar() {
  const gardens = await getGardens()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:border-r lg:border-border lg:bg-card lg:h-screen lg:fixed lg:left-0 lg:top-0">
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">PotAlot</span>
        </Link>
        {gardens.length > 1 && <GardenSwitcher gardens={gardens} />}
      </div>

      <SidebarNav />

      <div className="border-t border-border px-3 py-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Min profil</span>
        <ProfileMenu />
      </div>
    </aside>
  )
}
