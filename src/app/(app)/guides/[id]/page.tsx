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
import { GuideNextCard } from '@/components/guides/guide-next-card'
import { KalenderKobling } from '@/components/guides/kalender-kobling'
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

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string }>
}

/**
 * Guide-detail = REN læseoplevelse.
 *
 * Master-spec krav:
 *   - Ingen "Master", "Mine", "Promote", "Flag", "Clone" på siden
 *   - For ejere: højst ÉN diskret "Rediger"-affordance til egne guides
 *   - Admin-maskineriet bor i /admin/guides/[id]
 *
 * Bygges som en naturhåndbog-opslag:
 *   1. Tilbage + identitet (kategori · trust-badge · navn · sort · latin)
 *   2. Hovedbillede
 *   3. Sortsvariant-info (hvis relevant)
 *   4. QuickFactsCard — hurtigt overblik
 *   5. Sådan dyrker du — den editoriale læsetekst (naturhåndbogslaget)
 *   6. Rytme i kalenderen — viser hvilke aktiviteter guiden vil generere
 *   7. Dine egne — kobling til frøbank + aktive planter
 *   8. Notes — brugerens private noter på guiden
 *   9. Sortsvarianter (hvis artsguide)
 */
export default async function GuideDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { returnTo } = await searchParams

  // Imported guides (platforms-indhold fra content/guides/*.md) vinder
  // altid over DB. Fald derefter tilbage til DB, derefter til demo.
  let original: Guide | null = IMPORTED_GUIDES.find(g => g.id === id) ?? null
  let isDemo = original !== null  // imported behandles som read-only ligesom demo
  if (!original) {
    original = await getGuide(id)
  }
  if (!original) {
    const demoMatch = ALL_GUIDES.find(g => g.id === id)
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

  // I demo-mode kalder vi ikke DB-actions for de relaterede ting — vi
  // har stadig brug for at vise koblinger og noter, men fra demo-kilder.
  const [allGuides, inventory, plants, myNote] = await Promise.all([
    isDemo ? Promise.resolve(ALL_GUIDES) : getAllGuides(),
    getAllInventoryItems(),
    getAllPlants(),
    !isDemo && currentUser ? getMyGuideNote(id) : Promise.resolve(null),
  ])

  const { effective, inheritedFromParent, parent } = mergeGuide(original, allGuides)

  const sortsvarianter =
    original.guideLevel === 'species'
      ? allGuides.filter(g => g.parentGuideId === original.id)
      : []

  const linkedInventory = inventory.filter(
    i => i.guideId === effective.id || i.guideId === parent?.id,
  )
  const linkedPlants = plants.filter(
    p => p.guideId === effective.id || p.guideId === parent?.id,
  )

  const cat = PRIMARY_CATEGORIES[effective.primaryCategoryId]
  const isOwner = !!currentUser && original.visibility === 'private'

  // `:::next-guide`-blokken vises som sidste editorial element på siden,
  // efter alt andet content (sortsvarianter, noter, kalender osv).
  // Højst én pr. guide — vi tager den første hvis flere skulle smutte ind.
  const nextGuide = effective.sections.find(s => s.kind === 'next')

  // Trust-badge: i demo har vi AI-flag; ellers public=potalot / private=egen
  const aiIds = isDemo
    ? new Set((await import('@/data/guides-demo')).DEMO_AI_GUIDE_IDS)
    : null
  const kind = guideKindFor(original, aiIds)
  // Makro-strategi: hver slot får et unikt seed + preferredRoles. Brugte
  // src'er deles via usedMacroSrcs så samme makro ikke vises i to slots
  // på samme guide. Hvis ingen makros findes → null → blokken renderes
  // uden baggrund (ingen hardcoded fallback til "tomat-san-marzano/dug").
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

  // ── BLEED-BLOKKE — makros som visuelle pauser mellem kapitler ─
  // Annas spec: maks 3 bleeds pr. sortsguide, én pr. anker-sektion,
  // rolle-prioritet [detail, structure, fruit, atmosphere].
  //
  //   Sortsguider:  efter "Om sorten", "Smag og anvendelse", "Tips/fejl"
  //   Artsguider:   efter "Om planten", "Dyrkningsforhold", "Sygdomme"
  //
  // Hver anker matches kun ÉN gang — første sektion der matcher
  // mønstret får bleeden. Andre matchende sektioner får ingen.
  // Hero-foto, plantCard og seedCard kan ikke ryge med fordi
  // resolvePotalotMacro kun læser fra POTALOT_IMAGE_SETS.macro[].
  const isSpecies = effective.guideLevel === 'species'
  const bleedAnchorPatterns: RegExp[] = isSpecies
    ? [
        /^om (planten|arten)/i,                    // ankr 1: Om planten
        /pleje|dyrkningsforhold|udplantning/i,     // ankr 2: Dyrkningsforhold
        /sygdomme|typiske fejl|udfordringer/i,     // ankr 3: Sygdomme
      ]
    : [
        /^om sorten/i,                             // ankr 1: Om sorten
        /smag|anvendelse/i,                        // ankr 2: Smag og anvendelse
        /opmærksom|tips|fejl/i,                    // ankr 3: Dyrkningstips
      ]
  const bleedAfter: Record<string, NonNullable<ReturnType<typeof resolvePotalotMacro>>> = {}
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
    if (!bleed) continue  // ingen flere unikke makros
    usedMacroSrcs.add(bleed.src)
    bleedAfter[sectionKey] = bleed
    matchedAnchors.add(anchorIdx)
  }

  return (
    <article className="max-w-3xl space-y-10 overflow-x-clip pb-6 sm:space-y-12">
      {/* ── HEADER — identitet ── */}
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href={safeReturnTo} aria-label="Tilbage">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          {/* Ejer-affordance: ÉN diskret Rediger-knap for egne guides */}
          {isOwner && !isDemo && (
            <UserGuideEditDialog guide={original} />
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <TrustBadge kind={kind} size="sm" />
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: 'rgba(36,48,31,0.55)', fontWeight: 600, letterSpacing: '0.18em' }}
            >
              {cat.name}
              {original.guideLevel === 'variety' && parent && ' · sortsvariant'}
              {original.guideLevel === 'species' && ' · artsguide'}
            </span>
          </div>
          {/* V3 H1 — Cormorant 48px, weight 500, line-height 0.95.
              For sortsguider er sortsnavnet titlen; plantenavnet bliver
              eyebrow over (i kategori-strippen). */}
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

        {/* Lineage for egne guides afledt af en Potalot-guide */}
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

      {/* ── HOVEDBILLEDE — V3 spec ──
          Højde 420px på mobil. Ingen skygge ("Guides skal føles som
          papir"). Subtil border som papir-kant. Aspect 4/5 portrait
          eller wide for arts/sorts forskel — fastlagt af kortets data.
          Vi bruger en fast højde-formel: kortere på small screens,
          op til 420px der efter.
       */}
      {effective.primaryImageId && (
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
            style={{
              aspectRatio: '4/5',
              maxHeight: 420,
            }}
          />
        </div>
      )}

      {/* ── ARTS-GUIDE-LINK (hvis sortsvariant) ── */}
      {parent && (
        <Card className="bg-secondary/30 border-secondary">
          <CardContent className="flex items-center gap-3 py-3 flex-wrap">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="text-sm flex-1 min-w-[180px]">
              Sortsvariant af <strong>{parent.plantName}</strong>. Felter uden override arves fra artsguiden.
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/guides/${parent.id}`}>
                Se artsguide <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── 1. QUICK FACTS — hurtigt overblik ── */}
      <QuickFactsCard guide={effective} inheritedFields={inheritedFromParent} />

      {/* ── 2. SÅDAN DYRKER DU — naturhåndbogslaget ── */}
      <SaadanDyrkerDu
        sections={effective.sections}
        factMacroImage={factImage}
        bleedAfter={bleedAfter}
      />

      {effective.variety === 'San Marzano' && (
        <>
          <VidsteDuMedMakro
            macroImage={noteImage}
            intensity="soft"
          >
            San Marzano har fast frugtkød og lavt vandindhold, hvilket gør sorten særlig velegnet til sauce og konservering.
          </VidsteDuMedMakro>
          <PotalotTipMedMakro
            macroImage={tipImage}
          >
            Vand dybt og regelmæssigt frem for lidt hver dag. San Marzano kvitterer for jævn fugt med færre revner og mere koncentreret smag.
          </PotalotTipMedMakro>
        </>
      )}

      {/* ── 3. RYTME I KALENDEREN — guides → kalender-kobling ── */}
      {effective.calendarRules.length > 0 && (
        <KalenderKobling rules={effective.calendarRules} />
      )}

      {/* ── 4. DINE EGNE — frøbank + plante-kobling ── */}
      {(linkedInventory.length > 0 || linkedPlants.length > 0) && (
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
                  {linkedInventory.map(item => (
                    <Link
                      key={item.id}
                      href={`/froebank/${item.id}`}
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.name}{item.variety ? ` — ${item.variety}` : ''}
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
                  {linkedPlants.map(plant => (
                    <Link
                      key={plant.id}
                      href={`/mine-planter/${plant.id}`}
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <Sprout className="h-3.5 w-3.5 text-muted-foreground" />
                      {plant.name}{plant.variety ? ` — ${plant.variety}` : ''}
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
      )}

      {/* ── 5. EGNE NOTER PÅ GUIDEN ── */}
      {currentUser && !isDemo && myNote !== null && (
        <GuideNotesCard guideId={original.id} initialNote={myNote} />
      )}

      {/* ── 6. SORTSVARIANTER (hvis artsguide) ── */}
      {sortsvarianter.length > 0 && (
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
              {sortsvarianter.map(v => (
                <Link
                  key={v.id}
                  href={`/guides/${v.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{v.variety}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{v.summary}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── 7. NEXT-GUIDE — det redaktionelle sidste skub ── */}
      {nextGuide && nextGuide.kind === 'next' && (
        <GuideNextCard
          title={nextGuide.title}
          description={nextGuide.description}
          slug={nextGuide.slug}
          label={nextGuide.label}
        />
      )}
    </article>
  )
}
