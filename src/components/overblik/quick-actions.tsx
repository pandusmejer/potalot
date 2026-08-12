import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, Sprout, CalendarDays, Plus } from 'lucide-react'

/**
 * Quick actions på Overblik.
 */
export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
        <Link href="/froebank?action=add">
          <Package className="h-5 w-5" />
          <span className="text-xs">Tilføj frø</span>
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
        <Link href="/mine-planter?action=add">
          <Sprout className="h-5 w-5" />
          <span className="text-xs">Ny plante</span>
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
        <Link href="/kalender?action=add">
          <Plus className="h-5 w-5" />
          <span className="text-xs">Ny opgave</span>
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
        <Link href="/kalender">
          <CalendarDays className="h-5 w-5" />
          <span className="text-xs">Se opgaver</span>
        </Link>
      </Button>
    </div>
  )
}
