'use client'

import Link from 'next/link'
import { PrimaryFocus, SecondaryRow, Eyebrow, useDerivedCompletions } from '@/components/havekalender/fokus-handling-ui'
import type { DagensFokus } from '@/lib/kalender/dagens-fokus'

/**
 * DAGENS/UGENS FOKUS — Kalenderens redaktionelle kerne og svar på sidens ene
 * spørgsmål: "Hvad er det vigtigste jeg gør i haven i dag?"
 *
 * Renderer mentor-motoren (lib/kalender/dagens-fokus.ts). Ét primært fokus
 * fremhævet, op til tre støttende, resten bag "Se alle". Stilhed er en feature:
 * når intet haster, siger sektionen det roligt — den opfinder ikke opgaver.
 *
 * ⚠️ Pr. 2026-06-30 er denne standalone-sektion AFLØST på /kalender af det
 * samlede "I haven nu"-modul (i-haven-nu.tsx), som genbruger de samme
 * fokus-handling-helpers. Komponenten bevares for genaktivering/QA.
 *
 * Render-UI (PrimaryFocus/SecondaryRow/Chip/tap-to-check) bor nu i
 * fokus-handling-ui.tsx og deles med I haven nu.
 */

const sans = 'var(--font-manrope)'
const display = 'var(--font-gabarito), var(--font-manrope), sans-serif'

export function DagensFokusSection({ data, canPersist = false }: { data: DagensFokus; canPersist?: boolean }) {
  const { isDone, toggle } = useDerivedCompletions([...data.fokus, ...data.flere], canPersist)
  // Aktuel måned til chip-logikken ("Godt vindue" vs "Plant ud"). Stabil pr.
  // dag → samme på server (SSR) og klient, ingen hydration-mismatch.
  const month = new Date().getMonth() + 1

  // ── Stilhed: ingen fokus-handlinger → rolig kvittering / almanak ──
  if (data.fokus.length === 0) {
    return (
      <section>
        <Eyebrow>Ugens fokus</Eyebrow>
        <div
          className="rounded-tl-[1.4rem] rounded-br-[1.4rem] rounded-tr-md rounded-bl-md"
          style={{ background: 'var(--secondary)', padding: '18px' }}
        >
          <h3 style={{ fontFamily: display, fontSize: 19, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            Alt er roligt i haven i dag
          </h3>
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: 'rgba(42,51,32,0.62)', margin: '7px 0 0', lineHeight: 1.45 }}>
            {data.almanak
              ? data.almanak
              : 'Der er intet, der haster. Brug fem minutter på at kigge efter tør jord, skadedyr eller planter, der hænger.'}
          </p>
        </div>
      </section>
    )
  }

  // Sammenlagt: dagens vigtigste = featured; resten af lag 1-4 = "Næste opgaver"
  // (op til 3 rows), og hele opgavebrættet bag footer-linket. Ét sted at kigge.
  const alle = [...data.fokus, ...data.flere]
  const [primary, ...resten] = alle
  const naeste = resten.slice(0, 3)

  return (
    <section>
      <Eyebrow>Ugens fokus</Eyebrow>

      <PrimaryFocus h={primary} done={isDone(primary)} month={month} markoer="I dag" onToggle={() => toggle(primary)} />

      {naeste.length > 0 && (
        <>
          <p className="uppercase" style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(42,51,32,0.5)', margin: '11px 0 1px' }}>
            Næste opgaver
          </p>
          <div>
            {naeste.map((h, i) => (
              <SecondaryRow key={h.taskKey} h={h} done={isDone(h)} first={i === 0} month={month} onToggle={() => toggle(h)} />
            ))}
          </div>
          <Link
            href="#mine-opgaver"
            style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: 'var(--primary)', display: 'inline-block', padding: '12px 2px 0', textDecoration: 'none' }}
          >
            Se alle ugens opgaver →
          </Link>
        </>
      )}
    </section>
  )
}
