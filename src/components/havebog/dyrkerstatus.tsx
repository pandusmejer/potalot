import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Dyrkerstatus as DyrkerstatusData } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  status: DyrkerstatusData
}

/**
 * RUM · "Din status som dyrker" (V19 — Annas 390px kort-spec, sektion 6).
 *
 * Identitet, IKKE gamification: ingen niveau, ingen prikker, ingen badge,
 * ingen XP. Et roligt Profil-PREVIEW — botanisk streg-pynt nederst-højre,
 * Cormorant-titel (IKKE all-caps, IKKE bold sans), rolig beskrivelse, og
 * "Se hele din profil →". Primært hjemme i Profil; her kun som preview.
 */
export function Dyrkerstatus({ status }: Props) {
  return (
    <section>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginInline: -11,
          borderRadius: 14,
          background: '#DDD7DE',
          border: '1px solid rgba(80,72,86,0.16)',
          boxShadow: '0 10px 28px rgba(40,35,42,0.07)',
          padding: '10px 22px 11px',
        }}
      >
        {/* Botanisk vandmærke — tone-i-tone med lavendel-baggrunden, meget
            nedtonet via maske (linjerne får plum-farve, ikke sort). Må ikke
            larme; skal aldrig konkurrere med teksten. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -18,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 220,
            height: 198,
            background: '#4A3D57',
            opacity: 0.12,
            WebkitMaskImage: 'url(/images/havebog/selvforsyner-vandmaerke.png)',
            maskImage: 'url(/images/havebog/selvforsyner-vandmaerke.png)',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />

        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(47,43,49,0.5)', margin: 0, marginBottom: 12 }}
        >
          Din status som dyrker
        </p>
        <p
          style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(34px, 10cqw, 42px)', lineHeight: 1, letterSpacing: '-0.01em', color: '#2F2B31', margin: 0, marginBottom: 10 }}
        >
          {status.titel}
        </p>
        <p
          style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 400, lineHeight: 1.32, color: 'rgba(47,43,49,0.8)', margin: 0, whiteSpace: 'pre-line' }}
        >
          {status.beskrivelse}
        </p>
        <Link
          href="/profil"
          className="no-underline flex items-center"
          style={{ gap: 4, marginTop: 12, fontFamily: sans, fontSize: 13.5, fontWeight: 650, color: '#4A3D57', position: 'relative' }}
        >
          Se hele din profil
          <ChevronRight style={{ width: 17, height: 17 }} strokeWidth={2.4} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
