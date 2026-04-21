'use client'

import { useTransition, useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { udfoerForslag, afvisForslag } from '@/actions/motor'
import { Sparkles, Check, X } from 'lucide-react'
import type { Task } from '@/lib/types'

interface Props {
  tasks: Task[]
}

export function MotorForslag({ tasks }: Props) {
  if (tasks.length === 0) return null

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Jeg har noget til dig
        </CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {tasks.map(task => <ForslagRow key={task.id} task={task} />)}
      </div>
    </Card>
  )
}

function ForslagRow({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  function handleUdfoer() {
    startTransition(async () => {
      await udfoerForslag(task.id)
      setDone(true)
    })
  }

  function handleAfvis() {
    startTransition(async () => {
      await afvisForslag(task.id)
      setDismissed(true)
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-primary">
        <Check className="h-4 w-4" />
        <span>Gjort.</span>
      </div>
    )
  }

  if (dismissed) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <X className="h-4 w-4" />
        <span>OK — jeg spørger ikke igen lige nu.</span>
      </div>
    )
  }

  return (
    <div className="py-2 space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            {task.description}
          </p>
        )}
        {task.plant && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {task.plant.name}{task.plant.variety ? ` — ${task.plant.variety}` : ''}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleUdfoer} disabled={isPending}>
          <Check className="h-3.5 w-3.5 mr-1" />
          Gjort
        </Button>
        <Button size="sm" variant="ghost" onClick={handleAfvis} disabled={isPending}>
          Ikke nu
        </Button>
      </div>
    </div>
  )
}
