'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserPlus, Loader2, Lock } from 'lucide-react'
import { joinOpenGroup } from '@/actions/groups'

interface Props {
  groupId: string
  visibility: 'open' | 'closed' | 'hidden'
  myRole: 'owner' | 'member' | null
}

export function JoinGroupButton({ groupId, visibility, myRole }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (myRole) {
    return (
      <Button variant="outline" size="sm" disabled>
        Medlem
      </Button>
    )
  }

  if (visibility === 'closed') {
    return (
      <Button variant="outline" size="sm" disabled>
        <Lock className="h-3.5 w-3.5" />
        Anmod om adgang
      </Button>
    )
  }

  if (visibility !== 'open') return null

  function handleJoin() {
    setError(null)
    startTransition(async () => {
      const res = await joinOpenGroup(groupId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push(`/grupper/${groupId}`)
    })
  }

  return (
    <div className="space-y-1">
      <Button type="button" size="sm" onClick={handleJoin} disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
        Deltag
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
