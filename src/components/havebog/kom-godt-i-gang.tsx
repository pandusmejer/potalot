'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, X } from 'lucide-react'
import { FORVANDLINGER_ROUTE } from '@/lib/constants'

/**
 * KomGodtIGang — diskret opstartsstatus (adaptive onboarding, Anna 3/8).
 *
 * FULDSTÆNDIG ISOLERET: modtager kun counts som props — ingen side kender
 * komponentens interne logik, og komponenten kender ikke appens state.
 *
 * Regler:
 * - "Op til fire relevante næste skridt" — punkterne er en liste og kan
 *   udskiftes uden logik-omskrivning; visuel størrelse er fast.
 * - Dynamisk rækkefølge: fuldførte (✓) øverst kompakt, derefter ufuldførte
 *   i prioritetsorden — næste vigtigste handling står altid øverst.
 * - Ét statisk gevinst-udsagn ved FØRSTE ufuldførte punkt (ingen regelmotor).
 * - Hjælp gentager sig aldrig: permanent dismiss (localStorage) + auto-væk
 *   når alt er fuldført eller brugeren er etableret (mange frø/planter).
 * - Havearbejde, ikke indstillinger — ingen konfetti, ingen modals.
 */

const LS_KEY = 'potalot:komgodtigang'

interface Props {
  inventoryCount: number
  wishlistCount: number
  plantCount: number
  locationCount: number
}

interface Punkt {
  id: string
  titel: string
  gevinst: string
  href: string
  done: boolean
}

export function KomGodtIGang({ inventoryCount, wishlistCount, plantCount, locationCount }: Props) {
  // Dismiss-state læses i useEffect (SSR renderer null — husets mønster,
  // undgår hydration-mismatch og virker i privat browsing).
  const [klar, setKlar] = useState(false)
  const [dismissed, setDismissed] = useState(true)
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(LS_KEY) === 'dismissed')
    } catch {
      setDismissed(false)
    }
    setKlar(true)
  }, [])

  function luk() {
    try { localStorage.setItem(LS_KEY, 'dismissed') } catch { /* privat browsing */ }
    setDismissed(true)
  }

  const punkter: Punkt[] = [
    { id: 'froe', titel: 'Tilføj dit første frø', gevinst: 'Så kan vi huske sorter og såtid for dig.', href: '/froebank/tilfoej', done: inventoryCount > 0 },
    { id: 'plante', titel: 'Tilføj din første plante', gevinst: 'Så kan kalenderen følge den fra spiring til høst.', href: '/mine-planter', done: plantCount > 0 },
    { id: 'steder', titel: 'Fortæl hvor du dyrker', gevinst: 'Så kan vi tilpasse rådene til fx dit drivhus.', href: '/mine-planter', done: locationCount > 0 },
    { id: 'idé', titel: 'Gem din første idé på ønskelisten', gevinst: 'Så husker vi, hvad du drømmer om at dyrke.', href: FORVANDLINGER_ROUTE, done: wishlistCount > 0 },
  ]

  const fuldfoerte = punkter.filter(p => p.done)
  const ufuldfoerte = punkter.filter(p => !p.done)
  // Etableret bruger → målgruppen er forladt; kortet vises aldrig igen.
  const etableret = plantCount >= 4 || inventoryCount >= 10
  if (!klar || dismissed || ufuldfoerte.length === 0 || etableret) return null

  return (
    <section
      className="rounded-[20px] border border-border bg-card/70 p-4"
      aria-label="Kom godt i gang"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 uppercase" style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(36,48,31,0.5)' }}>
          Kom godt i gang
        </p>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 600, color: 'rgba(36,48,31,0.45)', fontVariantNumeric: 'tabular-nums' }}>
            {fuldfoerte.length} af {punkter.length}
          </span>
          <button
            type="button"
            onClick={luk}
            aria-label="Skjul Kom godt i gang"
            className="text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {/* Fuldførte: kompakt kvittering øverst. */}
        {fuldfoerte.map(p => (
          <p key={p.id} className="m-0 flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'rgba(36,48,31,0.45)' }}>
            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#7F8F6A' }} />
            <span className="line-through decoration-[rgba(36,48,31,0.25)]">{p.titel}</span>
          </p>
        ))}
        {/* Ufuldførte i prioritetsorden — første punkt bærer gevinst-linjen. */}
        {ufuldfoerte.map((p, i) => (
          <Link key={p.id} href={p.href} className="no-underline flex items-start gap-2 py-0.5 group">
            <span aria-hidden className="mt-[3px] h-3.5 w-3.5 shrink-0 rounded-full border border-[rgba(36,48,31,0.25)]" />
            <span className="min-w-0">
              <span className="block" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 600, color: '#2D2A24' }}>
                {p.titel}
                <ChevronRight className="ml-0.5 inline h-3.5 w-3.5 align-[-2px] text-muted-foreground/50 group-hover:text-foreground transition-colors" aria-hidden />
              </span>
              {i === 0 && (
                <span className="block" style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'rgba(36,48,31,0.55)' }}>
                  {p.gevinst}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
