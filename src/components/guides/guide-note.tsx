import type { ReactNode } from 'react'
import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PotalotMacroOutput } from '@/lib/images/types'

const sans = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * GuideNote — den fælles note-familie for "Vidste du?" og "Potalot-tip".
 *
 * Én rolig stil (Anna: to stilarter — dette er den ene; Potalot-note er den
 * mere autoritative storebror i sin egen komponent). Deler border, radius,
 * baggrund, spacing og typografi; adskilles kun af label + accentfarve.
 *
 * Split-editorial: makrofotoet ligger som RENT billede ved siden af teksten
 * (højre på bred skærm, under på mobil) — IKKE et faded baggrundsslør. Teksturen
 * er hele pointen. Uden billede falder noten pænt tilbage til ren tekst.
 */
export function GuideNote({
  label = 'Vidste du?',
  accent = '#7F8F6A',
  image = null,
  imageSide = 'right',
  children,
}: {
  label?: string
  accent?: string
  image?: PotalotMacroOutput | null
  imageSide?: 'left' | 'right'
  children: ReactNode
}) {
  return (
    <aside
      className="my-6 overflow-hidden rounded-[20px]"
      style={{
        background: '#F4F0E5',
        border: '1px solid rgba(45,42,36,0.10)',
      }}
    >
      <div
        className={cn(
          'flex flex-col gap-4 p-5 sm:items-stretch sm:gap-5 sm:p-6',
          image && (imageSide === 'left' ? 'sm:flex-row-reverse' : 'sm:flex-row'),
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className="inline-flex items-center gap-1.5"
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: accent,
              margin: 0,
              marginBottom: 10,
            }}
          >
            <Leaf width={13} height={13} strokeWidth={2} aria-hidden />
            {label}
          </p>
          <div
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 18.5,
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#2D2A24',
            }}
          >
            {children}
          </div>
        </div>

        {image && (
          <div
            className="aspect-[16/10] overflow-hidden rounded-[14px] sm:aspect-auto sm:w-2/5 sm:shrink-0"
            style={{ border: '1px solid rgba(45,42,36,0.10)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </aside>
  )
}
