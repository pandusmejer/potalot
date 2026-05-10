import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Lightbulb, Users, MessageCircle, MessagesSquare, Gift, ListChecks, Sprout, BookOpen, Image as ImageIcon, Lock, Globe } from 'lucide-react'
import { getGroup, getGroupMembers } from '@/actions/groups'
import { getChatMessages } from '@/actions/group-chat'
import { getPendingJoinRequests } from '@/actions/group-invitations'
import { getForumPosts } from '@/actions/group-forum'
import { ForumList } from '@/components/grupper/forum-list'
import { CreateForumPostDialog } from '@/components/grupper/create-forum-post-dialog'
import { getSwapListings } from '@/actions/seed-swap'
import { SwapListingsPanel } from '@/components/grupper/swap-listings-panel'
import { getGuidesForGroup, getGroupImages } from '@/actions/group-content'
import { GroupGuidesTab } from '@/components/grupper/group-guides-tab'
import { GroupImagesTab } from '@/components/grupper/group-images-tab'
import { getGroupVarieties } from '@/actions/group-varieties'
import { VarietiesTab } from '@/components/grupper/varieties-tab'
import { getPendingReports, getMyBlockedUserIds } from '@/actions/moderation'
import { markGroupNotificationsRead } from '@/actions/notifications'
import { GroupSettingsDialog } from '@/components/grupper/group-settings-dialog'
import { ReportsPanel } from '@/components/grupper/reports-panel'
import { GroupMembersPanel } from '@/components/grupper/group-members-panel'
import { JoinGroupButton } from '@/components/grupper/join-group-button'
import { ChatPanel } from '@/components/grupper/chat-panel'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { TAG_LABEL_BY_ID, VISIBILITY_LABEL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params
  const me = await getCurrentUser()
  if (!me) notFound()

  const group = await getGroup(id)
  if (!group) notFound()

  const isMember = group.myRole !== null
  const isInterest = group.groupType === 'interest'
  const headlinePlant = group.focusPlants[0]
  const headlineTagLabel = !headlinePlant && group.tags.length > 0
    ? TAG_LABEL_BY_ID[group.tags[0]]
    : null

  // Hvis ikke-medlem ser en lukket interessegruppe: vis kun overblik
  if (!isMember) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/grupper/udforsk" aria-label="Tilbage">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-serif text-foreground truncate">{group.name}</h1>
              <Badge variant="muted" className="text-[10px]">Interesse</Badge>
              {headlinePlant && (
                <Badge variant="success" className="text-[10px]">{headlinePlant}</Badge>
              )}
              {headlineTagLabel && (
                <Badge variant="outline" className="text-[10px]">{headlineTagLabel}</Badge>
              )}
              <Badge variant={group.visibility === 'open' ? 'success' : 'outline'} className="text-[10px]">
                {VISIBILITY_LABEL[group.visibility]}
              </Badge>
            </div>
            {(group.tags.length > 0 || group.focusPlants.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {group.focusPlants.slice(headlinePlant ? 1 : 0).map(p => (
                  <Badge key={p} variant="success" className="text-[9px]">{p}</Badge>
                ))}
                {group.tags.slice(headlineTagLabel ? 1 : 0).map(t => (
                  <Badge key={t} variant="muted" className="text-[9px]">{TAG_LABEL_BY_ID[t] ?? t}</Badge>
                ))}
              </div>
            )}
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
            )}
          </div>
          <JoinGroupButton groupId={group.id} visibility={group.visibility} myRole={group.myRole} />
        </div>

        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5 inline-block mr-1" />
              {group.memberCount} medlem{group.memberCount === 1 ? '' : 'mer'}
            </p>
            {group.visibility === 'closed' ? (
              <p className="text-sm text-muted-foreground italic">
                Lukket gruppe — anmod om adgang for at se forum og indhold.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Deltag i gruppen for at se forum, sorter og frøbytte.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Medlem — vis fuld view med faner pr. gruppetype
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

  const isOwner = group.myRole === 'owner'
  const [rawMembers, rawChatMessages, pendingRequests, rawForumPosts, rawSwapListings, pendingReports, blockedIds, groupGuides, groupImages, groupVarieties] = await Promise.all([
    getGroupMembers(id),
    !isInterest ? getChatMessages(id) : Promise.resolve([]),
    isOwner ? getPendingJoinRequests(id) : Promise.resolve([]),
    isInterest ? getForumPosts({ groupId: id }) : Promise.resolve([]),
    getSwapListings({ groupId: id }),
    isOwner ? getPendingReports(id) : Promise.resolve([]),
    getMyBlockedUserIds(),
    isInterest ? getGuidesForGroup(id) : Promise.resolve([]),
    isInterest ? getGroupImages(id) : Promise.resolve([]),
    isInterest ? getGroupVarieties(id) : Promise.resolve([]),
  ])

  // Filtrér blokerede brugeres indhold væk i visningen
  const members = rawMembers
  const chatMessages = rawChatMessages.filter(m => !blockedIds.has(m.userId))
  const forumPosts = rawForumPosts.filter(p => !blockedIds.has(p.userId))
  const swapListings = rawSwapListings.filter(l => !blockedIds.has(l.userId))

  // Markér gruppens notifikationer læst når brugeren ser indholdet
  // (kun for medlemmer; ikke-medlemmer ser uanset kun overblik)
  if (isMember) {
    markGroupNotificationsRead(id).catch(() => {})
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/grupper" aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground truncate">{group.name}</h1>
            <Badge variant="muted" className="text-[10px]">
              {isInterest ? 'Interesse' : 'Privat'}
            </Badge>
            {headlinePlant && (
              <Badge variant="success" className="text-[10px]">{headlinePlant}</Badge>
            )}
            {headlineTagLabel && (
              <Badge variant="outline" className="text-[10px]">{headlineTagLabel}</Badge>
            )}
            {isInterest && (
              <Badge variant={group.visibility === 'open' ? 'success' : 'outline'} className="text-[10px]">
                {VISIBILITY_LABEL[group.visibility]}
              </Badge>
            )}
            {group.myRole === 'owner' && <Badge variant="outline" className="text-[10px]">Ejer</Badge>}
          </div>
          {isInterest && (group.tags.length > 0 || group.focusPlants.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {group.focusPlants.slice(headlinePlant ? 1 : 0).map(p => (
                <Badge key={p} variant="success" className="text-[9px]">{p}</Badge>
              ))}
              {group.tags.slice(headlineTagLabel ? 1 : 0).map(t => (
                <Badge key={t} variant="muted" className="text-[9px]">{TAG_LABEL_BY_ID[t] ?? t}</Badge>
              ))}
            </div>
          )}
          {group.description && (
            <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
          )}
        </div>
        {isOwner && (
          <GroupSettingsDialog
            groupId={group.id}
            groupType={group.groupType}
            initial={{
              name: group.name,
              description: group.description,
              rules: group.rules,
              visibility: group.visibility,
              tags: group.tags,
              focusPlants: group.focusPlants,
            }}
          />
        )}
      </div>

      <Tabs defaultValue="overblik" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overblik">Overblik</TabsTrigger>
          {isInterest ? (
            <>
              <TabsTrigger value="forum">Forum</TabsTrigger>
              <TabsTrigger value="sorter">Sorter</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="froebytte">Frøbytte</TabsTrigger>
              <TabsTrigger value="billeder">Billeder</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="ideer">Idéer</TabsTrigger>
              <TabsTrigger value="oenskeliste" disabled>Ønskeliste</TabsTrigger>
              <TabsTrigger value="opgaver" disabled>Opgaver</TabsTrigger>
              <TabsTrigger value="froebytte">Frøbytte</TabsTrigger>
            </>
          )}
          <TabsTrigger value="medlemmer">Medlemmer ({group.memberCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="overblik">
          {group.rules && (
            <Card className="mb-3 bg-amber-50/40 border-amber-200">
              <CardHeader>
                <CardTitle className="text-base">Grupperegler</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{group.rules}</p>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center gap-2">
                  {isInterest ? <Globe className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-primary" />}
                  <p className="text-sm font-medium text-foreground">
                    {isInterest ? 'Interessegruppe' : 'Privat gruppe'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isInterest
                    ? 'For brugere der deler en passion for et emne. Forum, sorter, frøbytte og billeder.'
                    : 'For familie, venner eller dem du allerede kender. Chat, idéer, ønskeliste, opgaver og frøbytte.'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">{group.memberCount} medlem{group.memberCount === 1 ? '' : 'mer'}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Klik &ldquo;Medlemmer&rdquo;-fanen for at se hvem og {group.myRole === 'owner' ? 'invitere flere.' : 'forlade gruppen.'}
                </p>
              </CardContent>
            </Card>
          </div>
          {/* Placeholder-bokse for tabs der kommer senere */}
          <div className="mt-3 grid gap-2">
            {isInterest ? null : (
              <>
                <PlaceholderCard icon={<ListChecks className="h-4 w-4" />} title="Ønskeliste" desc="Fælles ønskeliste over frø og planter gruppen vil dyrke — kommer snart." />
                <PlaceholderCard icon={<ListChecks className="h-4 w-4" />} title="Opgaver" desc="Fælles opgaver gruppen koordinerer — kommer snart." />
              </>
            )}
          </div>
        </TabsContent>

        {isInterest && (
          <TabsContent value="forum">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="flex items-center gap-2">
                    <MessagesSquare className="h-4 w-4" />
                    Forum ({forumPosts.length})
                  </CardTitle>
                  <CreateForumPostDialog groupId={group.id} />
                </div>
              </CardHeader>
              <CardContent>
                <ForumList posts={forumPosts} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isInterest && (
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChatPanel
                  groupId={group.id}
                  groupName={group.name}
                  messages={chatMessages}
                  myUserId={me.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isInterest && (
          <TabsContent value="ideer">
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
          </TabsContent>
        )}

        {isInterest && (
          <TabsContent value="sorter">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-4 w-4" />
                  Sorter ({groupVarieties.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VarietiesTab groupId={group.id} varieties={groupVarieties} isMember={isMember} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isInterest && (
          <TabsContent value="guides">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Guides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GroupGuidesTab guides={groupGuides} focusPlants={group.focusPlants} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isInterest && (
          <TabsContent value="billeder">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Billeder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GroupImagesTab groupId={group.id} images={groupImages} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="froebytte">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Frøbytte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SwapListingsPanel
                groupId={group.id}
                listings={swapListings}
                isMember={isMember}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medlemmer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Medlemmer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isOwner && pendingReports.length > 0 && (
                  <ReportsPanel groupId={group.id} initial={pendingReports} />
                )}
                <GroupMembersPanel
                  groupId={group.id}
                  groupName={group.name}
                  initialMembers={members}
                  myUserId={me.id}
                  myRole={group.myRole ?? 'member'}
                  pendingRequests={pendingRequests}
                  initialBlockedIds={Array.from(blockedIds)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PlaceholderCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-border bg-muted/20">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
