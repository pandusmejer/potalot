import Link from 'next/link'
import { ArrowLeft, Leaf, MoreHorizontal } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

/**
 * 🌱 PLANTE-DETALJE-HERO — værkstedets forside, magasin-stil.
 *
 * Spec (Anna, 14. juni 2026): "Planter handler om de levende ting, du har
 * ansvar for. Det bør kunne mærkes i første scroll." Fuldbredde makrofoto
 * bærer stemningen; ART-pillen + sortsnavn (stor serif) + karakter-
 * beskrivelsen ligger over fotoets nedtoning, så typografien er
 * hovedpersonen — ikke et data-panel.
 *
 * Fotoet fader til var(--background) i bunden, så hero smelter sammen med
 * siden uden søm (virker på tværs af temaer).
 */
export function PlantDetailHero({
  art,
  sort,
  beskrivelse,
  foto,
  fotoAlt,
}: {
  art: string
  sort: string | null
  beskrivelse: string | null
  foto: string | null
  fotoAlt: string
}) {
  return (
    <header className="relative -mx-4 -mt-6">
      {/* FOTO — fuldbredde, fader ned i sidens baggrund. */}
      <div className="relative h-[300px] w-full overflow-hidden">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={fotoAlt} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: '#617345' }} />
        )}
        {/* Top-scrim til knap-læsbarhed + bund-fade til baggrunden. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(18,22,14,0.34) 0%, rgba(18,22,14,0.04) 22%, transparent 42%, var(--background) 96%)',
          }}
        />
      </div>

      {/* NAV — tilbage + menu, svæver på fotoet. */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <Link
          href="/mine-planter"
          aria-label="Tilbage til Mine planter"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white backdrop-blur-sm transition-transform active:scale-95"
          style={{ background: 'rgba(20,26,16,0.42)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </Link>
        <button
          type="button"
          aria-label="Flere handlinger"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white backdrop-blur-sm transition-transform active:scale-95"
          style={{ background: 'rgba(20,26,16,0.42)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* TITEL — over fotoets nedtoning, i mørk skrift på den lyse bund. */}
      <div className="relative -mt-[96px] px-1">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 uppercase"
          style={{
            background: '#DCE6CE',
            color: '#3D5130',
            fontFamily: sans,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
          }}
        >
          <Leaf className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          {art}
        </span>
        <h1
          className="mt-3"
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 'clamp(44px, 13vw, 58px)',
            lineHeight: 0.98,
            letterSpacing: '-0.005em',
            color: '#24301F',
          }}
        >
          {sort ?? art}
        </h1>
        {beskrivelse && (
          <p
            className="mt-3 max-w-[34ch]"
            style={{
              fontFamily: sans,
              fontSize: 15.5,
              fontWeight: 400,
              lineHeight: 1.5,
              color: 'rgba(36,48,31,0.74)',
            }}
          >
            {beskrivelse}
          </p>
        )}
      </div>
    </header>
  )
}
