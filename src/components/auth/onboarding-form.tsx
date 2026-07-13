'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageUpload } from '@/components/ui/image-upload'
import { Check, X, Loader2 } from 'lucide-react'
import { updateProfile, checkUsernameAvailable } from '@/actions/profil'

interface Props {
  email: string
  /**
   * Hvis sat: profilen gemmes UDEN at sætte onboarded (så et efterfølgende
   * trin kan afslutte), og onComplete kaldes i stedet for at navigere til /.
   */
  onComplete?: () => void
}

export function OnboardingForm({ email, onComplete }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')

  // Debounced username availability check
  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { setUsernameStatus('invalid'); return }

    setUsernameStatus('checking')
    const id = setTimeout(async () => {
      const res = await checkUsernameAvailable(username)
      setUsernameStatus(res.available ? 'ok' : 'taken')
    }, 350)
    return () => clearTimeout(id)
  }, [username])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (usernameStatus !== 'ok') {
      setError('Vælg et gyldigt og ledigt brugernavn')
      return
    }

    startTransition(async () => {
      const res = await updateProfile({
        username,
        displayName: username,
        avatarUrl,
        // Afslut først onboarding efter have-opsætnings-trinnet.
        onboarded: onComplete ? false : true,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      if (onComplete) {
        onComplete()
      } else {
        router.push('/')
        router.refresh()
      }
    })
  }

  const initials = (username || email[0] || 'U').slice(0, 2).toUpperCase()

  return (
    <Card>
      <CardContent className="py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback className="text-2xl font-serif">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label className="mb-1.5 block">Profilbillede (valgfrit)</Label>
              <ImageUpload
                value={avatarUrl}
                onChange={setAvatarUrl}
                folder="profil"
                label="Vælg billede"
              />
            </div>
          </div>

          <div>
            <Label>Brugernavn *</Label>
            <div className="relative mt-1.5">
              <Input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                placeholder="fx. lise_have"
                pattern="[a-z0-9_]{3,20}"
                minLength={3}
                maxLength={20}
                required
                autoFocus
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {usernameStatus === 'ok' && <Check className="h-4 w-4 text-primary" />}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X className="h-4 w-4 text-destructive" />}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {usernameStatus === 'taken' && <span className="text-destructive">Brugernavnet er taget.</span>}
              {usernameStatus === 'invalid' && <span className="text-destructive">3–20 tegn, kun a–z, 0–9 og _.</span>}
              {usernameStatus !== 'taken' && usernameStatus !== 'invalid' && '3–20 tegn, kun a–z, 0–9 og _. Bruges i community.'}
            </p>
          </div>

          <div>
            <Label>E-mail</Label>
            <Input value={email} disabled className="mt-1.5" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending || usernameStatus !== 'ok'} className="w-full">
            {pending ? 'Gemmer…' : onComplete ? 'Videre' : 'Kom i gang'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
