'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg mx-4 max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-foreground mb-4', className)} {...props} />
}
