'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck, X, Loader2 } from 'lucide-react'
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  syncTaskReminders,
  type Notification,
} from '@/actions/notifications'
import { cn } from '@/lib/utils'

// Påmindelses-sync er idempotent (dedup pr. opgave/dag) — en gang pr.
// halve time er rigeligt. Throttlen bor i localStorage så navigationer
// og genindlæsninger ikke udløser en DB-write hver gang.
const SYNC_THROTTLE_MS = 30 * 60 * 1000
const SYNC_STORAGE_KEY = 'potalot-reminder-sync-at'

interface Props {
  initialUnreadCount: number
}

function venligTid(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'lige nu'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}t`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export function NotificationBell({ initialUnreadCount }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [loading, setLoading] = useState(false)

  // Generér opgave-påmindelser i baggrunden (flyttet fra Topbarens render-sti):
  // best-effort, throttlet, og badge opdateres bagefter hvis der kom nye.
  useEffect(() => {
    const last = Number(localStorage.getItem(SYNC_STORAGE_KEY) ?? 0)
    if (Date.now() - last < SYNC_THROTTLE_MS) return
    localStorage.setItem(SYNC_STORAGE_KEY, String(Date.now()))
    syncTaskReminders()
      .then(() => getUnreadCount())
      .then(count => setUnreadCount(count))
      .catch(() => {})
  }, [])

  // Hent når dropdown'en åbnes
  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    getMyNotifications()
      .then(rows => {
        if (!active) return
        setNotifications(rows)
        setUnreadCount(rows.filter(n => !n.isRead).length)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open])

  // Luk ved klik udenfor
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-notification-root]')) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function handleClick(n: Notification) {
    if (!n.isRead) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
      setUnreadCount(c => Math.max(0, c - 1))
      markNotificationRead(n.id).catch(() => {})
    }
    setOpen(false)
    router.push(n.link)
  }

  function handleDelete(n: Notification, e: React.MouseEvent) {
    e.stopPropagation()
    setNotifications(prev => prev.filter(x => x.id !== n.id))
    if (!n.isRead) setUnreadCount(c => Math.max(0, c - 1))
    deleteNotification(n.id).catch(() => {})
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const res = await markAllNotificationsRead()
      if ('ok' in res) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    })
  }

  return (
    <div className="relative" data-notification-root>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifikationer${unreadCount > 0 ? ` (${unreadCount} ulæste)` : ''}`}
        // Neutralt interaktionselement, ikke en alarm (Annas retning 13/7):
        // normal transparent + ikon #4F583F, hover salvie #E5E7D8 + ikon
        // #465038, pressed lidt dybere. INGEN rød hover.
        className="relative bg-transparent text-[#4F583F] hover:bg-[#E5E7D8] hover:text-[#465038] active:bg-[#D1D8C0] [&_svg]:size-[18px]"
      >
        <Bell />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-semibold flex items-center justify-center px-1"
            style={{ background: '#B5602F', color: '#FFF8EE' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-border bg-card shadow-lg overflow-hidden z-40">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">Notifikationer</p>
            {notifications.some(n => !n.isRead) && (
              <Button
                type="button" variant="ghost" size="sm" className="h-7 text-[10px] gap-1"
                onClick={handleMarkAllRead} disabled={pending}
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                Markér alle læst
              </Button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground italic px-3 py-6 text-center">Henter…</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground italic px-3 py-6 text-center">
                Ingen notifikationer endnu.
              </p>
            ) : (
              <ul>
                {notifications.map(n => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        'group w-full text-left px-3 py-2.5 hover:bg-accent/30 transition-colors flex items-start gap-2 border-b border-border last:border-0',
                        !n.isRead && 'bg-primary/5',
                      )}
                    >
                      <span className={cn(
                        'mt-1.5 h-2 w-2 rounded-full shrink-0',
                        n.isRead ? 'bg-transparent' : 'bg-primary',
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !n.isRead && 'font-medium', 'text-foreground')}>{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{venligTid(n.createdAt)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(n, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background/50"
                        aria-label="Slet notifikation"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
