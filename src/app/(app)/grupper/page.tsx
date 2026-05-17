import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { PageHero } from '@/components/ui/page-hero'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateGroupDialog } from '@/components/grupper/create-group-dialog'
import { getMyGroups } from '@/actions/groups'
import { getUnreadCountsByGroup } from '@/actions/notifications'
import { TAG_LABEL_BY_ID } from '@/lib/constants'
import { Users, ArrowRight, Lock, Globe, Compass, Sprout, Bell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GrupperPage() {
  const [groups, unreadByGroup] = await Promise.all([
    getMyGroups(),
    getUnreadCountsByGroup(),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHero
        tone="sun"
        kicker="Sammen"
        title="Mine grupper"
        subtitle="Private grupper og interessegrupper du er medlem af."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/grupper/udforsk">
                <Compass className="h-4 w-4" />
                Udforsk
              </Link>
            </Button>
            <CreateGroupDialog />
          </>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Ingen grupper endnu"
          description="Opret en privat gruppe til familie/venner, eller udforsk interessegrupper for emner du dyrker."
        />
      ) : (
        <div className="space-y-2">
          {groups.map(g => {
            const headlinePlant = g.focusPlants[0]
            const headlineTag = !headlinePlant && g.tags.length > 0 ? TAG_LABEL_BY_ID[g.tags[0]] : null
            const unread = unreadByGroup.get(g.id) ?? 0
            return (
              <Card key={g.id} className={unread > 0 ? 'ring-2 ring-primary/30' : undefined}>
                <Link
                  href={`/grupper/${g.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors rounded-2xl"
                >
                  <div className="relative h-10 w-10 rounded-full bg-secondary/40 flex items-center justify-center shrink-0">
                    {g.groupType === 'private'
                      ? <Lock className="h-4 w-4 text-primary" />
                      : <Globe className="h-4 w-4 text-primary" />}
                    {unread > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center px-1 ring-2 ring-card"
                        aria-label={`${unread} ulæste`}
                      >
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{g.name}</p>
                      <Badge variant="muted" className="text-[10px]">
                        {g.groupType === 'private' ? 'Privat' : 'Interesse'}
                      </Badge>
                      {headlinePlant && (
                        <Badge variant="success" className="text-[10px] gap-0.5">
                          <Sprout className="h-2.5 w-2.5" />
                          {headlinePlant}
                        </Badge>
                      )}
                      {headlineTag && (
                        <Badge variant="outline" className="text-[10px]">{headlineTag}</Badge>
                      )}
                      {g.myRole === 'owner' && (
                        <Badge variant="outline" className="text-[10px]">Ejer</Badge>
                      )}
                      {unread > 0 && (
                        <Badge variant="warning" className="text-[10px] gap-0.5">
                          <Bell className="h-2.5 w-2.5" />
                          {unread} ny{unread === 1 ? '' : 'e'}
                        </Badge>
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
