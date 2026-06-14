import Link from 'next/link'
import type { Plant } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

// Atmosfæriske have-/sæsonfotos (ikke et falsk "dit drivhus"-foto —
// stemning, ikke dokumentation). Roteres pr. sted for variation.
const STEMNINGSFOTOS = [
  '/images/heroes-maaneder/hero-juni-foto.png',
  '/images/heroes-maaneder/hero-maj-foto.png',
  '/images/heroes-maaneder/hero-foraar.png',
  '/images/heroes-maaneder/hero-april-foto.png',
]

/**
 * 📍 MINE STEDER — hvor de levende ting bor.
 *
 * Anna (spec): "Ikke kategorier. Steder. Store destinationskort. Brugeren
 * går ikke ind i en kategori — ind i et sted." Grupperer de aktive planter
 * efter deres faktiske lokation; hvert sted bliver et stort foto-kort med
 * navn + antal. Vandret scroll med peek.
 */
export function MineSteder({ plants }: { plants: Plant[] }) {
  const byLocation = new Map<string, number>()
  for (const p of plants) {
    const loc = p.location?.trim()
    if (!loc) continue
    byLocation.set(loc, (byLocation.get(loc) ?? 0) + (p.quantity ?? 0))
  }
  const steder = [...byLocation.entries()].sort((a, b) => b[1] - a[1])
  if (steder.length === 0) return null

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
        Mine steder
      </h2>

      <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {steder.map(([sted, antal], i) => (
            <Link
              key={sted}
              href="/mine-planter"
              className="group relative block shrink-0 overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-0.5"
              style={{ width: 208, height: 168, borderRadius: 22 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STEMNINGSFOTOS[i % STEMNINGSFOTOS.length]}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(18,22,14,0.10) 0%, rgba(18,22,14,0.28) 50%, rgba(18,22,14,0.74) 100%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p
                  style={{
                    fontFamily: serif,
                    fontWeight: 600,
                    fontSize: 24,
                    lineHeight: 1.05,
                    color: '#FFFFFF',
                    textShadow: '0 1px 10px rgba(18,14,8,0.5)',
                    margin: 0,
                  }}
                >
                  {sted}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: sans,
                    fontSize: 12.5,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: 'rgba(255,255,255,0.86)',
                    textShadow: '0 1px 6px rgba(18,14,8,0.5)',
                    margin: '3px 0 0',
                  }}
                >
                  {antal} {antal === 1 ? 'plante' : 'planter'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
