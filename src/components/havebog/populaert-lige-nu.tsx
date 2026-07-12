import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { PopulaertEmne } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  emner: PopulaertEmne[]
}

// Bløde, pudrede, let desaturerede toner — matte plader, ikke larmende.
const TONE: Record<PopulaertEmne['tone'], string> = {
  sage: '#E3E7D6',
  rose: '#E7DAD6',
  sand: '#EDE5CE',
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
          borderRadius: 18,
          background: '#F7F1E3',
          border: '1px solid rgba(143,148,132,0.18)',
          padding: '18px 16px 16px',
        }}
      >
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 16 }}
        >
          Sæsonens spørgsmål
        </p>

        <div style={{ display: 'flex', gap: 11, alignItems: 'stretch' }}>
          {emner.slice(0, 3).map(e => (
            <Link
              key={e.emne}
              href="/guides"
              className="no-underline"
              style={{ position: 'relative', flex: 1, minWidth: 0, borderRadius: 16, padding: '14px 12px 44px', background: TONE[e.tone], overflow: 'hidden' }}
            >
              <p lang="da" style={{ fontFamily: serif, fontWeight: 500, fontSize: 'clamp(18px, 5.2cqw, 21px)', lineHeight: 1.0, color: '#223022', margin: 0, marginBottom: 8, hyphens: 'auto', overflowWrap: 'break-word' }}>
                {e.emne}
              </p>
              <p
                lang="da"
                style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: '#55604F', margin: 0, hyphens: 'auto', overflowWrap: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {e.beskrivelse}
              </p>
              <span
                aria-hidden
                style={{ position: 'absolute', right: 11, bottom: 11, width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(60,70,50,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight style={{ width: 15, height: 15, color: '#3E4A39' }} strokeWidth={2.2} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
