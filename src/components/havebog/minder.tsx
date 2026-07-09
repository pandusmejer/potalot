import { Flower2, Leaf, Sprout, ShoppingBasket, Shovel } from 'lucide-react'
import type { Minde, MindeKind } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/** Lodret afstand mellem minder — også det stykke stregen bygger bro over. */
const ITEM_GAP = 52
const LINE = '#D8D2BC'

interface Props {
  minder: Minde[]
}

/** Markør + farvefelt + ikon pr. milepæl-type. */
const KIND: Record<MindeKind, { circle: string; felt: string; feltIkon: string; ikon: typeof Leaf }> = {
  knop: { circle: '#C88396', felt: '#D8B2B8', feltIkon: '#8A5D66', ikon: Flower2 },
  blomst: { circle: '#C88396', felt: '#D8B2B8', feltIkon: '#8A5D66', ikon: Flower2 },
  hoest: { circle: '#6F7758', felt: '#DCE2D0', feltIkon: '#6D7757', ikon: Leaf },
  spire: { circle: '#6F7758', felt: '#DCE2D0', feltIkon: '#6D7757', ikon: Sprout },
  saaning: { circle: '#C79A36', felt: '#E8DEBE', feltIkon: '#B98F34', ikon: Sprout },
  udplantning: { circle: '#8B9774', felt: '#DDE1D0', feltIkon: '#6D7757', ikon: Shovel },
}
const NEUTRAL = { circle: '#8F9484', felt: '#E4E0D0', feltIkon: '#8F9484', ikon: Leaf }

/** Chip-ikon — høst måles i kurven, alt andet i bakken. */
function chipIkon(kind?: MindeKind) {
  return kind === 'hoest' ? ShoppingBasket : Sprout
}

/**
 * Kapitel 4: "Minder" — sæsonens levende tidslinje (V10, havebog.md).
 *
 * Små sanselige nedslag: farvet markør pr. milepæl-type, 96×96 foto (eller
 * farvefelt+ikon), stramt teksthierarki. Bevidst ANDERLEDES end "Historien
 * fortsætter" (arkiv). Kurateret: kun sæsonens førster, max 3.
 *
 * Stregen HØRER TIL de tre minder, ikke til hele sektionen: den starter
 * præcis ved toppen af øverste foto og slutter ved bunden af det nederste.
 * Løst med absolut positionering pr. item (ingen margin-gætteri), så den
 * flugter uanset hvor mange linjer teksten fylder.
 */
export function Minder({ minder }: Props) {
  if (minder.length === 0) return null

  return (
    <section>
      <p
        className="uppercase"
        style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', margin: '0 0 8px' }}
      >
        Minder
      </p>
      <p
        style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 22, lineHeight: 1.15, color: '#7A8170', margin: '0 0 54px' }}
      >
        Sæsonens små vendepunkter
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: ITEM_GAP }}>
        {minder.map((m, i) => (
          <MindeRaekke key={`${m.titel}-${m.dato}`} minde={m} foerst={i === 0} sidst={i === minder.length - 1} />
        ))}
      </div>
    </section>
  )
}

function MindeRaekke({ minde, foerst, sidst }: { minde: Minde; foerst: boolean; sidst: boolean }) {
  const k = minde.kind ? KIND[minde.kind] : NEUTRAL
  const Ikon = k.ikon
  const ChipIkon = chipIkon(minde.kind)

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      {/* Ikon-/tidslinje-kolonne (48px). Stregen ligger i center af cirklen. */}
      <div style={{ position: 'relative', width: 48, flexShrink: 0, marginRight: 14 }}>
        {/* Streg: fra fotoets top; bygger bro over gap'et til næste item.
            Sidste item stopper præcis ved fotoets bund (96px). */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 23,
            top: 0,
            width: 1,
            background: LINE,
            zIndex: 0,
            ...(sidst ? { height: 96 } : { bottom: -ITEM_GAP }),
          }}
        />
        {/* Cirkel — center flugter med fotoets lodrette midte (96/2 = 48). */}
        <div
          style={{ position: 'absolute', top: 26, left: 2, zIndex: 2, width: 44, height: 44, borderRadius: 999, background: k.circle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ikon style={{ width: 21, height: 21, color: '#F7F1DF' }} aria-hidden strokeWidth={1.8} />
        </div>
      </div>

      {/* Foto/farvefelt (96×96) */}
      <div
        style={{ flexShrink: 0, alignSelf: 'flex-start', width: 96, height: 96, borderRadius: 18, overflow: 'hidden', marginRight: 24, background: k.felt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {minde.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={minde.imageUrl} alt="" className="h-full w-full object-cover" style={{ display: 'block' }} />
        ) : (
          <Ikon style={{ width: 38, height: 38, color: k.feltIkon }} aria-hidden strokeWidth={1.6} />
        )}
      </div>

      {/* Tekst — optisk lidt højere end fotoets midte */}
      <div style={{ minWidth: 0, flex: 1, paddingTop: 10 }}>
        <p className="uppercase" style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.22em', color: '#8F9484', lineHeight: 1, margin: '0 0 12px' }}>
          {minde.dato}
        </p>
        <p style={{ fontFamily: serif, fontWeight: 400, fontSize: 32, lineHeight: 1.02, color: '#1F2D1D', margin: '0 0 4px' }}>
          {minde.titel}
        </p>
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 22, lineHeight: 1.1, color: '#6F7666', margin: '2px 0 0' }}>
          {minde.detalje}
        </p>
        {minde.meta && (
          <span
            className="inline-flex items-center"
            style={{ marginTop: 14, height: 28, padding: '0 12px', borderRadius: 999, background: '#E8E1CF', color: '#6D7466', fontFamily: sans, fontSize: 13, fontWeight: 600, gap: 6 }}
          >
            <ChipIkon style={{ width: 14, height: 14, color: 'rgba(109,116,102,0.75)' }} aria-hidden strokeWidth={1.8} />
            {minde.meta}
          </span>
        )}
      </div>
    </div>
  )
}
