import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Sprout, Leaf, MessageSquare, Image as ImageIcon, Gift, Search } from 'lucide-react'
import { AddVarietyDialog } from '@/components/grupper/add-variety-dialog'
import type { GroupVariety } from '@/actions/group-varieties'

interface Props {
  groupId: string
  varieties: GroupVariety[]
  isMember: boolean
}

export function VarietiesTab({ groupId, varieties, isMember }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {varieties.length === 0
            ? 'Tilføj sorter gruppen dyrker, så medlemmer kan markere status og bytte frø.'
            : `${varieties.length} sort${varieties.length === 1 ? '' : 'er'} i kataloget.`}
        </p>
        {isMember && <AddVarietyDialog groupId={groupId} />}
      </div>

      {varieties.length === 0 ? (
        <EmptyState
          icon={<Sprout className="h-8 w-8" />}
          title="Ingen sorter endnu"
          description={isMember
            ? 'Tilføj fx Jalapeño, Habanero eller andre sorter gruppen dyrker. Hvert medlem markerer sin egen status.'
            : 'Når medlemmer tilføjer sorter, kan du se dem her.'}
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {varieties.map(v => <VarietyCard key={v.id} variety={v} groupId={groupId} />)}
        </div>
      )}
    </div>
  )
}

function VarietyCard({ variety, groupId }: { variety: GroupVariety; groupId: string }) {
  const stats = variety.stats
  return (
    <Card className="overflow-hidden hover:bg-accent/20 transition-colors">
      <Link href={`/grupper/${groupId}/sorter/${variety.id}`} className="flex gap-3 p-3">
        {variety.primaryImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={variety.primaryImageUrl} alt="" className="h-20 w-20 rounded-md object-cover shrink-0" />
        ) : (
          <div className="h-20 w-20 rounded-md bg-secondary/40 flex items-center justify-center shrink-0">
            <Sprout className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground line-clamp-1">
            {variety.variety || variety.plantName}
          </p>
          {variety.variety && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">{variety.plantName}</p>
          )}
          {variety.latinName && (
            <p className="text-[10px] italic text-muted-foreground line-clamp-1">{variety.latinName}</p>
          )}
          {variety.myStatuses.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {variety.myStatuses.includes('dyrker') && <Badge variant="success" className="text-[9px]">Dyrker</Badge>}
              {variety.myStatuses.includes('har_dyrket') && <Badge variant="muted" className="text-[9px]">Har dyrket</Badge>}
              {variety.myStatuses.includes('vil_dyrke') && <Badge variant="info" className="text-[9px]">Vil dyrke</Badge>}
              {variety.myStatuses.includes('har_froe') && <Badge variant="success" className="text-[9px]">Har frø</Badge>}
              {variety.myStatuses.includes('soeger_froe') && <Badge variant="warning" className="text-[9px]">Søger frø</Badge>}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-muted-foreground">
            {stats.growing > 0 && <span className="inline-flex items-center gap-0.5"><Leaf className="h-2.5 w-2.5" />{stats.growing} dyrker</span>}
            {stats.hasSeed > 0 && <span className="inline-flex items-center gap-0.5"><Gift className="h-2.5 w-2.5" />{stats.hasSeed} har frø</span>}
            {stats.seekingSeed > 0 && <span className="inline-flex items-center gap-0.5"><Search className="h-2.5 w-2.5" />{stats.seekingSeed} søger</span>}
            {stats.posts > 0 && <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />{stats.posts}</span>}
            {stats.images > 0 && <span className="inline-flex items-center gap-0.5"><ImageIcon className="h-2.5 w-2.5" />{stats.images}</span>}
          </div>
        </div>
      </Link>
    </Card>
  )
}
