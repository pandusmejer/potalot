import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateGroupDialog } from '@/components/grupper/create-group-dialog'
import { getMyGroups } from '@/actions/groups'
import { INTEREST_CATEGORIES } from '@/lib/constants'
import { Users, ArrowRight, Lock, Globe, Compass } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GrupperPage() {
  const groups = await getMyGroups()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Mine grupper</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Private grupper og interessegrupper du er medlem af.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/grupper/udforsk">
              <Compass className="h-4 w-4" />
              Udforsk
            </Link>
          </Button>
          <CreateGroupDialog />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Ingen grupper endnu"
          description="Opret en privat gruppe til familie/venner, eller udforsk interessegrupper for emner du dyrker."
        />
      ) : (
        <div className="space-y-2">
          {groups.map(g => {
            const cat = INTEREST_CATEGORIES.find(c => c.id === g.category)
            return (
              <Card key={g.id}>
                <Link
                  href={`/grupper/${g.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors rounded-2xl"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary/40 flex items-center justify-center shrink-0">
                    {g.groupType === 'private'
                      ? <Lock className="h-4 w-4 text-primary" />
                      : <Globe className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{g.name}</p>
                      <Badge variant="muted" className="text-[10px]">
                        {g.groupType === 'private' ? 'Privat' : 'Interesse'}
                      </Badge>
                      {cat && <Badge variant="outline" className="text-[10px]">{cat.label}</Badge>}
                      {g.myRole === 'owner' && (
                        <Badge variant="outline" className="text-[10px]">Ejer</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {g.memberCount} medlem{g.memberCount === 1 ? '' : 'mer'}
                      {g.description && ` · ${g.description}`}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
