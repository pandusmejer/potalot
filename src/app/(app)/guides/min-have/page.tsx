import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'
import { ALL_GUIDES } from '@/data/guides-demo'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { buildMineHaveGuides } from '@/lib/guides/min-have'

export const dynamic = 'force-dynamic'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * /guides/min-have — hele det personlige udvalg (arts- OG sortsguides),
 * prioriteret som på forsiden men uden cap. Forsiden viser 3-4; her er alt.
 */
export default async function MinHavePage() {
  const [guides, inventory] = await Promise.all([
    getAllGuides(),
    getAllInventoryItems(),
  ])
  const isDemo = guides.length === 0
  const visibleGuides = isDemo ? ALL_GUIDES : IMPORTED_GUIDES

  const items = buildMineHaveGuides(
    visibleGuides,
    inventory,
    new Date().getMonth() + 1,
  ).map(it => {
    const g = it.guide
    const isVar = it.kind === 'variety'
    const { src } = resolvePotalotImage({
      guideId: g.id,
      speciesSlug: isVar ? g.parentGuideId ?? g.id : g.id,
      varietySlug: isVar ? g.id : null,
      role: isVar ? 'variety-hero' : 'species-hero',
      preferredSrc: g.primaryImageId,
    })
    return {
      guideId: g.id,
      title: isVar ? g.variety ?? g.plantName : g.plantName,
      subtitle: isVar ? `${it.plantName} · Sortsguide` : 'Artsguide',
      imageSrc: src ?? null,
    }
  })

  return (
    <div className="relative -mx-4 -mt-6 min-h-screen bg-[#EAE6D8] px-4 pb-16 pt-6">
      <style>{`.app-canvas{background-color:#EAE6D8;}`}</style>

      <Link
        href="/guides"
        className="inline-flex items-center gap-1.5 no-underline"
        style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.6)' }}
      >
        <ArrowLeft size={15} strokeWidth={2.2} aria-hidden />
        Guides
      </Link>

      <header className="mt-4">
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(36,48,31,0.5)',
            margin: 0,
          }}
        >
          I din have
        </p>
        <h1
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 'clamp(36px, 11vw, 48px)',
            lineHeight: 1.04,
            color: '#242019',
            margin: '6px 0 0',
          }}
        >
          Guides til det, du dyrker
        </h1>
        <p
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 500,
            color: 'rgba(36,48,31,0.6)',
            margin: '8px 0 0',
          }}
        >
          {items.length} {items.length === 1 ? 'guide' : 'guider'} · art og sort
        </p>
      </header>

      <div className="mt-6 space-y-2.5">
        {items.map(it => (
          <Link
            key={it.guideId}
            href={`/guides/${it.guideId}`}
            className="group flex items-center gap-3.5 overflow-hidden no-underline"
            style={{
              background: 'rgba(244,240,229,0.96)',
              border: '1px solid rgba(45,42,36,0.10)',
              borderRadius: 16,
              color: 'inherit',
            }}
          >
            <span className="relative h-[68px] w-[68px] shrink-0 overflow-hidden bg-[#EAE6D8]">
              {it.imageSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.imageSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                />
              )}
            </span>
            <span className="min-w-0 flex-1 py-2">
              <span
                className="block truncate"
                style={{ fontFamily: plex, fontWeight: 600, fontSize: 19, lineHeight: 1.05, color: '#242019' }}
              >
                {it.title}
              </span>
              <span
                className="mt-0.5 block truncate"
                style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: 'rgba(36,48,31,0.5)' }}
              >
                {it.subtitle}
              </span>
            </span>
            <ChevronRight
              size={18}
              strokeWidth={2}
              className="mr-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              style={{ color: 'rgba(36,48,31,0.3)' }}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
