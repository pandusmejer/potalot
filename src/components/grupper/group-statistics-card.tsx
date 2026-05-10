import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, Sprout, MessageSquare, Image as ImageIcon, Gift, TrendingUp, Trophy } from 'lucide-react'
import type { GroupStatistics } from '@/actions/group-content'

interface Props {
  stats: GroupStatistics
  /** Skjul sorter-/forum-relaterede tal hvis det er en privat gruppe */
  isInterest: boolean
}

export function GroupStatisticsCard({ stats, isInterest }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Statistik
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Stat icon={<Users className="h-4 w-4 text-primary" />} value={stats.members} label="medlem" pluralLabel="medlemmer" />
          {isInterest && (
            <Stat icon={<Sprout className="h-4 w-4 text-green-700" />} value={stats.varieties} label="sort" pluralLabel="sorter" />
          )}
          {isInterest && (
            <Stat icon={<MessageSquare className="h-4 w-4 text-blue-700" />} value={stats.forumPosts} label="forum-opslag" pluralLabel="forum-opslag" />
          )}
          {isInterest && stats.forumReplies > 0 && (
            <Stat icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} value={stats.forumReplies} label="svar" pluralLabel="svar" />
          )}
          <Stat icon={<Gift className="h-4 w-4 text-amber-700" />} value={stats.swapListingsActive} label="aktivt frøbytte" pluralLabel="aktive frøbytter" />
          {stats.imagesShared > 0 && (
            <Stat icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />} value={stats.imagesShared} label="billede" pluralLabel="billeder" />
          )}
        </div>

        {(stats.activityLast7Days > 0 || stats.topContributor) && (
          <div className="border-t border-border pt-3 space-y-2">
            {stats.activityLast7Days > 0 && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-700" />
                <span>{stats.activityLast7Days} nye aktiviteter de sidste 7 dage</span>
              </p>
            )}
            {stats.topContributor && stats.topContributor.count >= 3 && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 flex-wrap">
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                <span>Mest aktiv 30 dage:</span>
                <Badge variant="muted" className="text-[10px]">
                  {stats.topContributor.label} · {stats.topContributor.count} bidrag
                </Badge>
              </p>
            )}
          </div>
        )}

        {stats.swapsCompleted > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {stats.swapsCompleted} frøbytte{stats.swapsCompleted === 1 ? '' : 'r'} gennemført siden start.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ icon, value, label, pluralLabel }: { icon: React.ReactNode; value: number; label: string; pluralLabel: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 space-y-0.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-lg font-semibold text-foreground">{value}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{value === 1 ? label : pluralLabel}</p>
    </div>
  )
}
