'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Users, Loader2, User } from 'lucide-react'
import { getChallengeEntries, type ChallengeEntry } from '@/actions/challenges'

interface Props {
  challengeId: string
  challengeTitle: string
  entryCount: number
}

/**
 * Galleri-dialog: vis alle bidrag for en challenge (sæson eller gruppe).
 * Henter entries lazy ved første åbning af dialogen så vi ikke loader
 * data for alle challenges på siden.
 *
 * Hver entry vises som card med billede (hvis tilgængeligt), forfatter-
 * label og caption.
 */
export function ChallengeGalleryDialog({
  challengeId, challengeTitle, entryCount,
}: Props) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ChallengeEntry[] | null>(null)
  const [loading, setLoading] = useState(false)

  // Hent entries når dialogen åbnes første gang
  useEffect(() => {
    if (open && entries === null) {
      setLoading(true)
      getChallengeEntries(challengeId)
        .then(data => setEntries(data))
        .finally(() => setLoading(false))
    }
  }, [open, entries, challengeId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={entryCount === 0}>
          <Users className="h-3.5 w-3.5" />
          Se alle {entryCount}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>{challengeTitle}</DialogTitle>
        <DialogDescription>
          {entryCount === 0
            ? 'Ingen bidrag endnu.'
            : `${entryCount} bidrag fra andre deltagere.`}
        </DialogDescription>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && entries && entries.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            Vær den første til at bidrage til denne challenge.
          </p>
        )}

        {!loading && entries && entries.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EntryCard({ entry }: { entry: ChallengeEntry }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {entry.imageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={entry.imageUrl}
          alt=""
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="font-medium text-foreground">{entry.authorLabel}</span>
          <span>·</span>
          <span>{formatDate(entry.createdAt)}</span>
        </div>
        {entry.caption && (
          <p className="text-sm text-foreground/90 leading-relaxed">
            {entry.caption}
          </p>
        )}
        {!entry.caption && !entry.imageUrl && (
          <p className="text-xs text-muted-foreground italic">
            Bidrag uden tekst eller billede.
          </p>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  })
}
