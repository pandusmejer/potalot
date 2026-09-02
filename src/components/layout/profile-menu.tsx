'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Lightbulb, Settings, LogOut, ShieldCheck } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { signOut } from '@/actions/auth'

/**
 * Sekundær menu — profil, grupper, idétavle, indstillinger.
 * Rendres i topbar som avatar-dropdown. Tilgængelig globalt.
 */
export function ProfileMenu({ profile }: { profile: Profile }) {
  const initials = profile.username
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Min profil og menu"
          className="flex items-center gap-2 rounded-full hover:bg-muted/60 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar>
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.username} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{profile.username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profil"><User className="h-4 w-4" /> Min profil</Link>
        </DropdownMenuItem>
        {/* SKJULT INDTIL VIDERE: Mine grupper + Havelandskab (fællesskabs-
            og udfordrings-funktioner). Designes og lanceres på et senere
            tidspunkt — kerneproduktet med 5 hovedmenupunkter først. */}
        <DropdownMenuItem asChild>
          <Link href="/idetavle"><Lightbulb className="h-4 w-4" /> Min idétavle</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/indstillinger"><Settings className="h-4 w-4" /> Indstillinger</Link>
        </DropdownMenuItem>
        {profile.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin"><ShieldCheck className="h-4 w-4" /> Admin</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <form action={signOut}>
          <button type="submit" className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent">
            <LogOut className="h-4 w-4" /> Log ud
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
