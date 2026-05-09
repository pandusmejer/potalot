'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Gift, Search, Send, Loader2, MoreHorizontal, Truck, MapPin,
  Check, X, Trash2, Bell,
} from 'lucide-react'
import {
  requestSwap, deleteSwapListing, updateSwapListingStatus,
  resolveSwapRequest, getSwapRequestsForListing,
  type SwapListing, type SwapRequest, type SwapStatus,
} from '@/actions/seed-swap'

const STATUS_LABEL: Record<SwapStatus, string> = {
  active: 'Aktiv',
  reserved: 'Reserveret',
  closed: 'Afsluttet',
}

const STATUS_BADGE: Record<SwapStatus, 'success' | 'warning' | 'muted'> = {
  active: 'success',
  reserved: 'warning',
  closed: 'muted',
}

function venligTid(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

interface Props {
  listing: SwapListing
  isMember: boolean
}

export function SwapListingCard({ listing, isMember }: Props) {
  const isOffer = listing.kind === 'offer'
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-2 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isOffer
                ? <Gift className="h-3.5 w-3.5 text-green-700" />
                : <Search className="h-3.5 w-3.5 text-blue-700" />}
              <p className="font-medium text-foreground">
                {listing.plantName}
                {listing.variety && <span className="text-muted-foreground"> · {listing.variety}</span>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <Badge variant={isOffer ? 'success' : 'info'} className="text-[10px]">
                {isOffer ? 'Tilbydes' : 'Søges'}
              </Badge>
              <Badge variant={STATUS_BADGE[listing.status]} className="text-[10px]">
                {STATUS_LABEL[listing.status]}
              </Badge>
              {listing.seedCount && (
                <Badge variant="muted" className="text-[10px]">{listing.seedCount} frø</Badge>
              )}
              {isOffer && listing.canSend && (
                <Badge variant="outline" className="text-[10px] gap-0.5">
                  <Truck className="h-2.5 w-2.5" />Sendes
                </Badge>
              )}
              {isOffer && listing.localSwap && (
                <Badge variant="outline" className="text-[10px] gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />Lokalt
                </Badge>
              )}
            </div>
          </div>
          {listing.isMine && <OwnerActions listing={listing} />}
        </div>

        {listing.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
        )}

        <p className="text-[10px] text-muted-foreground">
          {listing.authorLabel} · {venligTid(listing.createdAt)}
          {listing.isMine && listing.pendingRequestCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-amber-700">
              <Bell className="h-3 w-3" />
              {listing.pendingRequestCount} forespørgsel{listing.pendingRequestCount === 1 ? '' : 'ser'}
            </span>
          )}
        </p>

        {!listing.isMine && isMember && listing.status === 'active' && (
          <RequestSwapButton listing={listing} />
        )}
      </CardContent>
    </Card>
  )
}

function RequestSwapButton({ listing }: { listing: SwapListing }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await requestSwap({ listingId: listing.id, message: message.trim() || undefined })
      if ('error' in res) { setError(res.error); return }
      setSubmitted(true)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSubmitted(false); setMessage('') } }}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Send className="h-3.5 w-3.5" />
        Forespørg bytte
      </Button>
      <DialogContent>
        <DialogTitle>Forespørg bytte</DialogTitle>
        <DialogDescription>
          {listing.kind === 'offer'
            ? `Send en forespørgsel til ${listing.authorLabel} om ${listing.plantName}${listing.variety ? ' (' + listing.variety + ')' : ''}.`
            : `Send et tilbud til ${listing.authorLabel}, der søger ${listing.plantName}${listing.variety ? ' (' + listing.variety + ')' : ''}.`}
        </DialogDescription>

        {submitted ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-1">
            <p className="text-sm font-medium text-foreground">Forespørgsel sendt</p>
            <p className="text-xs text-muted-foreground">
              {listing.authorLabel} ser den i sin oversigt og kan acceptere eller afvise.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Besked (valgfrit)</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Hej, jeg vil gerne bytte med…"
                className="mt-1.5"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send forespørgsel
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function OwnerActions({ listing }: { listing: SwapListing }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    getSwapRequestsForListing(listing.id)
      .then(rs => { if (active) setRequests(rs) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, listing.id])

  function handleResolve(req: SwapRequest, decision: 'accepted' | 'declined') {
    setError(null)
    startTransition(async () => {
      const res = await resolveSwapRequest(req.id, decision)
      if ('error' in res) { setError(res.error); return }
      setRequests(prev => prev.map(r =>
        r.id === req.id ? { ...r, status: decision, resolvedAt: new Date().toISOString() } : r,
      ))
      router.refresh()
    })
  }

  function handleStatus(s: SwapStatus) {
    startTransition(async () => {
      const res = await updateSwapListingStatus(listing.id, s)
      if ('error' in res) { alert(res.error); return }
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm('Slet dette opslag og alle forespørgsler?')) return
    startTransition(async () => {
      const res = await deleteSwapListing(listing.id)
      if ('error' in res) { alert(res.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" aria-label="Indstillinger" onClick={() => setOpen(true)}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      <DialogContent className="max-w-md">
        <DialogTitle>Mit opslag: {listing.plantName}</DialogTitle>
        <DialogDescription>
          Skift status, håndtér forespørgsler eller slet opslaget.
        </DialogDescription>

        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Status</p>
            <div className="flex gap-1.5">
              {(['active', 'reserved', 'closed'] as SwapStatus[]).map(s => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={listing.status === s ? 'default' : 'outline'}
                  onClick={() => handleStatus(s)}
                  disabled={pending || listing.status === s}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Forespørgsler ({requests.filter(r => r.status === 'pending').length} ventende)
            </p>
            {loading ? (
              <p className="text-sm text-muted-foreground italic">Henter…</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ingen forespørgsler endnu.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map(r => (
                  <li key={r.id} className="rounded-lg border border-border p-2 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{r.requesterLabel}</span>
                      <Badge
                        variant={
                          r.status === 'pending' ? 'warning' :
                          r.status === 'accepted' ? 'success' :
                          r.status === 'declined' ? 'destructive' : 'muted'
                        }
                        className="text-[10px]"
                      >
                        {r.status === 'pending' ? 'Ventende'
                          : r.status === 'accepted' ? 'Accepteret'
                          : r.status === 'declined' ? 'Afvist' : 'Annulleret'}
                      </Badge>
                    </div>
                    {r.message && <p className="text-xs text-muted-foreground italic">&ldquo;{r.message}&rdquo;</p>}
                    {r.status === 'pending' && (
                      <div className="flex gap-1 pt-1">
                        <Button
                          type="button" size="sm" onClick={() => handleResolve(r, 'accepted')} disabled={pending}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accepter
                        </Button>
                        <Button
                          type="button" size="sm" variant="ghost" onClick={() => handleResolve(r, 'declined')} disabled={pending}
                        >
                          <X className="h-3.5 w-3.5" />
                          Afvis
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          </div>

          <div className="border-t border-border pt-3">
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={handleDelete} disabled={pending}>
              <Trash2 className="h-3.5 w-3.5" />
              Slet opslag
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Luk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
