'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import { updateGroupSettings } from '@/actions/moderation'
import type { GroupVisibility, GroupType } from '@/actions/groups'

interface Props {
  groupId: string
  groupType: GroupType
  initial: {
    name: string
    description: string | null
    rules: string | null
    visibility: GroupVisibility
  }
}

export function GroupSettingsDialog({ groupId, groupType, initial }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description ?? '')
  const [rules, setRules] = useState(initial.rules ?? '')
  const [visibility, setVisibility] = useState<GroupVisibility>(initial.visibility)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await updateGroupSettings({
        groupId,
        name,
        description,
        rules,
        visibility: groupType === 'interest' ? visibility : undefined,
      })
      if ('error' in res) { setError(res.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-3.5 w-3.5" />
          Indstillinger
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Gruppe-indstillinger</DialogTitle>
        <DialogDescription>
          Redigér gruppens navn, beskrivelse og regler.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Navn *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="mt-1.5" />
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          <div>
            <Label>Grupperegler (valgfrit)</Label>
            <Textarea
              value={rules}
              onChange={e => setRules(e.target.value)}
              rows={5}
              placeholder="Fx.&#10;1. Hold debatten venlig.&#10;2. Ingen spam eller reklame.&#10;3. Tag billeder af dine egne planter."
              className="mt-1.5"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Vises øverst på Overblik-fanen for alle medlemmer.
            </p>
          </div>

          {groupType === 'interest' && (
            <div>
              <Label>Synlighed</Label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as GroupVisibility)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                <option value="open">Åben — alle kan se og deltage</option>
                <option value="closed">Lukket — alle kan se gruppen, men skal anmode</option>
                <option value="hidden">Skjult — kun synlig for inviterede</option>
              </select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? 'Gemmer…' : 'Gem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
