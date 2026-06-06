/**
 * GuideArticle — delt server-component der renderer en hel guide-detail.
 *
 * Bruges af:
 *   - src/app/(app)/guides/[id]/page.tsx (live route, debug=false)
 *   - src/app/(app)/guides/qa/sort-full/page.tsx (debug=true, San Marzano)
 *   - src/app/(app)/guides/qa/art-full/page.tsx (debug=true, Tomat)
 *
 * Når debug=true rendres en lille teknisk DebugBlock-strip foran hver
 * sektion med komponentnavnet. Det er kun synligt på QA-routes.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuickFactsCard } from '@/components/guides/quick-facts'
import { GuideNotesCard } from '@/components/guides/guide-notes-card'
import { UserGuideEditDialog } from '@/components/guides/user-guide-edit-dialog'
import { TrustBadge, guideKindFor } from '@/components/guides/trust-badge'
import { SaadanDyrkerDu } from '@/components/guides/saadan-dyrker-du'
import { VidsteDuMedMakro } from '@/components/guides/vidste-du-med-makro'
import { PotalotTipMedMakro } from '@/components/guides/potalot-tip-med-makro'
import { GuidePotalotNote } from '@/components/guides/guide-potalot-note'
import { GuideNextCard } from '@/components/guides/guide-next-card'
import { KalenderRytmeKapitel } from '@/components/guides/kalender-rytme-kapitel'
import {
  GuideComparisonList,
  type ComparisonRow,
} from '@/components/guides/guide-comparison'
import { CalendarDays, Circle, Leaf, Sprout as SproutIcon } from 'lucide-react'
import { mergeGuide } from '@/lib/guide-merge'
import { getGuide, getAllGuides } from '@/actions/guides'
import { getMyGuideNote } from '@/actions/guide-notes'
import { getAllInventoryItems } from '@/actions/froebank'
import { getAllPlants } from '@/actions/mine-planter'
import { getCurrentUser } from '@/lib/auth'
import { PRIMARY_CATEGORIES } from '@/lib/constants'
import { ALL_GUIDES } from '@/data/guides-demo'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import type { Guide } from '@/lib/types'
import { resolvePotalotMacro } from '@/lib/images/resolve-potalot-image'
import { ArrowLeft, BookOpen, Package, Sprout, ArrowRight } from 'lucide-react'

interface GuideArticleProps {
  id: string
  returnTo?: string
  /** Når true: vis tekniske DebugBlock-strips foran hver guide-sektion. */
  debug?: boolean
}

/**
 * Lille teknisk strip der markerer hvilken komponent der følger.
 * Kun synlig når debug=true. Bevidst hard-coded styling så den ikke
 * smelter sammen med ægte UI — den SKAL stikke ud.
 */
function DebugBlock({ name, note }: { name: string; note?: string }) {
  return (
    <div
      className="my-1.5 inline-flex items-center gap-2 rounded-md px-2.5 py-1"
      style={{
        background: '#2D2A24',
        color: '#F4F0E5',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1.2,
      }}
    >
      <span style={{ opacity: 0.6 }}>▶</span>
      <span>{name}</span>
      {note && <span style={{ opacity: 0.65 }}>· {note}</span>}
    </div>
  )
}

export async function GuideArticle({
  id,
  returnTo,
  debug = false,
}: GuideArticleProps) {
  // ── Data-loading ────────────────────────────────────────────
  let original: Guide | null = IMPORTED_GUIDES.find((g) => g.id === id) ?? null
  let isDemo = original !== null
  if (!original) {
    original = await getGuide(id)
  }
  if (!original) {
    const demoMatch = ALL_GUIDES.find((g) => g.id === id)
    if (demoMatch) {
      original = demoMatch
      isDemo = true
    }
  }
  if (!original) notFound()

  const safeReturnTo =
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo
      : '/guides'

  const currentUser = await getCurrentUser()

  const [allGuides, inventory, plants, myNote] = await Promise.all([
    isDemo ? Promise.resolve(ALL_GUIDES) : getAllGuides(),
    getAllInventoryItems(),
    getAllPlants(),
    !isDemo && currentUser ? getMyGuideNote(id) : Promise.resolve(null),
  ])

  const { effective, inheritedFromParent, parent } = mergeGuide(
    original,
    allGuides,
  )

  const sortsvarianter =
    original.guideLevel === 'species'
      ? allGuides.filter((g) => g.parentGuideId === original.id)
      : []

  const linkedInventory = inventory.filter(
    (i) => i.guideId === effective.id || i.guideId === parent?.id,
  )
  const linkedPlants = plants.filter(
    (p) => p.guideId === effective.id || p.guideId === parent?.id,
  )

  const cat = PRIMARY_CATEGORIES[effective.primaryCategoryId]
  const isOwner = !!currentUser && original.visibility === 'private'

  const nextGuide = effective.sections.find((s) => s.kind === 'next')

  const aiIds = isDemo
    ? new Set((await import('@/data/guides-demo')).DEMO_AI_GUIDE_IDS)
    : null
  const kind = guideKindFor(original, aiIds)

  // Makro-strategi
  const usedMacroSrcs = new Set<string>()
  const factImage = resolvePotalotMacro({
    guideId: effective.id,
    slot: 'fact',
    preferredRoles: ['structure', 'fruit', 'detail'],
    avoidSrcs: usedMacroSrcs,
    cropProfile: 'soft-right',
  })
  if (factImage) usedMacroSrcs.add(factImage.src)
  const noteImage = resolvePotalotMacro({
    guideId: effective.id,
    slot: 'note',
    preferredRoles: ['atmosphere', 'detail', 'fruit'],
    avoidSrcs: usedMacroSrcs,
    cropProfile: 'soft-left',
  })
  if (noteImage) usedMacroSrcs.add(noteImage.src)
  const tipImage = resolvePotalotMacro({
    guideId: effective.id,
    slot: 'tip',
    preferredRoles: ['leaf', 'structure', 'atmosphere'],
    avoidSrcs: usedMacroSrcs,
    cropProfile: 'top-band',
  })
  if (tipImage) usedMacroSrcs.add(tipImage.src)

  // Bleed-ankre
  const isSpecies = effective.guideLevel === 'species'
  const bleedAnchorPatterns: RegExp[] = isSpecies
    ? [
        /^om (planten|arten)/i,
        /pleje|dyrkningsforhold|udplantning/i,
        /sygdomme|typiske fejl|udfordringer/i,
      ]
    : [
        /^om sorten/i,
        /smag|anvendelse/i,
        /næste|kalender|opbind|knib/i,
      ]
  const bleedAfter: Record<
    string,
    NonNullable<ReturnType<typeof resolvePotalotMacro>>
  > = {}
  const matchedAnchors = new Set<number>()
  for (const section of effective.sections) {
    if (matchedAnchors.size >= 3) break
    const title = section.title
    const sectionKey = section.key
    if (!title || !sectionKey) continue
    const anchorIdx = bleedAnchorPatterns.findIndex(
      (re, idx) => !matchedAnchors.has(idx) && re.test(title),
    )
    if (anchorIdx === -1) continue
    const bleed = resolvePotalotMacro({
      guideId: effective.id,
      slot: `bleed:${sectionKey}`,
      preferredRoles: ['detail', 'structure', 'fruit', 'atmosphere'],
      avoidSrcs: usedMacroSrcs,
    })
    if (!bleed) continue
    usedMacroSrcs.add(bleed.src)
    bleedAfter[sectionKey] = bleed
    matchedAnchors.add(anchorIdx)
  }

  return (
    <article className="max-w-3xl space-y-10 overflow-x-clip pb-6 sm:space-y-12">
      {debug && <DebugBlock name="Header" note="identitet + trust-badge" />}
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href={safeReturnTo} aria-label="Tilbage">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          {isOwner && !isDemo && <UserGuideEditDialog guide={original} />}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <TrustBadge kind={kind} size="sm" />
            <span
              className="text-xs uppercase tracking-wider"
              style={{
                color: 'rgba(36,48,31,0.55)',
                fontWeight: 600,
                letterSpacing: '0.18em',
              }}
            >
              {cat.name}
              {original.guideLevel === 'variety' && parent && ' · sortsvariant'}
              {original.guideLevel === 'species' && ' · artsguide'}
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontWeight: 500,
              fontSize: 'clamp(36px, 8vw, 48px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              color: '#2D2A24',
              margin: 0,
            }}
          >
            {effective.variety ?? effective.plantName}
          </h1>
          {effective.variety && (
            <p
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: '#6A665C',
                margin: 0,
                marginTop: 4,
              }}
            >
              {effective.plantName}
            </p>
          )}
          {effective.latinName && (
            <p
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(17px, 3vw, 20px)',
                fontWeight: 400,
                color: '#2D2A24',
                opacity: 0.72,
                margin: 0,
                marginTop: 8,
              }}
            >
              {effective.latinName}
            </p>
          )}
        </div>

        {original.parentGuideId && parent && original.visibility === 'private' && (
          <p
            style={{
              fontFamily: 'var(--font-manrope)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'rgba(36,48,31,0.60)',
              margin: 0,
            }}
          >
            Baseret på Potalot-guiden om {parent.plantName}.
          </p>
        )}
      </header>

      {effective.primaryImageId && (
        <>
          {debug && <DebugBlock name="Hovedbillede" note="primaryImageId" />}
          <div
            className="overflow-hidden"
            style={{
              borderRadius: 24,
              border: '1px solid rgba(45,42,36,0.06)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={effective.primaryImageId}
              alt={effective.plantName}
              className="w-full object-cover"
              style={{ aspectRatio: '4/5', maxHeight: 420 }}
            />
          </div>
        </>
      )}

      {parent && (
        <>
          {debug && <DebugBlock name="ArtsguideLink" />}
          <Card className="bg-secondary/30 border-secondary">
            <CardContent className="flex items-center gap-3 py-3 flex-wrap">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="text-sm flex-1 min-w-[180px]">
                Sortsvariant af <strong>{parent.plantName}</strong>. Felter
                uden override arves fra artsguiden.
              </p>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/guides/${parent.id}`}>
                  Se artsguide <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {debug && <DebugBlock name="QuickFactsCard" note="1. Hurtigt overblik" />}
      <QuickFactsCard guide={effective} inheritedFields={inheritedFromParent} />

      {debug && (
        <DebugBlock
          name="SaadanDyrkerDu"
          note={`2. Sådan dyrker du — prose + ${Object.keys(bleedAfter).length} bleeds`}
        />
      )}
      <SaadanDyrkerDu
        sections={effective.sections}
        factMacroImage={factImage}
        bleedAfter={bleedAfter}
      />

      {effective.variety === 'San Marzano' && (
        <>
          {debug && <DebugBlock name="VidsteDuMedMakro" note="signatur 1/3" />}
          <VidsteDuMedMakro macroImage={noteImage} intensity="soft">
            San Marzano har fast frugtkød og lavt vandindhold, hvilket gør
            sorten særlig velegnet til sauce og konservering.
          </VidsteDuMedMakro>
        </>
      )}

      {(() => {
        const chapters = buildKalenderChapters(effective.calendarRules)
        if (chapters.length === 0) return null
        return (
          <>
            {debug && (
              <DebugBlock
                name="KalenderRytmeKapitel"
                note={`3. Kalender — ${chapters.length} kapitler`}
              />
            )}
            <KalenderRytmeKapitel chapters={chapters} />
          </>
        )
      })()}

      {linkedInventory.length > 0 || linkedPlants.length > 0 ? (
        <>
          {debug && (
            <DebugBlock
              name="DineEgne"
              note={`4. Frøbank ${linkedInventory.length} + planter ${linkedPlants.length}`}
            />
          )}
          <Card className="bg-secondary/20 border-secondary">
            <CardContent className="space-y-3 py-4">
              <p
                style={{
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(36,48,31,0.55)',
                  margin: 0,
                }}
              >
                Dine egne
              </p>
              {linkedInventory.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    I din frøbank
                  </p>
                  <div className="space-y-1.5">
                    {linkedInventory.map((item) => (
                      <Link
                        key={item.id}
                        href={`/froebank/${item.id}`}
                        className="flex items-center gap-2 text-sm hover:underline"
                      >
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.name}
                        {item.variety ? ` — ${item.variety}` : ''}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {linkedPlants.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    Aktive dyrkninger
                  </p>
                  <div className="space-y-1.5">
                    {linkedPlants.map((plant) => (
                      <Link
                        key={plant.id}
                        href={`/mine-planter/${plant.id}`}
                        className="flex items-center gap-2 text-sm hover:underline"
                      >
                        <Sprout className="h-3.5 w-3.5 text-muted-foreground" />
                        {plant.name}
                        {plant.variety ? ` — ${plant.variety}` : ''}
                        {plant.isArchived && plant.archivedYear && (
                          <Badge variant="muted" className="text-[9px]">
                            Arkiv {plant.archivedYear}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {debug && (
            <DebugBlock name="DinHave (tom-tilstand)" note="4F — buffer" />
          )}
          <section
            className="rounded-[28px] px-6 py-7"
            style={{
              background: '#F4F0E5',
              border: '1px solid rgba(36,48,31,0.10)',
            }}
          >
            <p
              className="m-0 uppercase"
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.18em',
                lineHeight: 1.25,
                color: '#7F8F6A',
              }}
            >
              Din have
            </p>
            <h3
              className="mt-3"
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontSize: 'clamp(24px, 6vw, 28px)',
                fontWeight: 500,
                letterSpacing: 0,
                lineHeight: 1.05,
                color: '#2D2A24',
                margin: 0,
                maxWidth: '24ch',
              }}
            >
              Dyrk {effective.variety ?? effective.plantName} i din egen have
            </h3>
            <p
              className="mt-3"
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontSize: 'clamp(15px, 3.8vw, 17px)',
                fontStyle: 'italic',
                lineHeight: 1.45,
                color: 'rgba(36,48,31,0.68)',
                margin: 0,
                maxWidth: '36ch',
              }}
            >
              Tilføj sorten til din frøbank eller opret den som plante, så
              Potalot kan følge med gennem sæsonen.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/froebank/tilfoej"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 hover:opacity-90 transition"
                style={{
                  background: '#7F8F6A',
                  color: '#F4F0E5',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  textDecoration: 'none',
                }}
              >
                <Package className="h-3.5 w-3.5" />
                Tilføj til frøbank
              </Link>
              <Link
                href="/mine-planter"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 hover:bg-secondary/30 transition"
                style={{
                  background: 'transparent',
                  color: '#2D2A24',
                  border: '1px solid rgba(36,48,31,0.20)',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  textDecoration: 'none',
                }}
              >
                <Sprout className="h-3.5 w-3.5" />
                Opret plante
              </Link>
            </div>
          </section>
        </>
      )}

      {currentUser && !isDemo && myNote !== null && (
        <>
          {debug && <DebugBlock name="GuideNotesCard" note="5. Egne noter" />}
          <GuideNotesCard guideId={original.id} initialNote={myNote} />
        </>
      )}

      {sortsvarianter.length > 0 && (
        <>
          {debug && (
            <DebugBlock
              name="Sortsvarianter"
              note={`6. ${sortsvarianter.length} sortsguider`}
            />
          )}
          <section className="space-y-3">
            <p
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(36,48,31,0.55)',
                margin: 0,
              }}
            >
              Sortsvarianter
            </p>
            <Card>
              <CardContent className="space-y-2 py-3">
                {sortsvarianter.map((v) => (
                  <Link
                    key={v.id}
                    href={`/guides/${v.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30"
                  >
                    <div>
                      <p className="font-medium text-foreground">{v.variety}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {v.summary}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {effective.variety === 'San Marzano' && (
        <>
          {debug && <DebugBlock name="PotalotTipMedMakro" note="signatur 2/3" />}
          <PotalotTipMedMakro macroImage={tipImage}>
            Vand dybt og regelmæssigt frem for lidt hver dag. San Marzano
            kvitterer for jævn fugt med færre revner og mere koncentreret smag.
          </PotalotTipMedMakro>
        </>
      )}

      {(() => {
        const noteSection = effective.sections.find(
          (s) => 'title' in s && s.title && /potalot[-\s]?note/i.test(s.title),
        )
        if (!noteSection || !('body' in noteSection) || !noteSection.body)
          return null
        return (
          <>
            {debug && (
              <DebugBlock name="GuidePotalotNote" note="signatur 3/3 — lukke" />
            )}
            <GuidePotalotNote body={noteSection.body} />
          </>
        )
      })()}

      {nextGuide && nextGuide.kind === 'next' && (
        effective.variety === 'San Marzano' ? (
          (() => {
            const targetExists = allGuides.some((g) => g.id === nextGuide.slug)
            return (
              <>
                {debug && (
                  <DebugBlock
                    name="GuideComparisonList"
                    note={`San Marzano vs Roma · CTA ${targetExists ? 'live' : 'disabled'}`}
                  />
                )}
                <GuideComparisonList
                  leftTitle="San Marzano"
                  rightTitle="Roma"
                  rows={SAN_MARZANO_VS_ROMA_ROWS}
                  ctaLabel="Se guide til Roma"
                  ctaHref={targetExists ? `/guides/${nextGuide.slug}` : undefined}
                  ctaDisabled={!targetExists}
                />
              </>
            )
          })()
        ) : (
          <>
            {debug && <DebugBlock name="GuideNextCard" note="standard CTA" />}
            <GuideNextCard
              title={nextGuide.title}
              description={nextGuide.description}
              slug={nextGuide.slug}
              label={nextGuide.label}
            />
          </>
        )
      )}
    </article>
  )
}

// ─── Kalender-rytme-grupperinger ──────────────────────────────────

interface KalenderChapter {
  title: string
  monthRange: string
  description?: string
  actions: string[]
}

const KALENDER_SAESONER: Array<{
  range: [number, number]
  title: string
  monthRange: string
  description: string
}> = [
  {
    range: [1, 3],
    title: 'Start sæsonen',
    monthRange: 'JAN-MAR',
    description:
      'Planlæg varme, lys og en rolig start, før planterne får fart på.',
  },
  {
    range: [4, 6],
    title: 'Ud i vækst',
    monthRange: 'APR-JUN',
    description: 'Plant ud, når jorden er lun, og hold planterne i jævn vækst.',
  },
  {
    range: [7, 12],
    title: 'Høst og vedligehold',
    monthRange: 'JUL-OKT',
    description: 'Hold rytmen jævn med vand og løbende høst gennem sæsonen.',
  },
]

function buildKalenderChapters(
  rules: Guide['calendarRules'],
): KalenderChapter[] {
  if (rules.length === 0) return []
  const chapters: KalenderChapter[] = []
  for (const saeson of KALENDER_SAESONER) {
    const seasonRules = rules.filter((r) => {
      const months = r.recommendedMonths
      if (!months || months.length === 0) return false
      const first = Math.min(...months)
      return first >= saeson.range[0] && first <= saeson.range[1]
    })
    if (seasonRules.length === 0) continue
    chapters.push({
      title: saeson.title,
      monthRange: saeson.monthRange,
      description: saeson.description,
      actions: seasonRules.map((r) => r.title),
    })
  }
  return chapters
}

// ─── San Marzano vs Roma — comparison data ────────────────────────

const SAN_MARZANO_VS_ROMA_ROWS: ComparisonRow[] = [
  {
    label: 'Frugt',
    icon: <Circle />,
    left: 'Slanke, aflange frugter',
    right: 'Ovale, bredere frugter',
  },
  {
    label: 'Konsistens',
    icon: <Leaf />,
    left: 'Få kerner og fast frugtkød',
    right: 'Mere kød end San Marzano',
  },
  {
    label: 'Anvendelse',
    icon: <SproutIcon />,
    left: 'Perfekt til sauce',
    right: 'God til sauce og konservering',
  },
  {
    label: 'Modning',
    icon: <CalendarDays />,
    left: 'Middeltidlig sort',
    right: 'Middeltidlig sort',
  },
]
