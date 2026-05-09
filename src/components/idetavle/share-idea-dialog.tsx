'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Share2, X, Loader2 } from 'lucide-react'
import {
  shareIdeaByUsername, unshareIdea, getShareRecipients,
  shareIdeaWithGroup, unshareIdeaFromGroup, getGroupSharesForIdea,
  type ShareRecipient, type IdeaGroupShare,
} from '@/actions/idea-shares'
import { getMyGroups, type UserGroup } from '@/actions/groups'

interface Props {
  ideaId: string
  ideaTitle: string
  initialCount: number
}

export function ShareIdeaDialog({ ideaId, ideaTitle, initialCount }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Person-deling
  const [username, setUsername] = useState('')
  const [recipients, setRecipients] = useState<ShareRecipient[]>([])

  // Gruppe-deling
  const [myGroups, setMyGroups] = useState<UserGroup[]>([])
  const [groupShares, setGroupShares] = useState<IdeaGroupShare[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    Promise.all([
      getShareRecipients(ideaId),
      getGroupSharesForIdea(ideaId),
      getMyGroups(),
    ])
      .then(([rs, gs, gr]) => {
        if (!active) return
        setRecipients(rs)
        setGroupShares(gs)
        setMyGroups(gr)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, ideaId])

  function handleSharePerson(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const res = await shareIdeaByUsername(ideaId, username)
      if ('error' in res) { setError(res.error); return }
      setRecipients(prev => [...prev, res.recipient])
      setUsername('')
      setInfo(`Delt med ${res.recipient.label}.`)
      router.refresh()
    })
  }

  function handleShareGroup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!selectedGroupId) {
      setError('Vælg en gruppe')
      return
    }
    const group = myGroups.find(g => g.id === selectedGroupId)
    startTransition(async () => {
      const res = await shareIdeaWithGroup(ideaId, selectedGroupId)
      if ('error' in res) { setError(res.error); return }
      if (group) {
        setGroupShares(prev => [...prev, { groupId: group.id, groupName: group.name }])
      }
      setSelectedGroupId('')
      setInfo(`Delt med ${group?.name ?? 'gruppe'}.`)
      router.refresh()
    })
  }

  function handleUnsharePerson(r: ShareRecipient) {
    if (!confirm(`Fjern deling med ${r.label}?`)) return
    setError(null); setInfo(null)
    startTransition(async () => {
      const res = await unshareIdea(ideaId, r.userId)
      if ('error' in res) { setError(res.error); return }
      setRecipients(prev => prev.filter(x => x.userId !== r.userId))
      router.refresh()
    })
  }

  function handleUnshareGroup(g: IdeaGroupShare) {
    if (!confirm(`Fjern deling med ${g.groupName}?`)) return
    setError(null); setInfo(null)
    startTransition(async () => {
      const res = await unshareIdeaFromGroup(ideaId, g.groupId)
      if ('error' in res) { setError(res.error); return }
      setGroupShares(prev => prev.filter(x => x.groupId !== g.groupId))
      router.refresh()
    })
  }

  const sharedGroupIds = new Set(groupShares.map(g => g.groupId))
  const availableGroups = myGroups.filter(g => !sharedGroupIds.has(g.id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          {initialCount > 0 ? `Delt med ${initialCount}` : 'Del'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Del &ldquo;{ideaTitle}&rdquo;</DialogTitle>
        <DialogDescription>
          Modtagere kan se idéen, men ikke ændre den.
        </DialogDescription>

        <Tabs defaultValue="person" className="space-y-3">
          <TabsList>
            <TabsTrigger value="person">Person</TabsTrigger>
            <TabsTrigger value="group">Gruppe</TabsTrigger>
          </TabsList>

          <TabsContent value="person" className="space-y-3">
            <form onSubmit={handleSharePerson} className="space-y-2">
              <Label>Brugernavn</Label>
              <div className="flex gap-2">
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="fx. anna_g"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button type="submit" disabled={pending || username.trim().length < 3}>
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Del
                </Button>
              </div>
            </form>

            <div className="border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Delt med personer
              </p>
              {loading ? (
                <p className="text-sm text-muted-foreground italic">Henter…</p>
              ) : recipients.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Endnu ikke delt med nogen personer.</p>
              ) : (
                <ul className="space-y-1.5">
                  {recipients.map(r => (
                    <li key={r.userId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-foreground">{r.label}</span>
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleUnsharePerson(r)} disabled={pending}
                        aria-label={`Fjern deling med ${r.label}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="group" className="space-y-3">
            {myGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Du er ikke medlem af nogen grupper endnu. Opret en på <a href="/grupper" className="underline">/grupper</a>.
              </p>
            ) : (
              <form onSubmit={handleShareGroup} className="space-y-2">
                <Label>Vælg gruppe</Label>
                <div className="flex gap-2">
                  <select
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                  >
                    <option value="">— vælg gruppe —</option>
                    {availableGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <Button type="submit" disabled={pending || !selectedGroupId}>
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Del
                  </Button>
                </div>
              </form>
            )}

            <div className="border-t border-border pt-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Delt med grupper
              </p>
              {loading ? (
                <p className="text-sm text-muted-foreground italic">Henter…</p>
              ) : groupShares.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Endnu ikke delt med nogen grupper.</p>
              ) : (
                <ul className="space-y-1.5">
                  {groupShares.map(g => (
                    <li key={g.groupId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-foreground">{g.groupName}</span>
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleUnshareGroup(g)} disabled={pending}
                        aria-label={`Fjern deling med ${g.groupName}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && !error && <p className="text-sm text-muted-foreground">{info}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Luk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
