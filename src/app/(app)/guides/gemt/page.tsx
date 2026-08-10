import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getAlleGemte } from '@/actions/gartner-gemte'
import { GemtListe } from '@/components/guides/gemt-liste'

export const dynamic = 'force-dynamic'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * /guides/gemt — "Gemt fra Gartneren" (spec: Docs/product/gem-fra-gartneren.md).
 * Brugerens personlige videnslag oven på det redaktionelle bibliotek:
 * spørgsmål + svar + kontekst, gemt med én diskret handling fra Gartner-svar.
 * Personlige noter — IKKE redaktionelt indhold, IKKE et chatarkiv.
 */
export default async function GemtFraGartnerenPage() {
  const user = await getCurrentUser()
  const noter = user ? await getAlleGemte() : []

  return (
    <div className="relative -mx-4 -mt-6 min-h-screen bg-[#EAE6D8] px-4 pb-16 pt-6">
      <style>{`.app-canvas{background-color:#EAE6D8;}`}</style>

      <Link
        href="/guides"
        className="inline-flex items-center gap-1.5 no-underline"
        style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.6)' }}
      >
        <ArrowLeft size={15} strokeWidth={2.2} aria-hidden />
        Guides
      </Link>

      <header className="mt-4">
        <p
          style={{
            fontFamily: sans, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.5)', margin: 0,
          }}
        >
          Dine noter
        </p>
        <h1
          style={{
            fontFamily: serif, fontWeight: 600,
            fontSize: 'clamp(36px, 11vw, 48px)', lineHeight: 1.04,
            color: '#242019', margin: '6px 0 0',
          }}
        >
          Gemt fra Gartneren
        </h1>
        <p
          style={{
            fontFamily: sans, fontSize: 14, fontWeight: 500, lineHeight: 1.55,
            color: 'rgba(36,48,31,0.6)', margin: '10px 0 0', maxWidth: 420,
          }}
        >
          Svar, du har valgt at huske — sammen med det spørgsmål, de hører
          til. Din egen viden oven på Potalots guides.
        </p>
      </header>

      <div className="mt-8">
        {user ? (
          <GemtListe initial={noter} />
        ) : (
          <p style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, lineHeight: 1.55, color: 'rgba(36,48,31,0.6)', margin: 0 }}>
            Dine gemte svar hører til din bruger.{' '}
            <Link href="/login" style={{ color: '#4E6138', fontWeight: 600 }}>Log ind</Link>
            {' '}eller{' '}
            <Link href="/opret" style={{ color: '#4E6138', fontWeight: 600 }}>opret en bruger</Link>
            {' '}for at se dem.
          </p>
        )}
      </div>
    </div>
  )
}
