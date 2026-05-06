'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EyeOff, Eye } from 'lucide-react'
import { hideGeneralTask, unhideGeneralTask } from '@/actions/aarshjul'

interface Props {
  taskId: string
  isHidden: boolean
}

export function GeneralTaskActions({ taskId, isHidden }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const res = isHidden
        ? await unhideGeneralTask(taskId)
        : await hideGeneralTask(taskId)
      if ('error' in res) {
        alert(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={pending}
      className="text-xs"
    >
      {isHidden ? (
        <>
          <Eye className="h-3.5 w-3.5" />
          Vis igen
        </>
      ) : (
        <>
          <EyeOff className="h-3.5 w-3.5" />
          Ikke relevant for min have
        </>
      )}
    </Button>
  )
}
