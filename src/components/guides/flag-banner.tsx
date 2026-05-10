import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Clock } from 'lucide-react'

interface Props {
  reason: string | null
  deleteAt: string | null
  flaggedAt: string
  /** Hvis viser, vises der ikke nedtælling — kun beskeden */
  asAdmin?: boolean
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export function FlagBanner({ reason, deleteAt, flaggedAt, asAdmin = false }: Props) {
  const days = daysUntil(deleteAt)

  return (
    <Card className="bg-amber-50 border-amber-300">
      <CardContent className="py-4 space-y-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900">
              {asAdmin
                ? 'Denne guide er flaget for moderation'
                : 'Din guide er flaget og skjult for andre'}
            </p>
            {reason && (
              <p className="text-sm text-amber-900/90 mt-1 whitespace-pre-wrap">
                <span className="font-medium">Begrundelse: </span>
                {reason}
              </p>
            )}
            {!asAdmin && (
              <p className="text-sm text-amber-900/80 mt-2">
                Du har <strong>{days ?? '?'}{days === 1 ? ' dag' : ' dage'} tilbage</strong> til at revidere indholdet.
                Når fristen er udløbet, kan administratoren slette guiden permanent. Brug <strong>Redigér</strong> for at rette i indholdet.
              </p>
            )}
            {asAdmin && deleteAt && (
              <p className="text-xs text-amber-900/70 mt-1 inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Frist for ejer: {new Date(deleteAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · flaget '}{new Date(flaggedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
