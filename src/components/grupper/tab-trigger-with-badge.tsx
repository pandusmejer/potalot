'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TabsTrigger } from '@/components/ui/tabs'
import {
  markGroupCategoryNotificationsRead,
  type NotificationTabCategory,
} from '@/actions/notifications'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  label: string
  /** Antal ulæste der hører til denne fane (vises som rød badge) */
  unreadCount: number
  /** Kategori-key der bruges når notifikationer markeres læst */
  category?: NotificationTabCategory
  groupId: string
  /** Valgfri ekstra suffix, fx '(12)' for total-tæller */
  countSuffix?: string
  disabled?: boolean
}

export function TabTriggerWithBadge({
  value, label, unreadCount, category, groupId, countSuffix, disabled,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [localCount, setLocalCount] = useState(unreadCount)

  function handleClick() {
    if (localCount === 0 || !category) return
    setLocalCount(0)
    startTransition(async () => {
      await markGroupCategoryNotificationsRead(groupId, category).catch(() => {})
      router.refresh()
    })
  }

  return (
    <TabsTrigger value={value} disabled={disabled} onClick={handleClick}>
      <span className="inline-flex items-center gap-1.5">
        {label}
        {countSuffix && <span className="text-muted-foreground">{countSuffix}</span>}
        {localCount > 0 && (
          <span
            className={cn(
              'min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-medium flex items-center justify-center px-1',
              pending && 'opacity-70',
            )}
            aria-label={`${localCount} ulæste`}
          >
            {localCount > 9 ? '9+' : localCount}
          </span>
        )}
      </span>
    </TabsTrigger>
  )
}
