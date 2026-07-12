import type { ReactNode } from 'react'
import { InspirerMig } from '@/components/havebog/inspirer-mig'
import { MaaskeDuOgsaa } from '@/components/havebog/maaske-du-ogsaa'
import { PaaDenneDag } from '@/components/havebog/paa-denne-dag'
import { Projekter } from '@/components/havebog/projekter'
import { PopulaertLigeNu } from '@/components/havebog/populaert-lige-nu'
import { Dyrkerstatus } from '@/components/havebog/dyrkerstatus'
import { Dyrkerkompetencer } from '@/components/havebog/dyrkerkompetencer'
import { Bedrifter } from '@/components/havebog/bedrifter'
import {
  DEMO_INSPIRER, DEMO_ON_THIS_DAY, DEMO_PROJEKT, DEMO_POPULAERT,
  DEMO_DYRKERSTATUS, DEMO_KOMPETENCER, DEMO_BEDRIFTER,
} from '@/data/havebog-demo'

export const dynamic = 'force-dynamic'

/**
 * Offentlig preview af Havebogs nederste kort-sektioner (390px kort-redesign,
 * Annas gennemgang). Ikke i navigation; kan fjernes når review er slut.
 */
function Lbl({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(36,48,31,0.4)', margin: '0 0 10px' }}>
      {children}
    </p>
  )
}

export default function HavebogPreviewPage() {
  return (
    <div className="space-y-14 py-6">
      <div><Lbl>1 · Prøv næste år</Lbl><InspirerMig forslag={DEMO_INSPIRER} /></div>
      <div><Lbl>2 · Måske du også vil prøve</Lbl><MaaskeDuOgsaa forslag={DEMO_INSPIRER.sekundaer!} billede="/images/havebog/maaske-du-ogsaa-froeavl.jpg" /></div>
      <div><Lbl>3 · På denne dag</Lbl><PaaDenneDag entries={DEMO_ON_THIS_DAY} /></div>
      <div><Lbl>4 · Næste projekt</Lbl><Projekter projekt={DEMO_PROJEKT} /></div>
      <div><Lbl>5 · Sæsonens spørgsmål</Lbl><PopulaertLigeNu emner={DEMO_POPULAERT} /></div>
      <div><Lbl>6 · Din status som dyrker</Lbl><Dyrkerstatus status={DEMO_DYRKERSTATUS} /></div>
      <div><Lbl>7 · Dine kompetencer</Lbl><Dyrkerkompetencer omraader={DEMO_KOMPETENCER} /></div>
      <div><Lbl>8 · Første gange</Lbl><Bedrifter bedrifter={DEMO_BEDRIFTER} /></div>
    </div>
  )
}
