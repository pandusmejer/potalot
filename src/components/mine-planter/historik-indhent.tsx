'use client'

import { useState, useSyncExternalStore } from 'react'
import { X, History, Sprout, ArrowUpRight, TreePine, Wheat } from 'lucide-react'
import { LogForm } from '@/components/mine-planter/log-form'
import type { PlantLogType } from '@/lib/types'

const sans = 'var(--font-manrope)'
const noSubscribe = () => () => {}

/**
 * "Din plante er i gang" — det lille retroaktive kort (Anna 8/8, 3. runde):
 * ét roligt kort, én handling. Første møde med en plante skal føles som
 * "her er din plante", ikke "færdiggør venligst journalføringen".
 *
 * - INGEN trivsel/højde her — de handler om NU og bor i Log nyt på planten.
 * - Milepælene vises først EFTER tryk på "Tilføj tidligere milepæle"
 *   (progressiv afsløring) og åbner den eksisterende logdialog med typen
 *   forvalgt — aldrig en miniatureudgave af logsystemet.
 * - Kortet forsvinder PERMANENT når en tidligere milepæl er tilføjet,
 *   eller brugeren lukker det.
 */
export function HistorikIndhent({
  plantId,
  registrerede,
}: {
  plantId: string
  /** Allerede registrerede log-typer (+ syntetisk planting_out/harvest fra
   * plantens felter) — bruges til at skjule kortet og filtrere valgene. */
  registrerede: string[]
}) {
  const skippedBefore = useSyncExternalStore(
    noSubscribe,
    () => {
      try { return localStorage.getItem(`indhent-skip-${plantId}`) === '1' } catch { return false }
    },
    () => false,
  )
  const [dismissed, setDismissed] = useState(false)
  const [viserValg, setViserValg] = useState(false)

  const har = new Set(registrerede)
  const alleMilepaele: { type: PlantLogType; label: string; ikon: React.ReactNode }[] = [
    { type: 'germination', label: 'Spiret', ikon: <Sprout className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> },
    { type: 'repotting', label: 'Pottet om', ikon: <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> },
    { type: 'planting_out', label: 'Udplantet', ikon: <TreePine className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> },
    { type: 'harvest', label: 'Høstet', ikon: <Wheat className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> },
  ]
  const milepaele = alleMilepaele.filter(m => !har.has(m.type))

  // Én tilføjet milepæl (eller alle kendte) → kortet har gjort sit og forsvinder.
  const harTilfoejetMilepael = ['germination', 'repotting', 'planting_out', 'harvest'].some(t => har.has(t))
  if (skippedBefore || dismissed || harTilfoejetMilepael || milepaele.length === 0) return null

  function luk() {
    try { localStorage.setItem(`indhent-skip-${plantId}`, '1') } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <section
      style={{ background: '#F2EFE2', border: '1px solid rgba(36,48,31,0.12)', borderRadius: 20, padding: '16px 18px' }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: 34, height: 34, borderRadius: 11, background: '#E7ECDD', color: '#3D4A2C' }}
        >
          <History className="h-4 w-4" strokeWidth={1.9} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: '#24301F', margin: 0, lineHeight: 1.2 }}>
            Din plante er i gang
          </p>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'rgba(36,48,31,0.65)', margin: '5px 0 0' }}>
            Vi har sat alderen ud fra din sådato. Du kan tilføje det, der
            allerede er sket, når det passer dig.
          </p>

          {!viserValg ? (
            <button
              type="button"
              onClick={() => setViserValg(true)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                marginTop: 10, fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#4E6138',
              }}
            >
              Tilføj tidligere milepæle →
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {milepaele.map(m => (
                <LogForm
                  key={m.type}
                  plantId={plantId}
                  defaultType={m.type}
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full transition-transform active:scale-[0.97]"
                      style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: '#3D4A2C', background: '#FFFFFF', border: '1px solid rgba(61,74,44,0.18)', padding: '8px 14px' }}
                    >
                      {m.ikon}
                      {m.label}
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={luk}
          aria-label="Ikke nu"
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-[rgba(36,48,31,0.06)]"
          style={{ color: 'rgba(36,48,31,0.4)' }}
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  )
}
