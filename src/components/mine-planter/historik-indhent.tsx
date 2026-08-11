'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { X, History, Check, ChevronRight, Sprout, ArrowUpRight, TreePine, Wheat } from 'lucide-react'
import { LogForm } from '@/components/mine-planter/log-form'
import type { PlantLogType } from '@/lib/types'

const sans = 'var(--font-manrope)'
const noSubscribe = () => () => {}

const MILEPAEL_TYPER: PlantLogType[] = ['germination', 'repotting', 'planting_out', 'harvest']

/**
 * "Din plante er i gang" — det lille retroaktive kort (Anna 8/8, 3. runde +
 * 10/8: succes-staten). Ét roligt kort, én handling. Første møde med en
 * plante skal føles som "her er din plante", ikke "færdiggør venligst
 * journalføringen".
 *
 * - INGEN trivsel/højde her — de handler om NU og bor i Log nyt på planten.
 * - Milepælene vises først EFTER tryk på "Tilføj tidligere milepæle"
 *   (progressiv afsløring) og åbner den eksisterende logdialog med typen
 *   forvalgt — aldrig en miniatureudgave af logsystemet.
 * - Kortet forsvinder ALDRIG lydløst (Anna 10/8): efter første milepæl viser
 *   det en succes-state — "✓ Spiret er føjet til plantens historie" — der
 *   fortæller, at resten altid kan tilføjes under Plantens historie → Tilføj.
 *   Først ved "Færdig", ✕ eller når brugeren forlader siden, siger kortet
 *   permanent farvel. Ingen "1 af 4"-progression — de fire er muligheder,
 *   ikke en checklist.
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
  // Har brugeren åbnet kortet i DENNE visning? Kun da vises succes-staten —
  // milepæle der allerede fandtes ved indlæsning betyder, at kortet har
  // gjort sit (eller at oplysningen kom fra et andet flow).
  const [engageret, setEngageret] = useState(false)
  const [sidstAabnet, setSidstAabnet] = useState<PlantLogType | null>(null)

  const har = new Set(registrerede)
  const harMilepael = MILEPAEL_TYPER.some(t => har.has(t))

  function sigFarvel() {
    try { localStorage.setItem(`indhent-skip-${plantId}`, '1') } catch { /* ignore */ }
  }

  function luk() {
    sigFarvel()
    setDismissed(true)
  }

  // Milepæle til stede uden engagement i denne visning (frisk indlæsning
  // efter succes-staten, eller data fra andre flows) → permanent farvel.
  const farvelUdenVisning = harMilepael && !engageret && !skippedBefore && !dismissed
  useEffect(() => {
    if (farvelUdenVisning) sigFarvel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farvelUdenVisning])

  // Forlader brugeren siden fra succes-staten, er kortets arbejde også gjort.
  const succesRef = useRef(false)
  succesRef.current = engageret && harMilepael
  useEffect(() => {
    return () => { if (succesRef.current) sigFarvel() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (skippedBefore || dismissed) return null
  if (harMilepael && !engageret) return null

  const alleMilepaele: { type: PlantLogType; label: string; ikon: React.ReactNode }[] = [
    { type: 'germination', label: 'Spiret', ikon: <Sprout className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> },
    { type: 'repotting', label: 'Pottet om', ikon: <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> },
    { type: 'planting_out', label: 'Udplantet', ikon: <TreePine className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> },
    { type: 'harvest', label: 'Høstet', ikon: <Wheat className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> },
  ]

  const succes = engageret && harMilepael
  const senesteLabel =
    (sidstAabnet && har.has(sidstAabnet)
      ? alleMilepaele.find(m => m.type === sidstAabnet)?.label
      : null) ??
    alleMilepaele.find(m => har.has(m.type))?.label ??
    'Milepælen'

  return (
    <section
      style={{ background: '#F2EFE2', border: '1px solid rgba(36,48,31,0.12)', borderRadius: 20, padding: '16px 18px' }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: 34, height: 34, borderRadius: 11, background: '#E7ECDD', color: '#3D4A2C' }}
        >
          {succes
            ? <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            : <History className="h-4 w-4" strokeWidth={1.9} aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: '#24301F', margin: 0, lineHeight: 1.2 }}>
            {succes ? `${senesteLabel} er føjet til plantens historie` : 'Din plante er i gang'}
          </p>
          <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'rgba(36,48,31,0.65)', margin: '5px 0 0' }}>
            {succes
              ? 'Har der allerede været andre milepæle, kan du tilføje dem nu. Du kan også altid gøre det senere via Tilføj under Plantens historie.'
              : 'Vi har sat alderen ud fra din sådato. Du kan tilføje det, der allerede er sket, når det passer dig.'}
          </p>

          {!viserValg && !succes ? (
            <button
              type="button"
              onClick={() => { setViserValg(true); setEngageret(true) }}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 3,
                marginTop: 10, fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#4E6138',
              }}
            >
              Tilføj tidligere milepæle
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {alleMilepaele.map(m =>
                  har.has(m.type) ? (
                    <span
                      key={m.type}
                      className="inline-flex items-center gap-1.5 rounded-full"
                      style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: 'rgba(61,74,44,0.55)', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(61,74,44,0.12)', padding: '8px 14px' }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden style={{ color: '#5A7038' }} />
                      {m.label}
                    </span>
                  ) : (
                    <LogForm
                      key={m.type}
                      plantId={plantId}
                      defaultType={m.type}
                      trigger={
                        <button
                          type="button"
                          onClick={() => setSidstAabnet(m.type)}
                          className="inline-flex items-center gap-1.5 rounded-full transition-transform active:scale-[0.97]"
                          style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: '#3D4A2C', background: '#FFFFFF', border: '1px solid rgba(61,74,44,0.18)', padding: '8px 14px' }}
                        >
                          {m.ikon}
                          {m.label}
                        </button>
                      }
                    />
                  ),
                )}
              </div>
              {succes && (
                <button
                  type="button"
                  onClick={luk}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    marginTop: 12, fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#4E6138',
                  }}
                >
                  Færdig
                </button>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={luk}
          // Lukningen er PERMANENT — "Ikke nu" ville love en gensynstid,
          // UI'et ikke holder (Anna PLT-0077).
          aria-label={succes ? 'Færdig' : 'Luk'}
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-[rgba(36,48,31,0.06)]"
          style={{ color: 'rgba(36,48,31,0.4)' }}
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  )
}
