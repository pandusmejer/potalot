import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  findForvandling,
  FORVANDLINGER,
  KATEGORI_LABEL,
  KATEGORI_FARVE,
} from '@/lib/havebog-forvandlinger'

export const dynamic = 'force-static'
export function generateStaticParams() {
  return FORVANDLINGER.map(f => ({ id: f.id }))
}

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * En forvandling — kort, roligt og brugbart. Ikke en tung opskrift med SEO-
 * suppe: titel, kategori, hvilke afgrøder, "hvorfor nu", 3-5 trin, CTA.
 */
export default async function ForvandlingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const f = findForvandling(id)
  if (!f) notFound()

  const farve = KATEGORI_FARVE[f.category]

  return (
    <div className="w-full" style={{ paddingBottom: 48, maxWidth: 620 }}>
      <Link href="/havebog/forvandlinger" className="flex w-fit items-center no-underline" style={{ gap: 6, fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.55)', marginBottom: 22 }}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Forvandlinger
      </Link>

      {/* Kategori-chip */}
      <span className="flex w-fit items-center uppercase" style={{ gap: 7, fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: farve, marginBottom: 12 }}>
        <span aria-hidden style={{ width: 9, height: 9, borderRadius: 999, background: farve }} />
        {KATEGORI_LABEL[f.category]}
      </span>

      <h1 style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(38px, 10vw, 52px)', lineHeight: 1.02, letterSpacing: '-0.02em', color: '#1F2D1D', margin: '0 0 26px' }}>
        {f.title}
      </h1>

      <Blok label="Brug">
        <p style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(20px, 5vw, 24px)', lineHeight: 1.3, color: '#3B4A2F', margin: 0 }}>
          {f.crops.map(capitalize).join(' · ')}
        </p>
      </Blok>

      <Blok label="Hvorfor nu">
        <p style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(20px, 5vw, 24px)', lineHeight: 1.34, color: 'rgba(36,48,31,0.78)', margin: 0, maxWidth: '30ch' }}>
          {f.body}
        </p>
      </Blok>

      <Blok label="Sådan gør du">
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, counterReset: 'trin' }}>
          {f.steps.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <span aria-hidden style={{ flexShrink: 0, fontFamily: sans, fontSize: 13, fontWeight: 700, color: farve, width: 22, marginTop: 3 }}>{i + 1}</span>
              <span style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(19px, 4.6vw, 22px)', lineHeight: 1.32, color: '#24301F' }}>{s}</span>
            </li>
          ))}
        </ol>
      </Blok>

      {f.safetyNote && (
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: 'rgba(36,48,31,0.55)', margin: '4px 0 26px', padding: '12px 14px', background: 'rgba(59,74,47,0.05)', borderRadius: 12 }}>
          {f.safetyNote}
        </p>
      )}

      {/* CTA — design-intention; kobles til log/projekt-oprettelse i eget sprint. */}
      <div className="flex flex-wrap" style={{ gap: 10, marginTop: 10 }}>
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: '#F4EFDC', background: '#3B4A2F', borderRadius: 999, padding: '11px 22px' }}>
          Gem i Havebogen
        </span>
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: '#3B4A2F', background: 'transparent', border: '1px solid rgba(36,48,31,0.2)', borderRadius: 999, padding: '11px 22px' }}>
          Føj til log
        </span>
      </div>
    </div>
  )
}

function Blok({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <p className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: '0 0 10px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}
