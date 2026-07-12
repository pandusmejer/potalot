import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { PopulaertEmne } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  emner: PopulaertEmne[]
}

// Naturlige, jordnære toner — mindre pastel, mere have (mos, ler, hvede).
const TONE: Record<PopulaertEmne['tone'], string> = {
  sage: '#CBD4B4',
  rose: '#D8C1B6',
  sand: '#E0D2AA',
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
          marginInline: -11,
          borderRadius: 18,
          background: '#F7F1E3',
          border: '1px solid rgba(143,148,132,0.18)',
          padding: '18px 6px 14px',
        }}
      >
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: 0, marginBottom: 15, marginLeft: 6 }}
        >
          Sæsonens spørgsmål
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {emner.slice(0, 3).map(e => (
            <Link
              key={e.emne}
              href="/guides"
              className="no-underline"
              style={{ position: 'relative', flex: '0 0 117px', width: 117, height: 95, borderRadius: 16, padding: '11px 11px 0', background: TONE[e.tone], overflow: 'hidden' }}
            >
              <p lang="da" style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(14px, 4.2cqw, 17px)', lineHeight: 1.0, color: '#223022', margin: 0, marginBottom: 5, hyphens: 'auto', overflowWrap: 'break-word' }}>
                {e.emne}
              </p>
              <p
                style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, lineHeight: 1.35, color: '#55604F', margin: 0, whiteSpace: 'pre-line' }}
              >
                {e.beskrivelse}
              </p>
              <span
                aria-hidden
                style={{ position: 'absolute', right: 9, bottom: 9, width: 21, height: 21, borderRadius: 999, border: '1px solid rgba(60,70,50,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight style={{ width: 10, height: 10, color: '#3E4A39' }} strokeWidth={2.2} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
