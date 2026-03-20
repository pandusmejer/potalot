import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Package, Sprout, CalendarDays, StickyNote } from 'lucide-react'

interface StatusCardsProps {
  activePlants: number
  seedsInStock: number
  tasksThisWeek: number
  notesSeason: number
}

export function StatusCards({ activePlants, seedsInStock, tasksThisWeek, notesSeason }: StatusCardsProps) {
  const cards = [
    { label: 'Aktive planter', value: activePlants, icon: Sprout, color: 'text-green-600', href: '/inventory' },
    { label: 'Frø på lager', value: seedsInStock, icon: Package, color: 'text-amber-600', href: '/froebank' },
    { label: 'Opgaver denne uge', value: tasksThisWeek, icon: CalendarDays, color: 'text-blue-600', href: '/calendar' },
    { label: 'Noter i år', value: notesSeason, icon: StickyNote, color: 'text-purple-600', href: '/notes' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Link key={card.label} href={card.href}>
          <Card className="flex items-center gap-3 hover:border-primary/30 transition-colors cursor-pointer">
            <div className={`${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
