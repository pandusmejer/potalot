import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { PopulaertEmne } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  emner: PopulaertEmne[]
}

const TONE: Record<PopulaertEmne['tone'], string> = {
  sage: '#E4E8D5',
  rose: '#E8D4D2',
  sand: '#EEE3CA',
}

/**
 * RUM · "Sæsonens spørgsmål" (V19 — Annas 390px kort-spec, sektion 5).
 *
 * Rolige, sæson-relevante temaer som 3 små tonede guide-indgange — IKKE
 * social proof. Ingen læsertal, ingen "trending", intet "andre klikker".
 * Overskriften siger "det her er relevant i haven lige nu", ikke "mange
 * læser om det". Emne-kort fører til guides (ægte rute).
 *
 * PROTOTYPE: emnerne er demo (hardcodet). Ægte sæson-kuratering (hvilke
 * spørgsmål der er aktuelle i denne måned) er en senere kilde; indtil da
 * gated for indloggede.
 */
export function PopulaertLigeNu({ emner }: Props) {
  return (
    <section>
      <div
        style={{
          borderRadius: 20,
          background: '#F5EEDC',
          border: '1px solid rgba(143,148,132,0.18)',
          boxShadow: '0 10px 28px rgba(31,45,29,0.06)',
          padding: '18px 16px 16px',
        }}
      >
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 16 }}
        >
          Sæsonens spørgsmål
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          {emner.slice(0, 3).map(e => (
            <Link
              key={e.emne}
              href="/guides"
              className="no-underline"
              style={{ position: 'relative', flex: 1, minWidth: 0, borderRadius: 14, padding: '12px 11px 34px', background: TONE[e.tone], overflow: 'hidden' }}
            >
              <p lang="da" style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(16px, 4.6cqw, 20px)', lineHeight: 1.06, color: '#1F2D1D', margin: 0, marginBottom: 7, hyphens: 'auto', overflowWrap: 'break-word' }}>
                {e.emne}
              </p>
              <p style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 400, lineHeight: 1.35, color: '#45503F', margin: 0 }}>
                {e.beskrivelse}
              </p>
              <span
                aria-hidden
                style={{ position: 'absolute', right: 10, bottom: 10, width: 24, height: 24, borderRadius: 999, background: 'rgba(31,45,29,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight style={{ width: 14, height: 14, color: '#2C3826' }} strokeWidth={2.4} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
