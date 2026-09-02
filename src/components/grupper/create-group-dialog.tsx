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
import { Plus, Lock, Globe } from 'lucide-react'
import { createGroup, type GroupType, type GroupVisibility } from '@/actions/groups'
import { TagPicker } from '@/components/grupper/tag-picker'
import { FocusPlantsInput } from '@/components/grupper/focus-plants-input'
import { cn } from '@/lib/utils'

export function CreateGroupDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [groupType, setGroupType] = useState<GroupType>('private')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<GroupVisibility>('hidden')
  const [tags, setTags] = useState<string[]>([])
  const [focusPlants, setFocusPlants] = useState<string[]>([])

  function handleTypeChange(t: GroupType) {
    setGroupType(t)
    setVisibility(t === 'private' ? 'hidden' : 'open')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        groupType,
        visibility,
        tags: groupType === 'interest' ? tags : undefined,
        focusPlants: groupType === 'interest' ? focusPlants : undefined,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.push(`/grupper/${res.id}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Ny gruppe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>Opret gruppe</DialogTitle>
        <DialogDescription>
          Vælg type og giv den et navn. Du kan invitere medlemmer bagefter.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 block">Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('private')}
                className={cn(
                  'rounded-xl border p-3 text-left transition',
                  groupType === 'private' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">Privat gruppe</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  For familie, venner, naboer eller andre du allerede kender.
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('interest')}
                className={cn(
                  'rounded-xl border p-3 text-left transition',
                  groupType === 'interest' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">Interessegruppe</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  For brugere der deler en passion, fx selvforsyning eller bi-venlig have.
                </p>
              </button>
            </div>
          </div>

          <div>
            <Label>Navn *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={groupType === 'private' ? 'Fx Familien Mejer' : 'Fx Permakultur i villahaven'}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={groupType === 'private'
                ? 'Hvem er gruppen for og hvad bruger I den til?'
                : 'Hvad handler gruppen om? Hvilken type indhold må forventes?'}
              rows={2}
              className="mt-1.5"
            />
          </div>

          {groupType === 'interest' && (
            <>
              <div className="border-t border-border pt-4">
                <Label className="mb-2 block">Tags</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Vælg op til 5 tags der beskriver gruppen.
                </p>
                <TagPicker value={tags} onChange={setTags} maxTags={5} />
              </div>

              <div>
                <Label className="mb-2 block">Fokusplanter (valgfrit)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Hvis gruppen handler om bestemte planter — fx Chili, Tomater, Æbletræer.
                </p>
                <FocusPlantsInput value={focusPlants} onChange={setFocusPlants} />
              </div>

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
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annullér
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? 'Opretter…' : 'Opret gruppe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
