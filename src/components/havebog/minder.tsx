import { Flower2, Leaf, Sprout, ShoppingBasket, Shovel } from 'lucide-react'
import type { Minde, MindeKind } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  minder: Minde[]
}

/** Markørfarve + ikon pr. milepæl-type — sanselige nedslag, ikke pynt. */
const KIND: Record<MindeKind, { farve: string; felt: string; ikon: typeof Leaf }> = {
  knop: { farve: '#C1899A', felt: '#EBD9DD', ikon: Flower2 },   // støvet rosa
  blomst: { farve: '#C1899A', felt: '#EBD9DD', ikon: Flower2 },
  hoest: { farve: '#7C8560', felt: '#DCE0CD', ikon: Leaf },      // salvie
  spire: { farve: '#7C8560', felt: '#DCE0CD', ikon: Sprout },
  saaning: { farve: '#C0994E', felt: '#EBDFC1', ikon: Sprout },  // varm sand / hø
  udplantning: { farve: '#8B9774', felt: '#DDE1D0', ikon: Shovel },
}
const NEUTRAL = { farve: '#8F9484', felt: '#E4E0D0', ikon: Leaf }

/** Chip-ikon — høst måles i kurven, såning i bakken. */
function chipIkon(kind?: MindeKind) {
  if (kind === 'hoest') return ShoppingBasket
  return Sprout
}

/**
 * Kapitel 4: "Minder" — sæsonens levende tidslinje (V9, havebog.md).
 *
 * Ikke længere en poetisk tekstliste på creme, men en tidslinje med små
 * sanselige nedslag: farvet markør pr. milepæl-type, thumbnail (eller
 * farvefelt+ikon), dato/titel/sort og en lille meta-chip. Skal føles
 * levende — i modsætning til "Historien fortsætter", der er arkiv.
 *
 * Kurateret: kun sæsonens førster (høst, knop, såning, udplantning).
 * Ingen minder endnu → kapitlet udelades helt.
 */
export function Minder({ minder }: Props) {
  if (minder.length === 0) return null

  return (
    <section>
      <p
        className="uppercase"
        style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.24em', color: 'rgba(36,48,31,0.50)', margin: 0 }}
      >
        Minder
      </p>
      <p
        style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(17px, 3.9vw, 20px)', color: 'rgba(36,48,31,0.55)', margin: '4px 0 22px' }}
      >
        Sæsonens små vendepunkter
      </p>

      <div style={{ position: 'relative' }}>
        {/* Tynd lodret tidslinje bag markørerne */}
        <div
          aria-hidden
          style={{ position: 'absolute', left: 16, top: 14, bottom: 14, width: 1, background: 'rgba(36,48,31,0.14)' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {minder.map((m, i) => (
            <MindeRaekke key={`${m.titel}-${m.dato}`} minde={m} foerst={i === 0} />
          ))}
        </div>
      </div>
    </section>
  )
}

function MindeRaekke({ minde, foerst }: { minde: Minde; foerst: boolean }) {
  const k = minde.kind ? KIND[minde.kind] : NEUTRAL
  const Ikon = k.ikon
  const ChipIkon = chipIkon(minde.kind)

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* Markør på tidslinjen */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, marginTop: 28 }}>
        <div
          style={{ width: 33, height: 33, borderRadius: 999, background: k.farve, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px #F4EFE1' }}
        >
          <Ikon className="h-4 w-4" style={{ color: '#FBF7EA' }} aria-hidden strokeWidth={1.9} />
        </div>
      </div>

      {/* Thumbnail — foto eller farvefelt+ikon (200×177 @2x ≈ 100×89) */}
      <div
        style={{ flexShrink: 0, width: 100, height: 89, borderRadius: 16, overflow: 'hidden', background: k.felt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {minde.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={minde.imageUrl} alt="" className="h-full w-full object-cover" style={{ display: 'block' }} />
        ) : (
          <Ikon className="h-8 w-8" style={{ color: k.farve }} aria-hidden strokeWidth={1.5} />
        )}
      </div>

      {/* Tekst */}
      <div style={{ minWidth: 0, paddingTop: 2 }}>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', color: '#8F9484', margin: 0 }}>
          {minde.dato}
        </p>
        <p
          style={{ fontFamily: serif, fontWeight: 500, fontSize: foerst ? 'clamp(26px, 6vw, 32px)' : 'clamp(22px, 5vw, 28px)', lineHeight: 1.08, letterSpacing: '-0.01em', color: '#1F2D1D', margin: '3px 0 0' }}
        >
          {minde.titel}
        </p>
        <p
          style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(17px, 4vw, 21px)', lineHeight: 1.25, color: '#687060', margin: '2px 0 0' }}
        >
          {minde.detalje}
        </p>
        {minde.meta && (
          <span
            className="inline-flex items-center"
            style={{ gap: 6, marginTop: 9, fontFamily: sans, fontSize: 12, fontWeight: 600, color: '#5E6658', background: 'rgba(94,102,88,0.10)', borderRadius: 999, padding: '4px 11px' }}
          >
            <ChipIkon className="h-3.5 w-3.5" style={{ color: 'rgba(94,102,88,0.7)' }} aria-hidden strokeWidth={1.8} />
            {minde.meta}
          </span>
        )}
      </div>
    </div>
  )
}
