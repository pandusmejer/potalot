import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { MOCK_GROUPS, MOCK_MEMBERSHIPS, MOCK_INVENTORY, MOCK_PLANTS } from '@/lib/mock-data'
import { Users, Sprout, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// TODO (database): Supabase
export default function GrupperPage() {
  // Mine grupper (hvor jeg er medlem og joinedAt er sat)
  const mineGruppeIds = new Set(
    MOCK_MEMBERSHIPS
      .filter(m => m.joinedAt && !m.declinedAt)
      .map(m => m.groupId)
  )
  const mineGrupper = MOCK_GROUPS.filter(g => mineGruppeIds.has(g.id))

  // Foreslåede grupper baseret på min frøbank/planter
  const navne = new Set([
    ...MOCK_INVENTORY.map(i => i.name.toLowerCase()),
    ...MOCK_PLANTS.map(p => p.name.toLowerCase()),
  ])
  const foreslaaede = MOCK_GROUPS.filter(g =>
    !mineGruppeIds.has(g.id) &&
    (g.linkedPlantName ? navne.has(g.linkedPlantName.toLowerCase()) : true)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Mine grupper</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let community om planter du selv dyrker. Ingen spam.
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4" />
          Opret gruppe (TODO)
        </Button>
      </div>

      {/* Mine grupper */}
      <section>
        <h2 className="font-serif text-xl text-foreground mb-3">Mine grupper</h2>
        {mineGrupper.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Ingen grupper endnu"
            description="Tjek de foreslåede nedenfor — der er sikkert noget der passer."
          />
        ) : (
          <div className="space-y-2">
            {mineGrupper.map(g => <GroupRow key={g.id} group={g} joined />)}
          </div>
        )}
      </section>

      {/* Forslag */}
      {foreslaaede.length > 0 && (
        <section>
          <h2 className="font-serif text-xl text-foreground mb-3">Foreslået til dig</h2>
          <p className="text-xs text-muted-foreground mb-2 italic">
            Baseret på din frøbank og dine aktive planter.
          </p>
          <div className="space-y-2">
            {foreslaaede.map(g => <GroupRow key={g.id} group={g} joined={false} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function GroupRow({ group, joined }: { group: typeof MOCK_GROUPS[number]; joined: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <div className="h-10 w-10 rounded-full bg-secondary/40 flex items-center justify-center shrink-0">
          {group.groupLevel === 'plant' ? (
            <Sprout className="h-5 w-5 text-primary" />
          ) : (
            <Users className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{group.title}</p>
            <Badge variant="muted" className="text-[10px]">{group.memberCount} medlemmer</Badge>
            {group.isReadOnly && <Badge variant="warning" className="text-[10px]">Read-only</Badge>}
          </div>
          {group.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{group.description}</p>
          )}
        </div>
        {joined ? (
          <Button variant="outline" size="sm" disabled>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" disabled>
            Join (TODO)
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
