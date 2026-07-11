import { Flower2, Leaf, Sprout, ShoppingBasket, Shovel } from 'lucide-react'
import type { Minde, MindeKind } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/** Lodret afstand mellem minder — også det stykke stregen bygger bro over. */
const ITEM_GAP = 20
const LINE = '#D8D2BC'
const THUMB_H = 89

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
 * Stregen HØRER TIL de tre minder: den starter præcis ved toppen af øverste
 * foto og slutter ved bunden af det nederste (absolut pr.-item-positionering,
 * ingen margin-gætteri). Kurateret: kun sæsonens førster.
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: ITEM_GAP }}>
        {minder.map((m, i) => (
          <MindeRaekke key={`${m.titel}-${m.dato}`} minde={m} sidst={i === minder.length - 1} />
        ))}
      </div>
    </section>
  )
}

function MindeRaekke({ minde, sidst }: { minde: Minde; sidst: boolean }) {
  const k = minde.kind ? KIND[minde.kind] : NEUTRAL
  const Ikon = k.ikon
  const ChipIkon = chipIkon(minde.kind)

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
      {/* Markør-kolonne — stregen ligger i center af cirklen og flugter
          med fotoets top (første item) hhv. bund (sidste item). */}
      <div style={{ position: 'relative', width: 33, flexShrink: 0 }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 16,
            top: 0,
            width: 1,
            background: LINE,
            zIndex: 0,
            ...(sidst ? { height: THUMB_H } : { bottom: -ITEM_GAP }),
          }}
        />
        {/* Cirkel-center flugter med fotoets midte (89/2 ≈ 44,5). */}
        <div
          style={{ position: 'absolute', top: 28, left: 0, zIndex: 2, width: 33, height: 33, borderRadius: 999, background: k.farve, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px #F4EFE1' }}
        >
          <Ikon className="h-4 w-4" style={{ color: '#FBF7EA' }} aria-hidden strokeWidth={1.9} />
        </div>
      </div>

      {/* Thumbnail — foto eller farvefelt+ikon (200×177 @2x ≈ 100×89) */}
      <div
        style={{ flexShrink: 0, alignSelf: 'flex-start', width: 100, height: THUMB_H, borderRadius: 16, overflow: 'hidden', background: k.felt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {minde.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={minde.imageUrl} alt="" className="h-full w-full object-cover" style={{ display: 'block' }} />
        ) : (
          <Ikon className="h-8 w-8" style={{ color: k.farve }} aria-hidden strokeWidth={1.5} />
        )}
      </div>

      {/* Tekst — dato flugter med billedets overkant */}
      <div style={{ minWidth: 0, paddingTop: 0 }}>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.2em', color: '#74796A', lineHeight: 1, margin: 0 }}>
          {minde.dato}
        </p>
        <p
          style={{ fontFamily: serif, fontWeight: 600, fontSize: 'clamp(19px, 4.4vw, 23px)', lineHeight: 1.08, letterSpacing: '-0.01em', color: '#1F2D1D', margin: '5px 0 0' }}
        >
          {minde.titel}
        </p>
        <p
          style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(15px, 3.6vw, 19px)', lineHeight: 1.25, color: '#687060', margin: '2px 0 0' }}
        >
          {minde.detalje}
        </p>
        {minde.meta && (
          <span
            className="inline-flex items-center"
            style={{ gap: 6, marginTop: 9, fontFamily: sans, fontSize: 11, fontWeight: 500, color: '#5E6658', background: k.felt, borderRadius: 8, padding: '4px 11px' }}
          >
            <ChipIkon className="h-3.5 w-3.5" style={{ color: 'rgba(94,102,88,0.7)' }} aria-hidden strokeWidth={1.8} />
            {minde.meta}
          </span>
        )}
      </div>
    </div>
  )
}
