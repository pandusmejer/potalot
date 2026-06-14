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
 * vandpytter eller sten. Ingen hårde kanter. Ingen app-pills. De skal
 * føles som ting man kan røre ved." Tre bløde blob-flader med art +
 * handling — det der kalder på dig i dag, sagt roligt.
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
              className="group relative flex flex-1 flex-col justify-between transition-transform duration-200 ease-out active:scale-[0.98]"
              style={{
                minHeight: 116,
                background: blob.bg,
                borderRadius: blob.radius,
                padding: '16px 16px 14px',
              }}
            >
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 14.5,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                  color: '#24301F',
                  margin: 0,
                }}
              >
                {item.art}
              </p>
              <div>
                <p
                  style={{
                    fontFamily: sans,
                    fontSize: 12.5,
                    fontWeight: 500,
                    lineHeight: 1.25,
                    color: 'rgba(36,48,31,0.62)',
                    margin: 0,
                  }}
                >
                  {item.action}
                </p>
                <ArrowRight
                  className="mt-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  style={{ color: 'rgba(36,48,31,0.4)' }}
                  aria-hidden
                />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
