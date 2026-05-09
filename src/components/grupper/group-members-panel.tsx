'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { UserPlus, X, Loader2, LogOut } from 'lucide-react'
import { addGroupMember, removeGroupMember, leaveGroup, type GroupMember } from '@/actions/groups'
import { InviteDialog } from '@/components/grupper/invite-dialog'
import { PendingRequestsPanel } from '@/components/grupper/pending-requests-panel'
import type { JoinRequest } from '@/actions/group-invitations'

interface Props {
  groupId: string
  groupName: string
  initialMembers: GroupMember[]
  myUserId: string
  myRole: 'owner' | 'member'
  pendingRequests?: JoinRequest[]
}

export function GroupMembersPanel({ groupId, groupName, initialMembers, myUserId, myRole, pendingRequests }: Props) {
  const router = useRouter()
  const [members, setMembers] = useState<GroupMember[]>(initialMembers)
  const [username, setUsername] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isOwner = myRole === 'owner'
  const otherOwners = members.filter(m => m.role === 'owner' && m.userId !== myUserId).length

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await addGroupMember(groupId, username)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setMembers(prev => [...prev, res.member])
      setUsername('')
      router.refresh()
    })
  }

  function handleRemove(member: GroupMember) {
    if (!confirm(`Fjern ${member.label} fra gruppen?`)) return
    setError(null)
    startTransition(async () => {
      const res = await removeGroupMember(groupId, member.userId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setMembers(prev => prev.filter(m => m.userId !== member.userId))
      router.refresh()
    })
  }

  function handleLeave() {
    if (isOwner && otherOwners === 0) {
      alert('Du er eneste ejer. Slet gruppen i stedet, eller udnævn først en anden til ejer.')
      return
    }
    if (!confirm(`Forlad gruppen "${groupName}"? Du mister adgang til delte idéer her.`)) return
    setError(null)
    startTransition(async () => {
      const res = await leaveGroup(groupId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push('/grupper')
    })
  }

  return (
    <div className="space-y-3">
      {isOwner && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">Invitér medlemmer</p>
          <InviteDialog groupId={groupId} groupName={groupName} />
        </div>
      )}

      {isOwner && pendingRequests && pendingRequests.length > 0 && (
        <PendingRequestsPanel groupId={groupId} initial={pendingRequests} />
      )}

      {isOwner && (
        <form onSubmit={handleAdd} className="space-y-2 border-t border-border pt-3">
          <Label className="text-xs">Eller tilføj direkte via brugernavn</Label>
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="fx. anna_g"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" disabled={pending || username.trim().length < 3}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Tilføj
            </Button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Medlemmer ({members.length})
        </p>
        <ul className="space-y-1.5">
          {members.map(m => (
            <li key={m.userId} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-foreground">{m.label}</span>
                {m.role === 'owner' && (
                  <Badge variant="outline" className="text-[10px]">Ejer</Badge>
                )}
                {m.userId === myUserId && (
                  <Badge variant="muted" className="text-[10px]">Dig</Badge>
                )}
              </div>
              {isOwner && m.userId !== myUserId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(m)}
                  disabled={pending}
                  aria-label={`Fjern ${m.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={handleLeave} disabled={pending}>
          <LogOut className="h-3.5 w-3.5" />
          Forlad gruppe
        </Button>
      </div>
    </div>
  )
}
