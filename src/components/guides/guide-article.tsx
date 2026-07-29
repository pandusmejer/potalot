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
import { GuidePotalotNote } from '@/components/guides/guide-potalot-note'
import { GuideNote } from '@/components/guides/guide-note'
import { GuideNextCard } from '@/components/guides/guide-next-card'
import { KalenderRytmeKapitel } from '@/components/guides/kalender-rytme-kapitel'
import { LaerAfHinanden } from '@/components/guides/laer-af-hinanden'
import { ArtsguideRelateret } from '@/components/guides/artsguide-relateret'
import { TechniqueArticle } from '@/components/guides/technique-article'
import { BiblioRow } from '@/components/guides/guides-bibliotek'
import { erfaringerFor } from '@/data/guides-erfaringer'
import {
  GuideComparisonList,
  type ComparisonRow,
} from '@/components/guides/guide-comparison'
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

  // Sorter åbnet HERFRA (Vælg en sort / Prøv også) skal have "tilbage" → denne
  // guide, ikke forsiden.
  const selfReturn = encodeURIComponent(`/guides/${original.id}`)

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

  // Species → dens egne sorter ("Vælg en sort"). Variety → søskende-sorter af
  // samme art ("Prøv også"). SAMME sektion + sortkort + clip-path — kun data +
  // copy skifter. Én sort-korts-grammatik, ingen ny komponent.
  const sortsvarianter =
    original.guideLevel === 'species'
      ? allGuides.filter((g) => g.parentGuideId === original.id)
      : original.parentGuideId
        ? allGuides.filter(
            (g) => g.parentGuideId === original.parentGuideId && g.id !== original.id,
          )
        : []

  // Relateret hjælp: teknikguider der gælder denne art (udledt af appliesTo).
  // Kun på artsguider — brugeren læser om arten, Potalot tilbyder relevant hjælp.
  const relatedTechniques =
    original.guideLevel === 'species'
      ? IMPORTED_GUIDES.filter(
          (g) => g.guideLevel === 'technique' && (g.appliesTo ?? []).includes(original.id),
        )
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

  // Teknikguide = eget register (handling, ikke planteidentitet): farveblok-
  // hero + trin-nummerering, ingen quickFacts/kalender/frøbank/sortsvarianter.
  // Branch tidligt så den låste arts/sort-rendering nedenfor er urørt.
  if (effective.guideLevel === 'technique') {
    return (
      <TechniqueArticle
        guide={effective}
        allGuides={allGuides}
        safeReturnTo={safeReturnTo}
      />
    )
  }

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
  // Flertalsform til arts-copy ("tomater"); fallback til plantName i småt.
  const artPlural = effective.pluralName ?? effective.plantName.toLowerCase()

  // Lær af hinanden bygges én gang og placeres forskelligt: sortguide viser
  // det tidligt (før kalenderen — erfaringer om den konkrete variant), arts-
  // guide skubber det NED (sekundært lag, efter at brugeren har set sorter/
  // teknik) og folder det.
  const erfaringerListe = erfaringerFor(effective.id)
  const erfaringerNode =
    erfaringerListe.length > 0 ? (
      <LaerAfHinanden
        subject={effective.variety ?? effective.plantName}
        erfaringer={erfaringerListe}
        heading={isSpecies ? `Erfaringer med ${artPlural}` : undefined}
        intro={
          isSpecies
            ? `Se hvad andre dyrkere har oplevet med ${artPlural} i drivhus, krukker og på friland.`
            : undefined
        }
        collapsible={isSpecies}
      />
    ) : null

  // "Potalot anbefaler"-noten flyttes INDE i prose-flowet (mellem kapitel 03
  // og 04) i stedet for som lukke-blok i bunden.
  const potalotNoteSection = effective.sections.find(
    (s) => 'title' in s && s.title && /potalot[-\s]?note/i.test(s.title),
  )
  const potalotNoteBody =
    potalotNoteSection && 'body' in potalotNoteSection
      ? potalotNoteSection.body
      : null

  const bleedAnchorPatterns: RegExp[] = isSpecies
    ? []
    : [
        // Tre anker-afsnit med HVER SIN billedform (se BleedSlot i
        // saadan-dyrker-du): Om sorten = kvadratisk insert, Sortsspecifikke
        // detaljer = højt sidebillede, Smag/anvendelse = roligt bånd. Det
        // bryder den lineære "tekst → fuldbredde-billede"-rytme.
        /^om sorten/i,
        /sortsspecifik/i,
        /smag|anvendelse/i,
        // 'opbind|knib' + 'næste|kalender' droppet: de ankrede billeder mellem
        // teknikkortene / før kalenderen uden redaktionel funktion.
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
    <article className="max-w-3xl space-y-5 overflow-x-clip pb-6 sm:space-y-6">
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
              className="uppercase"
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 11,
                color: 'rgba(36,48,31,0.55)',
                fontWeight: 700,
                letterSpacing: '0.2em',
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
              fontFamily: 'var(--font-plex-condensed), sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(34px, 8vw, 46px)',
              lineHeight: 0.98,
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

        {/* Rent hero-foto + intro som en NØGTERN sortsdeklaration UNDER fotoet.
            IKKE en poetisk Cormorant-lede (den lignede starten på et essay og
            gentog fakta) — en kort sans-reference-linje der orienterer: hvad er
            sorten god til. Ingen boks/chips/overlay/fade. */}
        {(effective.primaryImageId || effective.summary) && (
          <div className="space-y-3">
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
                  <img loading="lazy" decoding="async"
                    src={effective.primaryImageId}
                    alt={effective.plantName}
                    className="block w-full object-cover"
                    style={{ height: 'clamp(260px, 72vw, 330px)' }}
                  />
                </div>
              </>
            )}
            {effective.summary && (
              <p
                style={{
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: 'rgba(36,48,31,0.66)',
                  margin: '2px 0 0 3mm',
                  maxWidth: '34ch',
                }}
              >
                {effective.summary}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Lille "Relateret"-genvej højt på artsguiden (kun species): 2-3 sorter
          → "Se alle" scroller til Sortsvarianter-sektionen, + Spørg gartneren.
          Additivt — flytter/ombygger INTET af den låste artsguide. */}
      {isSpecies && (
        <ArtsguideRelateret
          plantName={effective.plantName}
          varieties={sortsvarianter}
          returnTo={selfReturn}
        />
      )}

      {parent && (
        <>
          {debug && <DebugBlock name="ArtsguideLink" />}
          {/* Arts/sort-relation som roligt editorial mellemstykke i flowet —
              IKKE et UI-kort med border. Teksten bærer designet: eyebrow →
              Cormorant-anslag → sans-brødtekst → CTA som tekstlinje. */}
          <div className="max-w-[54ch] px-3 sm:px-4">
            <p
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#7F8F6A',
                margin: 0,
              }}
            >
              Bygger på
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-plex-condensed), sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(22px, 4.8vw, 26px)',
                lineHeight: 1.12,
                letterSpacing: '-0.01em',
                color: '#2D2A24',
                margin: '8px 0 0',
              }}
            >
              Start med {parent.plantName.toLowerCase()}guiden
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 14.5,
                fontWeight: 500,
                lineHeight: 1.55,
                color: '#6A665C',
                margin: '10px 0 0',
              }}
            >
              Artsguiden for {parent.plantName.toLowerCase()} dækker såning,
              pasning og sygdomme. Her går vi tættere på det, der gør{' '}
              {effective.variety ?? effective.plantName} særlig.
            </p>
            <Link
              href={`/guides/${parent.id}?returnTo=${selfReturn}`}
              className="group mt-3.5 ml-auto flex w-fit items-center gap-1.5"
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 13.5,
                fontWeight: 700,
                color: '#4E6138',
              }}
            >
              Se {parent.plantName.toLowerCase()}guiden
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </>
      )}

      {/* Hurtigt overblik rykket ~3mm op mod relations-mellemstykket. Nested
          negativ margin (ikke på selve space-y-barnet) for at overskrive fugen
          pålideligt. */}
      <div>
        <div className="-mt-1">
          {debug && <DebugBlock name="QuickFactsCard" note="1. Hurtigt overblik" />}
          <QuickFactsCard
            guide={effective}
            inheritedFields={inheritedFromParent}
            species={isSpecies}
          />
        </div>
      </div>

      {/* marginBottom 12 (overskriver space-y-10) → sidste sektion (teknikkort)
          slutter 12px fra Vidste du, så den kort-cluster har ens 12px-rytme. */}
      <div style={{ marginBottom: 12 }}>
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
          // KUN artsguide: noten placeres mellem kapitel 03 og 04. Sortguide
          // beholder den som lukke-blok i bunden (se nedenfor).
          potalotNoteBody={isSpecies ? potalotNoteBody ?? undefined : undefined}
        />
      </div>

      {effective.variety === 'San Marzano' && (
        // Nested -mt modvirker GuideNote's my-6, så tech↔Vidste du bliver 12px.
        <div>
          <div className="-mt-3">
            {debug && <DebugBlock name="GuideNote" note="Vidste du? — signatur 1/3" />}
            <GuideNote label="Vidste du?" image={noteImage} imageSide="left">
              San Marzano har fast frugtkød og lavt vandindhold, hvilket gør
              sorten særlig velegnet til sauce og konservering.
            </GuideNote>
          </div>
        </div>
      )}

      {/* Lær af hinanden ligger FØR kalenderen: brugeren læser Potalots guide,
          får så praktiske dyrker-nuancer, og omsætter dét til planlægning i
          kalenderen + egen have. Efter kalenderen ville det føles som appendix. */}
      {/* Sortguide: Erfaringer FØR kalenderen. Artsguide: skubbet ned (se
          nedenfor, lige før Din have-CTA'en). */}
      {!isSpecies && erfaringerNode}

      {(() => {
        const chapters = buildKalenderChapters(effective.calendarRules)
        if (chapters.length === 0) return null
        return (
          // Kalenderen får den halverede modul-fuge (SaadanDyrkerDu har allerede
          // marginBottom 12) — ingen ekstra negativ margin, ellers bliver den
          // for stram.
          <div>
            <div>
              {debug && (
                <DebugBlock
                  name="KalenderRytmeKapitel"
                  note={`3. Kalender — ${chapters.length} kapitler`}
                />
              )}
              <KalenderRytmeKapitel chapters={chapters} />
            </div>
          </div>
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
                  letterSpacing: '0.2em',
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
        // Formindsket fuge til kalender-sektionen ovenfor (12px, samme som
        // Din have↔Tip). Nested -mt så space-y-fugen overskrives.
        <div>
          <div className="-mt-2">
          {debug && (
            <DebugBlock name="DinHave (tom-tilstand)" note="4F — buffer" />
          )}
          <section
            className="rounded-[28px] px-6 py-6"
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
                fontWeight: 700,
                letterSpacing: '0.2em',
                lineHeight: 1.25,
                color: '#7F8F6A',
              }}
            >
              Din have
            </p>
            <h3
              style={{
                fontFamily: 'var(--font-plex-condensed), sans-serif',
                fontSize: 'clamp(23px, 5.5vw, 27px)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.08,
                color: '#2D2A24',
                // Luft mellem DIN HAVE-eyebrow og heading. (Inline, fordi en
                // mt-klasse ville blive overskrevet af margin herunder.)
                margin: '15px 0 0',
                maxWidth: '24ch',
              }}
            >
              {isSpecies
                ? `Dyrk ${artPlural} i din have`
                : `Dyrk ${effective.variety ?? effective.plantName}`}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.5,
                color: 'rgba(36,48,31,0.62)',
                // Luft mellem heading og brødtekst (inline, da mt-klasse ellers
                // overskrives af margin herunder).
                margin: '7px 0 0',
                maxWidth: '46ch',
              }}
            >
              {isSpecies
                ? `Vælg en sort til frøbanken, eller opret en ${effective.plantName.toLowerCase()}plante du allerede dyrker.`
                : 'Tilføj sorten til din frøbank eller opret den som plante.'}
            </p>
            {/* Piller deler bredden ligeligt (flex-1) og bliver på én linje —
                også når arts-labels som "Opret tomatplante" er lange. */}
            <div className="mt-5 flex gap-2">
              <Link
                href={isSpecies ? '#sortsvarianter' : '/froebank/tilfoej'}
                className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 hover:opacity-90 transition"
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
                {isSpecies
                  ? `Se ${effective.plantName.toLowerCase()}sorter`
                  : 'Tilføj til frøbank'}
              </Link>
              <Link
                href="/mine-planter"
                className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 hover:bg-secondary/30 transition"
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
                {isSpecies
                  ? `Opret ${effective.plantName.toLowerCase()}plante`
                  : 'Opret plante'}
              </Link>
            </div>
          </section>
          </div>
        </div>
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
          {/* Skalerbar sortliste — IKKE en promo-boks for én sort. Ingen ydre
              container/kort-i-kort; hver sort er et kompakt list-card med samme
              vægt. Bærer 1, 2, 4 eller mange sorter (viser 4 + "Se alle"). */}
          <section id="sortsvarianter" className="scroll-mt-20">
            <p
              className="uppercase"
              style={{
                fontFamily: 'var(--font-manrope)',
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '0.22em',
                color: 'rgb(113,122,96)',
                margin: '0 0 18px 8px',
              }}
            >
              {isSpecies ? 'Vælg en sort' : 'Prøv også'}
            </p>
            <p
              style={{
                // Editorial serif-intro — men IKKE hero. Ét trin ned (26px),
                // presset sammen (tæt bogstavafstand + line-height); eksplicit
                // linjeskift efter "til" og "og" (jf. reference). ~2mm indrykket.
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontSize: 26,
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: 'rgb(42,39,34)',
                margin: '0 0 28px 8px',
                maxWidth: 310,
              }}
            >
              {isSpecies ? (
                <>
                  Find en sort, der passer til
                  <br />
                  din måde at dyrke og
                  <br />
                  spise {artPlural} på.
                </>
              ) : (
                <>Andre sorter, du måske vil dyrke.</>
              )}
            </p>

            {/* Foto-form: bue KUN i højre side. Venstre + top/bund er helt lige
                (fotoet løber flush til kortkanten; kortets overflow:hidden
                klipper venstre hjørner til kortets egne 14px). SVG clip-path
                (objectBoundingBox) så buen skalerer rent med billedboksen. */}
            <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
              <defs>
                <clipPath id="variety-image-curve" clipPathUnits="objectBoundingBox">
                  <path d="M 0 0 H 0.74 C 0.90 0 1 0.20 1 0.5 C 1 0.80 0.90 1 0.74 1 H 0 Z" />
                </clipPath>
              </defs>
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sortsvarianter.slice(0, 4).map((v) => (
                <Link
                  key={v.id}
                  href={`/guides/${v.id}?returnTo=${selfReturn}`}
                  className="group no-underline transition-colors hover:border-[rgba(153,137,117,0.42)]"
                  style={{
                    // Stort redaktionelt sortkort: foto flush til venstre, tekst
                    // åbent til højre, rund pil-knap. Varm ivory, diskret border.
                    position: 'relative',
                    display: 'grid',
                    // To kolonner: foto + tekst. Teksten rækker helt ud til
                    // højre kant (pilen ligger absolut i hjørnet, uden for
                    // tekstflowet), så brødteksten kan være større.
                    gridTemplateColumns: '124px 1fr',
                    alignItems: 'center',
                    columnGap: 18,
                    minHeight: 156,
                    width: '100%',
                    padding: '0 16px 0 0',
                    background: 'rgba(255,252,242,0.82)',
                    border: '1px solid rgba(153,137,117,0.24)',
                    borderRadius: 14,
                    boxShadow: '0 10px 22px rgba(64,58,42,0.04)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Foto — flush venstre/top/bund; buen ligger KUN i højre side
                      via SVG clip-path (#variety-image-curve). */}
                  <div
                    style={{
                      alignSelf: 'stretch',
                      overflow: 'hidden',
                      background: '#ECE6D6',
                      clipPath: 'url(#variety-image-curve)',
                    }}
                  >
                    {v.primaryImageId && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img loading="lazy" decoding="async"
                        src={v.primaryImageId}
                        alt={v.variety ?? ''}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div style={{ minWidth: 0, alignSelf: 'start', padding: '24px 0 0' }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-cormorant), Georgia, serif',
                        fontSize: 24,
                        fontWeight: 600,
                        lineHeight: 1.08,
                        color: 'rgb(34,34,30)',
                        margin: '0 0 10px',
                      }}
                    >
                      {v.variety}
                    </h3>
                    {v.summary && (
                      <p
                        style={{
                          fontFamily: 'var(--font-manrope)',
                          // Teksten rækker helt ud til højre kant (~183px), så
                          // sætningen stadig falder på 2 linjer ("Kødfuld
                          // italiensk pastatomat / til sauce og konservering").
                          fontSize: 11,
                          fontWeight: 400,
                          lineHeight: 1.4,
                          color: 'rgb(82,84,72)',
                          margin: '0 0 10px',
                          // Balancér de 2 linjer, så bruddet falder naturligt
                          // (fx efter "pastatomat") uanset skriftstørrelse.
                          textWrap: 'balance',
                        }}
                      >
                        {v.summary}
                      </p>
                    )}
                    <div
                      aria-hidden
                      style={{
                        width: 30,
                        height: 2,
                        background: 'rgb(153,137,117)',
                        opacity: 0.65,
                        margin: '0 0 10px',
                      }}
                    />
                    {v.tags.length > 0 && (
                      <p
                        style={{
                          fontFamily: 'var(--font-manrope)',
                          fontSize: 10,
                          fontWeight: 400,
                          lineHeight: 1.2,
                          color: 'rgb(103,111,90)',
                          margin: 0,
                          // Frihold pilen i nederste højre hjørne.
                          paddingRight: 46,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {v.tags.slice(0, 3).join(' · ').toLowerCase()}
                      </p>
                    )}
                  </div>

                  {/* Pil i diskret rund knap — navigation, ikke webshop.
                      Absolut forankret i kortets nederste højre hjørne, uden
                      for tekstflowet, så teksten kan række hele vejen ud. */}
                  <span
                    aria-hidden
                    className="flex items-center justify-center transition-transform group-hover:translate-x-0.5"
                    style={{
                      position: 'absolute',
                      right: 16,
                      bottom: 20,
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      border: '1px solid rgba(153,137,117,0.24)',
                      background: 'rgba(255,252,242,0.36)',
                      color: 'rgb(153,137,117)',
                      flexShrink: 0,
                    }}
                  >
                    <ArrowRight style={{ width: 21, height: 21 }} strokeWidth={1.7} />
                  </span>
                </Link>
              ))}
            </div>

            {sortsvarianter.length > 4 && (
              <Link
                href="/guides"
                className="group mt-[22px] inline-flex items-center gap-1.5"
                style={{
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'rgb(87,104,65)',
                }}
              >
                Se flere {effective.plantName.toLowerCase()}sorter
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </section>
        </>
      )}

      {/* RELATERET HJÆLP — teknikguider der gælder arten (additivt; kilde: eget
          appliesTo). Naturligt sted: brugeren læser om arten, Potalot tilbyder
          relevant praktisk hjælp. Teknik-hubben er dermed overflødig. */}
      {relatedTechniques.length > 0 && (
        <section className="scroll-mt-20">
          <p
            className="uppercase"
            style={{
              fontFamily: 'var(--font-manrope)',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '0.22em',
              color: 'rgb(113,122,96)',
              margin: '0 0 16px 8px',
            }}
          >
            Relateret hjælp
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relatedTechniques.map((t) => (
              <BiblioRow key={t.id} guide={t} teknik returnTo={selfReturn} />
            ))}
          </div>
        </section>
      )}

      {/* Artsguide viser IKKE "Lær af hinanden": bruger-erfaringer er for
          brede/løse på artsniveau og afbryder referenceflowet. Kun sortguider
          viser det (erfaringer om en konkret variant = beslutningsstøtte).
          Arts-erfaringer hører på sigt hjemme i Havebog (kontekstuelt). */}

      {effective.variety === 'San Marzano' && (
        <div>
          {/* Halveret fuge til 'Din have' ovenfor (samme som TIP↔ANBEFALER):
              note-parret hører sammen. Nested -mt så space-y-fugen overskrives. */}
          <div className="-mt-3">
          {debug && <DebugBlock name="GuideNote" note="Potalot-tip — signatur 2/3" />}
          <GuideNote
            label="Potalot-tip"
            image={{
              src: '/images/teknik/tomat-vande.jpg',
              alt: 'Vanding af San Marzano ved rødderne',
            }}
            imageSide="right"
            imageScale={1.2}
            glyph={false}
          >
            Vand dybt og regelmæssigt frem for lidt hver dag. San Marzano
            kvitterer for jævn fugt med færre revner og mere koncentreret smag.
          </GuideNote>
          </div>
        </div>
      )}

      {/* Sortguide: "Potalot anbefaler" som lukke-blok i bunden (note-par med
          Potalot-tip ovenfor). Artsguide placerer den mellem kapitel 03 og 04
          via SaadanDyrkerDu i stedet. */}
      {!isSpecies && potalotNoteBody && (
        <div>
          <div className="-mt-3">
            {debug && (
              <DebugBlock name="GuidePotalotNote" note="signatur 3/3 — lukke" />
            )}
            <GuidePotalotNote body={potalotNoteBody} />
          </div>
        </div>
      )}

      {/* Artsguide: intet "Næste skridt"-kort — det dublerer Sortsvarianter-
          sektionen. Kun sortguider viser næste-guide/sammenligning. */}
      {!isSpecies && nextGuide && nextGuide.kind === 'next' && (
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
                  ctaLabel="Gå til Roma-guiden"
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
              backgroundImage={
                noteImage?.src ?? factImage?.src ?? effective.primaryImageId
              }
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
    left: 'Slanke, aflange frugter',
    right: 'Ovale, bredere frugter',
  },
  {
    label: 'Konsistens',
    left: 'Få kerner og fast frugtkød',
    right: 'Mere kød end San Marzano',
  },
  {
    label: 'Anvendelse',
    left: 'Perfekt til sauce',
    right: 'God til sauce og konservering',
  },
  {
    label: 'Modning',
    left: 'Middeltidlig sort',
    right: 'Middeltidlig sort',
  },
]
