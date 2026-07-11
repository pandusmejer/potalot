import { Sparkles, ListTodo, Bookmark, NotebookPen, Eye } from 'lucide-react'
import type { OptagelseStatus } from '@/data/havebog-demo'

/**
 * Venstre-ikonet på en optagelse fortæller dens SKÆBNE (status), ikke pynt:
 *   Ikke behandlet → Sparkles (appen skal stadig placere den)
 *   Opgave         → ListTodo (blevet til handling)
 *   Minde          → Bookmark (gemt som havebogsminde)
 *   Log            → NotebookPen (blevet til lognote)
 *   Observation    → Eye (brugeren så noget i haven)
 *
 * Sekundært ikon (play-knappen er den primære handling): ingen fyldt
 * baggrund, dæmpet salvie-grøn.
 */
const IKON: Record<OptagelseStatus, typeof Sparkles> = {
  unprocessed: Sparkles,
  opgave: ListTodo,
  minde: Bookmark,
  log: NotebookPen,
  observation: Eye,
}

export function OptagelseStatusIkon({
  status = 'unprocessed',
  size = 19,
}: {
  status?: OptagelseStatus
  size?: number
}) {
  const Ikon = IKON[status]
  return <Ikon style={{ width: size, height: size }} strokeWidth={1.75} color="#5F6F45" aria-hidden />
}
