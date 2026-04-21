'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sprout } from 'lucide-react'
import { SowDialog } from './sow-dialog'
import type { Seed, Variety, Placering } from '@/lib/types'

interface Props {
  seeds: Seed[]
  varieties: Variety[]
  placeringer: Placering[]
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SowButton({
  seeds,
  varieties,
  placeringer,
  label = 'Så et frø',
  variant = 'primary',
  size = 'md',
  className,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <Sprout className="h-4 w-4 mr-1.5" />
        {label}
      </Button>

      <SowDialog
        open={open}
        onClose={() => setOpen(false)}
        seeds={seeds}
        varieties={varieties}
        placeringer={placeringer}
      />
    </>
  )
}
