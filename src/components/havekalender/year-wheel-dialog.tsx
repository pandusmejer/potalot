'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Library } from 'lucide-react'
import { YearWheelSection } from './year-wheel-section'
import type { CalendarTask } from '@/lib/types'

interface Props {
  existingTasks: CalendarTask[]
  year: number
  /** Custom trigger button (default: 'Bladr Havens årshjul'). */
  children?: React.ReactNode
}

/**
 * Wrapper der eksponerer YearWheelSection som en dialog frem for en
 * permanent sektion på kalender-siden. Sletter behovet for 'to årshjul
 * der ligner hinanden' — det visuelle navigations-årshjul lever øverst
 * på siden, mens template-katalogen ligger her, kun synligt på request.
 */
export function YearWheelDialog({ existingTasks, year, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <Library className="h-3.5 w-3.5" />
            Bladr Havens årshjul
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <YearWheelSection existingTasks={existingTasks} year={year} />
      </DialogContent>
    </Dialog>
  )
}
