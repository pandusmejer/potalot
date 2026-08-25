'use client'

import { useState } from 'react'
import { Sparkles, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { udfoerBackfill } from '@/actions/froebank-backfill'
import { BACKFILL_LABELS, type BackfillForslag, type BackfillFelt } from '@/lib/froebank-backfill'

/**
 * "Potalot kan udfylde resten" — engangsoprydning på gamle frøposer.
 *
 * Poser oprettet før berigelsen fandtes står med tomme dyrkningsfakta, selv
 * om Potalot i dag har guiden. Kortet tilbyder at fylde dem ud i ét greb i
 * stedet for én Redigér ad gangen.
 *
 * To ting holder det roligt:
 *   · Det findes kun så længe der er noget at gøre. Er alt udfyldt, findes
 *     kortet ikke — ingen tom tilstand, ingen "0 felter mangler".
 *   · Listen kan foldes ud FØR man trykker. Ingen skal sige ja til noget,
 *     de ikke kan se.
 *
 * Brugerens egne oplysninger røres aldrig — hverken poseoplysninger eller
 * et dyrkningsfelt hun selv har udfyldt. Serveren genberegner forslaget før
 * den skriver, så et felt hun lige har rettet i et andet faneblad heller
 * ikke bliver overskrevet.
 */
export function BackfillKort({ forslag }: { forslag: BackfillForslag[] }) {
  const [aaben, setAaben] = useState(false)
  const [koerer, setKoerer] = useState(false)
  const [resultat, setResultat] = useState<{ poser: number; felter: number } | null>(null)
  const [fejl, setFejl] = useState<string | null>(null)
  const [lukket, setLukket] = useState(false)

  if (forslag.length === 0 || lukket) return null

  const antalFelter = forslag.reduce((sum, f) => sum + f.antalFelter, 0)

  async function udfyld() {
    setKoerer(true)
    setFejl(null)
    const svar = await udfoerBackfill()
    setKoerer(false)
    if ('error' in svar) setFejl(svar.error)
    else setResultat(svar)
  }

  if (resultat) {
    return (
      <div
        className="rounded-2xl border border-primary/15 px-4 py-3"
        style={{ background: 'rgba(79,111,53,0.07)' }}
      >
        <p className="text-sm" style={{ color: '#263321' }}>
          {resultat.felter} {resultat.felter === 1 ? 'felt' : 'felter'} udfyldt på{' '}
          {resultat.poser} {resultat.poser === 1 ? 'frøpose' : 'frøposer'}. Genindlæs siden for
          at se dem.
        </p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-primary/15 bg-primary/[0.06] px-4 py-3.5 pr-9">
      <button
        type="button"
        onClick={() => setLukket(true)}
        aria-label="Skjul forslaget"
        className="absolute right-2.5 top-2.5 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: '#263321' }}>
            Potalot kan udfylde resten
          </p>
          <p className="mt-1 text-sm" style={{ color: 'rgba(38,51,33,0.68)', lineHeight: 1.45 }}>
            {forslag.length} {forslag.length === 1 ? 'frøpose mangler' : 'frøposer mangler'}{' '}
            dyrkningsfakta, som guiderne allerede kender — {antalFelter} felter i alt. Det, du selv
            har skrevet, bliver stående.
          </p>

          <button
            type="button"
            onClick={() => setAaben(v => !v)}
            aria-expanded={aaben}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            {aaben ? 'Skjul listen' : 'Se hvad der bliver udfyldt'}
            <ChevronRight
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: aaben ? 'rotate(90deg)' : undefined }}
            />
          </button>

          {aaben && (
            <ul className="mt-2 space-y-1.5 border-t border-primary/10 pt-2">
              {forslag.map(f => (
                <li key={f.id} className="text-xs" style={{ color: 'rgba(38,51,33,0.72)' }}>
                  <span className="font-semibold" style={{ color: '#263321' }}>{f.navn}</span>
                  {' — '}
                  {Object.keys(f.felter)
                    .map(k => BACKFILL_LABELS[k as BackfillFelt])
                    .join(', ')}
                </li>
              ))}
            </ul>
          )}

          {fejl && <p className="mt-2 text-xs text-destructive">{fejl}</p>}

          <Button size="sm" className="mt-3" onClick={udfyld} disabled={koerer}>
            {koerer ? 'Udfylder …' : 'Udfyld felterne'}
          </Button>
        </div>
      </div>
    </div>
  )
}
