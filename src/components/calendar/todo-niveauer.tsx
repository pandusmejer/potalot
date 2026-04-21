'use client'

import { useState } from 'react'
import { TaskItem } from './task-item'
import type { Task } from '@/lib/types'
import { EMPTY_STATES } from '@/lib/sprog'

/**
 * To-do i tre niveauer: I dag / Denne uge / Denne måned.
 */

type Niveau = 'dag' | 'uge' | 'maaned'

const NIVEAU_LABEL: Record<Niveau, string> = {
  dag: 'I dag',
  uge: 'Denne uge',
  maaned: 'Denne måned',
}

export function TodoNiveauer({
  idag,
  uge,
  maaned,
}: {
  idag: Task[]
  uge: Task[]
  maaned: Task[]
}) {
  const [niveau, setNiveau] = useState<Niveau>('dag')
  const tasks = niveau === 'dag' ? idag : niveau === 'uge' ? uge : maaned

  const counts: Record<Niveau, number> = {
    dag: idag.length,
    uge: uge.length,
    maaned: maaned.length,
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {(Object.keys(NIVEAU_LABEL) as Niveau[]).map(n => (
          <button
            key={n}
            onClick={() => setNiveau(n)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              niveau === n
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {NIVEAU_LABEL[n]}
            <span className="ml-1.5 text-xs opacity-60">({counts[n]})</span>
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-4">
          {niveau === 'dag' ? EMPTY_STATES.ingen_opgaver_i_dag : EMPTY_STATES.ingen_kommende_opgaver}
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => <TaskItem key={task.id} task={task} />)}
        </div>
      )}
    </div>
  )
}
