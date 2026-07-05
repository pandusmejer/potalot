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
import { Badge } from '@/components/ui/badge'
import { QuickFactsCard } from '@/components/guides/quick-facts'
import { GuideNotesCard } from '@/components/guides/guide-notes-card'
import { UserGuideEditDialog } from '@/components/guides/user-guide-edit-dialog'
import { TrustBadge, guideKindFor } from '@/components/guides/trust-badge'
import { SaadanDyrkerDu } from '@/components/guides/saadan-dyrker-du'
import { GuideNote } from '@/components/guides/guide-note'
import { GuidePotalotNote } from '@/components/guides/guide-potalot-note'
import { GuideNextCard } from '@/components/guides/guide-next-card'
import { KalenderRytmeKapitel } from '@/components/guides/kalender-rytme-kapitel'
import { LaerAfHinanden } from '@/components/guides/laer-af-hinanden'
import { erfaringerFor } from '@/data/guides-erfaringer'
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
import { ALL_GUIDES } from '@/data/guides-demo'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import type { Guide } from '@/lib/types'
import { resolvePotalotMacro } from '@/lib/images/resolve-potalot-image'
import { ArrowLeft, Package, Sprout, ArrowRight } from 'lucide-react'

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
  //
  // V4.3-låsning (Docs/design-system/guides.md §18): artsguider får
  // INGEN automatiske bleed-blokke. Makrofotos er sortsbestemte;
  // arts-makros findes som "botaniske referencefotos" men presses
  // ikke ind i prose-flowet for at fylde plads. Tomme artsguider er
  // ikke et problem — falske artsguider er.
  //
  // Hvis en artsguide har eksplicit anførte slots (fact-bg, evt.
  // signaturer), bruges arts-makros der. Bleed-blokke er sortsguide-
  // only fra V4.3.
  const isSpecies = effective.guideLevel === 'species'
  const bleedAnchorPatterns: RegExp[] = isSpecies
    ? []
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
      {debug && <DebugBlock name="Header" note="identitet + sort-dom + hero" />}
      {/* Kompakt, samlet mobil-top: back → badges → titel/art/latin → sort-dom
          → lavere hero. Ét komponeret hoved, ikke spredte elementer. Hero'et
          identificerer planten, men blokerer ikke guiden. */}
      <header className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Ren, on-brand back-knap: blød creme-cirkel + hårfin border. IKKE
              shadcn ghost-varianten, hvis hover:bg-accent er temaets lyserøde/
              ler-tone og skriger i det rolige guide-univers. */}
          <Link
            href={safeReturnTo}
            aria-label="Tilbage"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(45,42,36,0.12)] bg-[rgba(255,255,255,0.45)] text-[#2D2A24] transition-colors hover:bg-[rgba(45,42,36,0.06)] active:scale-[0.97]"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
          </Link>
          {/* Trust-badgen sidder på back-knap-linjen (øverste højre) som guidens
              afsender-mærke — væk fra badge/titel-blokken, så identiteten samles. */}
          <div className="flex items-center gap-2">
            <TrustBadge kind={kind} size="sm" />
            {isOwner && !isDemo && <UserGuideEditDialog guide={original} />}
          </div>
        </div>

        <div>
          <div className="mb-2">
            <span
              className="text-xs uppercase"
              style={{
                color: 'rgba(36,48,31,0.55)',
                fontWeight: 600,
                letterSpacing: '0.18em',
              }}
            >
              {/* Kun guide-klassifikation (art/sort + art-navn). Frøbank-
                  kategorien (Frø/Løg/Knolde…) hører hjemme i Frøbank, ikke i
                  guide-eyebrowen — den blandede akser. */}
              {original.guideLevel === 'variety' && parent
                ? 'Sortsvariant'
                : 'Artsguide'}
              {effective.variety && ` · ${effective.plantName}`}
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontWeight: 500,
              fontSize: 'clamp(32px, 7.5vw, 44px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              color: '#2D2A24',
              margin: 0,
            }}
          >
            {effective.variety ?? effective.plantName}
          </h1>
          {effective.latinName && (
            <p
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(15px, 2.8vw, 18px)',
                fontWeight: 400,
                color: '#2D2A24',
                opacity: 0.6,
                margin: '4px 0 0',
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

        {/* Rent hero-foto + kompakt summary-strip UNDER fotoet. Ingen tekst/
            chips/fade ovenpå — makroens sanselige kvalitet bevares. Foto og
            strip grupperes tæt (8px), så strippen læses som billedets caption/
            intro, ikke et nyt afsnit. */}
        {(effective.primaryImageId || effective.summary) && (
          <div className="space-y-2">
            {effective.primaryImageId && (
              <>
                {debug && <DebugBlock name="Hero" note="rent foto — ingen overlay" />}
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
                    className="block w-full object-cover"
                    style={{ height: 'clamp(260px, 72vw, 330px)' }}
                  />
                </div>
              </>
            )}
            {effective.summary && (
              <div
                style={{
                  // Varm, lys terracotta-creme udledt af tomatens toner i hero-
                  // fotoet — ikke ren beige, ikke koral/pink. Farven skal anes,
                  // ikke ses, så strippen føles integreret med billedet.
                  background: '#F3E6DD',
                  border: '1px solid #DCCABD',
                  borderRadius: 14,
                  padding: '11px 15px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-manrope)',
                    fontSize: 13.5,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    color: '#4A4636',
                    margin: 0,
                  }}
                >
                  {effective.summary}
                </p>
              </div>
            )}
          </div>
        )}
      </header>

      {parent && (
        <>
          {debug && <DebugBlock name="ArtsguideLink" />}
          {/* Arts/sort-relation som editorial produkt-tekst, ikke database-besked:
              brugeren skal mærke skabelonen, ikke se merge-logikken. */}
          <aside
            style={{
              background: '#F4F0E5',
              border: '1px solid rgba(45,42,36,0.10)',
              borderRadius: 20,
              padding: '18px 20px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontWeight: 500,
                fontSize: 'clamp(20px, 4.6vw, 23px)',
                lineHeight: 1.12,
                letterSpacing: '-0.01em',
                color: '#2D2A24',
                margin: '0 0 6px',
              }}
            >
              {effective.variety ?? effective.plantName} er en{' '}
              {parent.plantName.toLowerCase()}sort
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.5,
                color: '#6A665C',
                margin: 0,
                maxWidth: '52ch',
              }}
            >
              {parent.plantName}guiden dækker såning, pasning og sygdomme. Her
              viser vi, hvad der gør {effective.variety ?? effective.plantName}{' '}
              anderledes.
            </p>
            <Link
              href={`/guides/${parent.id}`}
              className="group mt-3 inline-flex items-center gap-1.5"
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 13,
                fontWeight: 700,
                color: '#4E6138',
              }}
            >
              Se {parent.plantName.toLowerCase()}guiden
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </aside>
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
          {debug && <DebugBlock name="GuideNote" note="Vidste du? — signatur 1/3" />}
          <GuideNote label="Vidste du?" image={noteImage} imageSide="left">
            San Marzano har fast frugtkød og lavt vandindhold, hvilket gør
            sorten særlig velegnet til sauce og konservering.
          </GuideNote>
        </>
      )}

      {/* Lær af hinanden ligger FØR kalenderen: brugeren læser Potalots guide,
          får så praktiske dyrker-nuancer, og omsætter dét til planlægning i
          kalenderen + egen have. Efter kalenderen ville det føles som appendix. */}
      {(() => {
        const erfaringer = erfaringerFor(effective.id)
        if (erfaringer.length === 0) return null
        return (
          <>
            {debug && (
              <DebugBlock
                name="LaerAfHinanden"
                note={`Erfaringer — ${erfaringer.length}`}
              />
            )}
            <LaerAfHinanden
              subject={effective.variety ?? effective.plantName}
              erfaringer={erfaringer}
            />
          </>
        )
      })()}

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
          {debug && <DebugBlock name="GuideNote" note="Potalot-tip — signatur 2/3" />}
          <GuideNote label="Potalot-tip" image={tipImage} imageSide="right">
            Vand dybt og regelmæssigt frem for lidt hver dag. San Marzano
            kvitterer for jævn fugt med færre revner og mere koncentreret smag.
          </GuideNote>
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
