'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CreateSwapListingDialog } from '@/components/grupper/create-swap-listing-dialog'
import { SwapListingCard } from '@/components/grupper/swap-listing-card'
import type { SwapListing, SwapKind } from '@/actions/seed-swap'

interface Props {
  groupId: string
  listings: SwapListing[]
  isMember: boolean
}

export function SwapListingsPanel({ groupId, listings, isMember }: Props) {
  const [activeKind, setActiveKind] = useState<SwapKind | 'all'>('all')

  const filtered = activeKind === 'all'
    ? listings
    : listings.filter(l => l.kind === activeKind)

  const offerCount = listings.filter(l => l.kind === 'offer').length
  const wantedCount = listings.filter(l => l.kind === 'wanted').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Tabs value={activeKind} onValueChange={v => setActiveKind(v as SwapKind | 'all')}>
          <TabsList>
            <TabsTrigger value="all">Alle ({listings.length})</TabsTrigger>
            <TabsTrigger value="offer">Tilbydes ({offerCount})</TabsTrigger>
            <TabsTrigger value="wanted">Søges ({wantedCount})</TabsTrigger>
          </TabsList>
          {/* Indhold renderes herunder uafhængigt af value */}
          <TabsContent value="all" />
          <TabsContent value="offer" />
          <TabsContent value="wanted" />
        </Tabs>
        {isMember && <CreateSwapListingDialog groupId={groupId} />}
      </div>

      {!isMember && (
        <p className="text-xs text-muted-foreground italic">
          Kun medlemmer kan oprette opslag og forespørge bytte.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-4 text-center">
          Ingen frøbytte-opslag endnu. {isMember && 'Vær den første til at oprette et.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(l => (
            <SwapListingCard key={l.id} listing={l} isMember={isMember} />
          ))}
        </div>
      )}
    </div>
  )
}
