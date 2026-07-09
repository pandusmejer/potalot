import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listOptagelser, type OptagelseRow } from '@/actions/optagelser'
import { OptagelserArkiv } from '@/components/havebog/optagelser-arkiv'

export const dynamic = 'force-dynamic'

/**
 * Optagelses-arkivet — alle "Tal til din have"-optagelser ét sted.
 * Diktafonen = indbakke: her kan brugeren se status og gøre optagelser
 * aktive (behandl → log/opgave/minde/observation). recorded_at bevares.
 *
 * Kræver migration 00053_voice_notes. Uden bruger/tabel → rolig tom tilstand.
 */
export default async function OptagelserPage() {
  let optagelser: OptagelseRow[] = []
  try {
    optagelser = await listOptagelser()
  } catch {
    optagelser = []
  }

  return (
    <div className="w-full" style={{ paddingBottom: 40 }}>
      <Link
        href="/"
        className="inline-flex items-center no-underline"
        style={{ gap: 6, fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.55)', marginBottom: 20 }}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Havebog
      </Link>

      <p
        className="uppercase"
        style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.24em', color: '#8F9484', margin: 0, marginBottom: 8 }}
      >
        Dine optagelser
      </p>
      <h1
        style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontWeight: 500, fontSize: 'clamp(34px, 9vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#1F2D1D', margin: '0 0 22px' }}
      >
        Hvad du har fortalt haven
      </h1>

      <OptagelserArkiv optagelser={optagelser} />
    </div>
  )
}
