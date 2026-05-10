import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sprout, Leaf, MessageSquare, Image as ImageIcon, Gift, Search, Users } from 'lucide-react'
import { getGroup } from '@/actions/groups'
import { getVariety, getVarietyMembers } from '@/actions/group-varieties'
import { getForumPosts } from '@/actions/group-forum'
import { VarietyStatusToggles } from '@/components/grupper/variety-status-toggles'
import { ForumList } from '@/components/grupper/forum-list'
import { CreateForumPostDialog } from '@/components/grupper/create-forum-post-dialog'
import { VARIETY_STATUS_LABEL } from '@/lib/varieties-shared'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string; varietyId: string }>
}

export default async function VarietyDetailPage({ params }: Props) {
  const { id, varietyId } = await params
  const [group, variety, members] = await Promise.all([
    getGroup(id),
    getVariety(varietyId),
    getVarietyMembers(varietyId),
  ])
  if (!group || !variety || variety.groupId !== id) notFound()

  const isMember = group.myRole !== null
  const taggedPosts = await getForumPosts({ groupId: id, varietyId })

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/grupper/${id}`} aria-label="Tilbage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground truncate">
          <Link href={`/grupper/${id}`} className="hover:underline">{group.name}</Link>
          {' · Sorter'}
        </p>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-start gap-4 flex-wrap">
            {variety.primaryImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={variety.primaryImageUrl} alt="" className="h-24 w-24 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-24 w-24 rounded-lg bg-secondary/40 flex items-center justify-center shrink-0">
                <Sprout className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-serif text-foreground">
                {variety.variety || variety.plantName}
              </h1>
              {variety.variety && (
                <p className="text-sm text-muted-foreground">{variety.plantName}</p>
              )}
              {variety.latinName && (
                <p className="text-xs italic text-muted-foreground/80">{variety.latinName}</p>
              )}
              {variety.description && (
                <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap">{variety.description}</p>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-foreground mb-2">Min status</p>
            <VarietyStatusToggles
              varietyId={variety.id}
              initialStatuses={variety.myStatuses}
              isMember={isMember}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistik */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Statistik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat icon={<Leaf className="h-4 w-4 text-green-700" />} value={variety.stats.growing} label="dyrker" />
            <Stat icon={<Leaf className="h-4 w-4 text-muted-foreground" />} value={variety.stats.grown} label="har dyrket" />
            <Stat icon={<Sprout className="h-4 w-4 text-blue-700" />} value={variety.stats.wantToGrow} label="vil dyrke" />
            <Stat icon={<Gift className="h-4 w-4 text-amber-700" />} value={variety.stats.hasSeed} label="har frø" />
            <Stat icon={<Search className="h-4 w-4 text-amber-700" />} value={variety.stats.seekingSeed} label="søger frø" />
            <Stat icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} value={variety.stats.posts} label="opslag" />
          </div>

          {members.length > 0 && (
            <div className="mt-4 border-t border-border pt-3 space-y-1.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Medlemmer ({members.length})</p>
              <ul className="space-y-1">
                {members.map(m => (
                  <li key={m.userId} className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-foreground">{m.label}</span>
                    {m.statuses.map(s => (
                      <Badge
                        key={s}
                        variant={s === 'soeger_froe' ? 'warning' : s === 'har_froe' ? 'success' : 'muted'}
                        className="text-[9px]"
                      >
                        {VARIETY_STATUS_LABEL[s]}
                      </Badge>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tråde tagget med denne sort */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Tråde om {variety.variety || variety.plantName} ({taggedPosts.length})
            </CardTitle>
            {isMember && (
              <CreateForumPostDialog groupId={id} initialVarietyId={variety.id} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {taggedPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Ingen tråde endnu. Vær den første til at dele en erfaring eller stille et spørgsmål.
            </p>
          ) : (
            <ForumList posts={taggedPosts} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xl font-semibold text-foreground">{value}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
