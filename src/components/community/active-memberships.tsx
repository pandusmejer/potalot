import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { CommunityMembership, CommunityGroup } from '@/lib/types'

interface Props {
  memberships: Array<CommunityMembership & { group: CommunityGroup }>
}

export function ActiveMemberships({ memberships }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Dine grupper
        </CardTitle>
      </CardHeader>
      {memberships.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Endnu ingen grupper. Når du opretter planter med en aktiv community-profil,
          får du invitationer til sort-grupper.
        </p>
      ) : (
        <div className="space-y-2">
          {memberships.map(m => {
            const title = m.group.variety_name
              ? `${m.group.variety_name} (${m.group.species_name})`
              : m.group.species_name

            return (
              <div key={m.id} className="flex items-start gap-3 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.group.member_count} {m.group.member_count === 1 ? 'medlem' : 'medlemmer'}
                    {m.role === 'moderator' && ' · du er moderator'}
                    {m.group.is_read_only && ' · kun læsning'}
                  </p>
                </div>
                {m.group.is_read_only && (
                  <Badge className="bg-muted text-muted-foreground text-xs">
                    Afventer moderator
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-3 italic">
        Grupper åbnes først når der er 3+ medlemmer og en moderator.
      </p>
    </Card>
  )
}
