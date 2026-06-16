import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const sans = 'var(--font-manrope)'

export interface AtSeItem {
  art: string
  action: string
  href: string
}

/**
 * 🪨 AT SE TIL I DAG — organiske former, ikke notifikationer.
 *
 * Anna (spec): "Ikke røde badges. Store organiske former. Som små
 * vandpytter eller sten." Tre bløde blob-flader. Revision 16. juni: mere
 * luft mellem titel og handling, status-dot + titel øverst, handling +
 * pil i bunden — så de føles klikbare (handling), ikke kun pynt.
 */

// Bløde, varierede blob-radier + jordfarvede toner — ingen to ens.
const BLOBS = [
  { radius: '42% 58% 60% 40% / 56% 46% 54% 44%', bg: '#E7EDDD' },
  { radius: '58% 42% 44% 56% / 46% 58% 42% 54%', bg: '#F1EAD8' },
  { radius: '52% 48% 56% 44% / 60% 42% 58% 40%', bg: '#ECE3D5' },
]

export function AtSeTilIDag({ items }: { items: AtSeItem[] }) {
  if (items.length === 0) return null

  return (
    <section>
      <h2
        className="uppercase px-0.5"
        style={{
          fontFamily: sans,
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'rgba(36,48,31,0.52)',
          margin: '0 0 14px',
        }}
      >
        At se til i dag
      </h2>

      <div className="flex gap-3">
        {items.slice(0, 3).map((item, i) => {
          const blob = BLOBS[i % BLOBS.length]
          return (
            <Link
              key={`${item.art}-${i}`}
              href={item.href}
              className="group relative flex flex-1 flex-col transition-transform duration-200 ease-out active:scale-[0.98]"
              style={{
                minHeight: 132,
                background: blob.bg,
                borderRadius: blob.radius,
                padding: '15px 15px 14px',
              }}
            >
              {/* Status-dot + titel — øverst. */}
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: '#5E7D4F' }}
                />
                <span
                  className="truncate"
                  style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15, color: '#24301F' }}
                >
                  {item.art}
                </span>
              </span>

              {/* Handling + pil — skubbet til bunden, så der er luft til titlen. */}
              <span className="mt-auto flex items-end justify-between gap-1.5" style={{ paddingTop: 14 }}>
                <span
                  style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, lineHeight: 1.25, color: 'rgba(36,48,31,0.62)' }}
                >
                  {item.action}
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  style={{ color: 'rgba(36,48,31,0.42)' }}
                  aria-hidden
                />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
