import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Lightbulb, Users } from 'lucide-react'
import { getGroup, getGroupMembers } from '@/actions/groups'
import { GroupMembersPanel } from '@/components/grupper/group-members-panel'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params
  const me = await getCurrentUser()
  if (!me) notFound()

  const [group, members] = await Promise.all([
    getGroup(id),
    getGroupMembers(id),
  ])
  if (!group) notFound()

  // Idéer delt med denne gruppe
  const supabase = await createClient()
  const { data: groupShares } = await supabase
    .from('idea_group_shares')
    .select('idea_id, created_at, ideas!inner(id, title, description, primary_image_url, image_urls, status, target_year, tags, user_id)')
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  type SharedIdeaRow = {
    idea_id: string
    created_at: string
    ideas: {
      id: string
      title: string
      description: string | null
      primary_image_url: string | null
      image_urls: string[] | null
      status: string
      target_year: number | null
      tags: string[] | null
      user_id: string
    }
  }
  const sharedIdeas = (groupShares ?? []) as unknown as SharedIdeaRow[]

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/grupper" aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground truncate">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>
        {group.myRole === 'owner' && <Badge variant="outline" className="text-[10px]">Ejer</Badge>}
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Delte idéer ({sharedIdeas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sharedIdeas.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">
                Ingen idéer delt med gruppen endnu. Gå til <Link href="/idetavle" className="underline">idétavlen</Link> og del en idé med gruppen.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {sharedIdeas.map(s => {
                  const cover = s.ideas.primary_image_url ?? (s.ideas.image_urls ?? [])[0]
                  return (
                    <Card key={s.idea_id} className="overflow-hidden">
                      <div className="aspect-[3/2] bg-pattern-botanical bg-secondary/20 flex items-center justify-center overflow-hidden">
                        {cover ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={cover} alt={s.ideas.title} className="w-full h-full object-cover" />
                        ) : (
                          <Lightbulb className="h-8 w-8 text-muted-foreground/40" />
                        )}
                      </div>
                      <CardContent className="space-y-1 pt-2">
                        <p className="font-medium text-sm text-foreground line-clamp-1">{s.ideas.title}</p>
                        {s.ideas.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{s.ideas.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Medlemmer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GroupMembersPanel
              groupId={group.id}
              groupName={group.name}
              initialMembers={members}
              myUserId={me.id}
              myRole={group.myRole}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
