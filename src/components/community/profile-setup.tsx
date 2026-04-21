'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { oprettCommunityProfile } from '@/actions/community'
import { Users } from 'lucide-react'

/**
 * Vises når bruger ikke har en community-profil endnu.
 * Opret profil er en aktiv handling — ingen auto-indmelding.
 */
export function ProfileSetup() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!displayName.trim()) {
      setError('Du skal vælge et navn andre kan se dig under')
      return
    }

    startTransition(async () => {
      const result = await oprettCommunityProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        location_general: location.trim() || undefined,
      })

      if ('error' in result) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Card className="max-w-xl">
      <CardContent>
        <div className="flex items-start gap-3 mb-5">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-foreground">Vil du være med i community?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Når du opretter planter, kan du blive inviteret til at se og dele med andre
              der dyrker samme sorter. Du kan altid sige nej til invitationer — intet sker
              automatisk.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Navn *</label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="fx. Rasmus fra Østjylland"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Det navn andre kan se dig under.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lidt om dig (valgfrit)</label>
            <Textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="fx. 'Nybegynder med drivhus og højbede' eller 'Dyrker mest chili og tomater'"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hvor dyrker du? (valgfrit)</label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="fx. Østjylland, København, Sønderjylland"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kun regionen — ingen præcis adresse.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Opretter…' : 'Opret profil'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
