'use client'

import { useEffect } from 'react'
import { recordGuideRead } from '@/lib/guides/recently-read'

/**
 * Usynlig markør: registrerer at guiden er åbnet, så den kan vises under
 * "FORTSÆT DINE GUIDER" på /guides. Renderes på guide-detaljesiden.
 */
export function RecordGuideRead({ id }: { id: string }) {
  useEffect(() => {
    recordGuideRead(id)
  }, [id])
  return null
}
