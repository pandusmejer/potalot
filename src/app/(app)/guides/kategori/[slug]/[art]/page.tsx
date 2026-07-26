import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Guide } from '@/lib/types'
import { getAllGuides } from '@/actions/guides'
import { getAllInventoryItems } from '@/actions/froebank'
import { ALL_GUIDES } from '@/data/guides-demo'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { looseKey } from '@/lib/guides/min-have'
import {
  libraryCategoryOf,
  LIBRARY_CATEGORY_ORDER,
  LIBRARY_CATEGORY_LABEL,
  type LibraryCategory,
} from '@/data/guide-library-categories'
import { BiblioRow } from '@/components/guides/guides-bibliotek'

export const dynamic = 'force-dynamic'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
const plex = 'var(--font-plex-condensed), sans-serif'

/**
 * Artssamling — /guides/kategori/[slug]/[art]. AFLEDT VIEW (intet nyt content-
 * objekt): art-hero + link til artsguiden + Dine sorter + Andre sorter + teknikker
 * til arten. Løser "find en sortsguide UDEN at åbne artsguiden". Samlingen =
 * navigation; artsguiden = indhold. To forskellige objekter.
 */
export default async function ArtssamlingPage({
  params,
}: {
  params: Promise<{ slug: string; art: string }>
}) {
  const { slug, art } = await params
  if (!(LIBRARY_CATEGORY_ORDER as readonly string[]).includes(slug)) notFound()
  const category = slug as LibraryCategory

  const [guides, inventory] = await Promise.all([
    getAllGuides(),
    getAllInventoryItems(),
  ])
  const isDemo = guides.length === 0
  const visibleGuides = isDemo ? ALL_GUIDES : IMPORTED_GUIDES

  const species = visibleGuides.find(
    g => g.id === art && g.guideLevel === 'species',
  )
  if (!species || libraryCategoryOf(species.plantName) !== category) notFound()

  const varieties = visibleGuides
    .filter(g => g.guideLevel === 'variety' && g.parentGuideId === species.id)
    .sort((a, b) => (a.variety ?? '').localeCompare(b.variety ?? '', 'da'))

  const techniques = IMPORTED_GUIDES.filter(
    g => g.guideLevel === 'technique' && (g.appliesTo ?? []).includes(species.id),
  )

  // Brugerens sorter af DENNE art (loose match mod frøbanken).
  const froeVarietyKeys = new Set(
    inventory
      .filter(i => looseKey(i.name) === looseKey(species.plantName))
      .map(i => (i.variety ? looseKey(i.variety) : ''))
      .filter(Boolean),
  )
  const dineSorter = varieties.filter(
    v => v.variety && froeVarietyKeys.has(looseKey(v.variety)),
  )
  const andreSorter = varieties.filter(v => !dineSorter.includes(v))

  const heroImg = resolvePotalotImage({
    guideId: species.id,
    speciesSlug: species.id,
    varietySlug: null,
    role: 'species-hero',
    preferredSrc: species.primaryImageId,
  }).src

  return (
    <div className="relative -mx-4 -mt-6 min-h-screen bg-[#EAE6D8] px-4 pb-16 pt-6">
      <style>{`.app-canvas{background-color:#EAE6D8;}`}</style>

      <Link
        href={`/guides/kategori/${category}`}
        className="inline-flex items-center gap-1.5 no-underline"
        style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: 'rgba(36,48,31,0.6)' }}
      >
        <ArrowLeft size={15} strokeWidth={2.2} aria-hidden />
        {LIBRARY_CATEGORY_LABEL[category]}
      </Link>

      {/* Stor art-hero */}
      <div
        className="relative mt-4 overflow-hidden"
        style={{ borderRadius: 22, aspectRatio: '3 / 2.1', border: '1px solid rgba(45,42,36,0.10)', background: '#EAE6D8' }}
      >
        {heroImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(24,20,14,0.05) 35%, rgba(24,20,14,0.7) 100%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h1
            style={{
              fontFamily: plex,
              fontWeight: 600,
              fontSize: 'clamp(34px, 11vw, 46px)',
              lineHeight: 0.98,
              color: '#FFF',
              margin: 0,
              letterSpacing: '-0.01em',
              textShadow: '0 2px 14px rgba(20,14,8,0.5)',
            }}
          >
            {species.plantName}
          </h1>
          {species.latinName && (
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontSize: 15,
                color: 'rgba(255,255,255,0.85)',
                margin: '2px 0 0',
              }}
            >
              {species.latinName}
            </p>
          )}
        </div>
      </div>

      {/* Navigations-undertitel (ikke artikel-ingress): samlingen HJÆLPER dig
          videre — den ER ikke indholdet. */}
      <p
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontSize: 16,
          lineHeight: 1.35,
          color: 'rgba(36,48,31,0.6)',
          margin: '12px 0 0',
        }}
      >
        Find guide til {species.plantName.toLowerCase()} og dine sorter.
      </p>

      {/* CTA-hierarki: kommer brugeren fra "I DIN HAVE → Tomat", er deres EGEN
          have vigtigere end latin + hero. Dine sorter først, så alle sorter, så
          artsguiden som tydelig men SEPARAT mulighed, teknikker nederst. */}
      {dineSorter.length > 0 && (
        <SortSektion titel="Dine sorter" sorter={dineSorter} species={species} />
      )}
      {andreSorter.length > 0 && (
        <SortSektion
          titel={dineSorter.length > 0 ? 'Andre sorter' : 'Sorter'}
          sorter={andreSorter}
          species={species}
        />
      )}

      {/* Læs artsguiden — indholdet. Tydelig, men SEPARAT fra sort-navigationen
          og bevidst UNDER sorterne (ikke en dominerende hero-CTA). */}
      <Link
        href={`/guides/${species.id}`}
        className="group mt-8 flex items-center justify-between gap-3 no-underline"
        style={{
          background: 'rgba(86,111,60,0.10)',
          border: '1px solid rgba(86,111,60,0.22)',
          borderRadius: 16,
          padding: '14px 16px',
          color: 'inherit',
        }}
      >
        <span>
          <span className="block" style={{ fontFamily: plex, fontWeight: 600, fontSize: 18, color: '#233019' }}>
            Læs artsguiden
          </span>
          <span className="mt-0.5 block" style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 500, color: 'rgba(36,48,31,0.55)' }}>
            Fra såning til sidste høst · {varieties.length} {varieties.length === 1 ? 'sort' : 'sorter'}
          </span>
        </span>
        <ArrowRight size={18} strokeWidth={2} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: '#4B6636' }} />
      </Link>

      {techniques.length > 0 && (
        <section className="mt-8">
          <SektionsLabel>Teknikker til {species.plantName.toLowerCase()}</SektionsLabel>
          <div className="mt-3 space-y-2">
            {techniques.map(t => (
              <BiblioRow key={t.id} guide={t} teknik />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SortSektion({
  titel,
  sorter,
  species,
}: {
  titel: string
  sorter: Guide[]
  species: Guide
}) {
  return (
    <section className="mt-8">
      <SektionsLabel>{titel}</SektionsLabel>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {sorter.map(v => {
          const img = resolvePotalotImage({
            guideId: v.id,
            speciesSlug: species.id,
            varietySlug: v.id,
            role: 'variety-hero',
            preferredSrc: v.primaryImageId,
          }).src
          return (
            <Link
              key={v.id}
              href={`/guides/${v.id}`}
              className="group relative overflow-hidden no-underline"
              style={{
                aspectRatio: '3 / 3.1',
                borderRadius: 16,
                border: '1px solid rgba(45,42,36,0.10)',
                background: '#EAE6D8',
                color: 'inherit',
              }}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              )}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(24,20,14,0.02) 45%, rgba(24,20,14,0.66) 100%)' }}
              />
              <span
                className="absolute inset-x-0 bottom-0 truncate p-3"
                style={{
                  fontFamily: plex,
                  fontWeight: 600,
                  fontSize: 18,
                  color: '#FFF',
                  textShadow: '0 2px 12px rgba(20,14,8,0.5)',
                }}
              >
                {v.variety}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function SektionsLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: sans,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'rgba(36,48,31,0.6)',
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}
