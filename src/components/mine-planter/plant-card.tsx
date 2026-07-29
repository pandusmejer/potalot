'use client'

import Link from 'next/link'
import { PLANT_STATUS_META } from '@/lib/constants'
import { dageSiden, formatDatoKort } from '@/lib/datetime'
import type { Plant, PlantStatus, CalendarTask } from '@/lib/types'
import { estimateNextTask } from '@/lib/next-plant-task'
import { Sprout, Calendar, Scissors, BookOpen, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Fragment, type ComponentType, type SVGProps, type ReactNode } from 'react'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import { GlyphStatusFase, GlyphAlder, GlyphHojde, GlyphSundhed, type GlyphProps } from '@/components/icons/potalot-glyphs'
import { LogForm } from '@/components/mine-planter/log-form'
import type { DetailMaal } from '@/data/plant-detail'
import type { PlantLogType } from '@/lib/types'

/**
 * Konverter fri tekst til kebab-case slug for asset-convention lookup
 * når plant.guideId mangler (legacy DB-items uden guide-kobling).
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    // Accent-normalisering (é→e, ñ→n): 'Café au Lait' og 'Jalapeño'
    // skal matche filnavne uden accenter. æøå håndteres FØR NFD,
    // da å ellers dekomponeres til 'a' i stedet for 'aa'.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface Props {
  plant: Plant
  /** Næste opgave — bruges ikke i kort-visning v2, holdes for API-kompatibilitet. */
  nextTask?: CalendarTask | null
  /** Når sat: bundpanelet viser Mål (Status·Alder·Højde·Trivsel) i stedet
   *  for vækstbjælke + fakta. Bruges på plante-detaljen (editorial-hero). */
  maal?: DetailMaal | null
  /** Sat for logget-ind bruger med egen plante → Trivsel/Højde i Mål-panelet
   *  bliver klikbare og åbner logformularen DIREKTE med den rette type. */
  logPlantId?: string
}

const sans = 'var(--font-manrope)'

/**
 * Status → tilstand på den semantiske farvepalette.
 * Spec'en reducerer hele livscyklussen til tre aktive farve-states:
 *   • healthy growth  → #617345 (mat dyb grøn)
 *   • ready/attention → #C89A35 (varm gold)
 *   • urgent/problem  → #B86645 (varm terracotta — bruges ikke uden problem-flag)
 * Planlagt og afsluttet får en neutral muted farve så de ikke
 * konkurrerer med de aktive stadier.
 */
export function statusColor(status: PlantStatus): string {
  switch (status) {
    case 'planlagt':
    case 'afsluttet':
      return 'rgba(36,48,31,0.40)' // neutral muted
    case 'klar_til_udplantning':
    case 'hoestklar':
      return '#C89A35'             // ready / attention
    case 'saaet':
    case 'spirer':
    case 'i_vaekst':
    case 'udplantet':
      return '#617345'             // healthy growth
    default:
      return '#617345'
  }
}

/**
 * Status → position på Plan(0) → Høstklar(1) bjælken.
 * Bjælken har 8 stadier; PLAN sidder ved 0%, I VÆKST ved 50%,
 * HØSTKLAR ved 100% (anker-labels). Dot-positionerne nedenfor
 * lander naturligt ved disse anker-punkter for de relevante
 * stadier (planlagt ≈ PLAN, i_vaekst ≈ I VÆKST, hoestklar ≈
 * HØSTKLAR), mens mellem-stadier sidder pænt imellem.
 */
function statusPosition(status: PlantStatus): number {
  const positions: Record<PlantStatus, number> = {
    planlagt:             0.05,
    saaet:                0.18,
    spirer:               0.30,
    i_vaekst:             0.50,
    klar_til_udplantning: 0.62,
    udplantet:            0.76,
    hoestklar:            0.95,
    afsluttet:            1.00,
  }
  return positions[status]
}

/**
 * Plantekort — søsterkort til Frøkortet. Fuldt komponeret makrofoto
 * bærer atmosfæren; UI er minimalt og lever af samme materialsprog
 * som frøkortet (varmt papirpanel, Manrope typografi, samme radius).
 *
 * Hvor frøkortet er "produktkort" (statisk inventar — frø tilbage),
 * er plantekortet "levende havekort" — aktive planter, vækststadie,
 * pleje-rytme. Top-højre er en mekanisk flip-tæller der viser antal
 * AKTIVE planter (tilstedeværelse — IKKE rest af noget).
 */
export function PlantCard({ plant, nextTask, maal, logPlantId }: Props) {
  // V4.1: canonical resolver. preferredSrc valideres mod manifest;
  // stale DB-paths falder automatisk til asset-convention.
  // Canonical resolver, rolle: plant-card. Falder gennem 4 lag:
  //   1. preferredSrc (plant.primaryImageId, valideret mod manifest)
  //   2. POTALOT_IMAGE_SETS_BY_ID[guideId].plantCard
  //   3. /images/plantekort/<varietySlug>.{jpg,png}
  //   4. placeholder
  // Ingen cross-role fald — sortsbillede falder aldrig til arts-niveau.
  // varietySlug bygges ALTID af navn+sort (ikke guideId). guideId
  // sendes separat og prøves først; men kurateret plantekort/asset-
  // convention er nøglet på sorts-sluggen, så den skal også med.
  const varietySlug = plant.variety
    ? slugify(`${plant.name}-${plant.variety}`)
    : null
  const { src: heroImage, source } = resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  })
  // Intet ægte foto (kun placeholder) → rolig botanisk Potalot-state
  // i stedet for foto + scrim. Påvirker baggrund, teksfarve og højde.
  const hasPhoto = source !== 'fallback'
  const statusMeta = PLANT_STATUS_META[plant.status]
  const alder = plant.sowDate ? dageSiden(plant.sowDate) : null

  // Titel-størrelse skalerer med navnelængden. Korte arts-navne (Tomat,
  // Agurk) fylder stort; lange étords-navne (Stangbønne, Peberfrugt) kan
  // ikke ombrydes, så de skrumper i stedet for at løbe ud over kortet.
  const nameLen = plant.name.length
  const titleSize =
    nameLen <= 6 ? 56 : nameLen <= 8 ? 46 : nameLen <= 9 ? 40 : nameLen <= 10 ? 36 : 32

  // Origin-heuristik: hvis sowDate findes blev planten sået fra frø,
  // ellers er den plantet (købt potteplante, knold, stikling osv.).
  // Bruges både til fakta-row labelen og til bjælkens venstre anker.
  const wasSown = plant.sowDate != null
  const startLabel = wasSown ? 'Sået' : 'Plantet'
  const startAnchor = wasSown ? 'Sået' : 'Plantet'
  const startDate =
    plant.sowDate ?? plant.plantingOutDate ?? null

  // Tredje felt — næste opgave på planten. Estimeres ud fra status
  // og alder. Hvis brugeren har en konkret manuelt-tilføjet opgave
  // (nextTask), overstyrer den estimatet. Grensaks-ikonen signalerer
  // "pleje" snarere end en specifik handling, så den kan dække alt
  // fra vanding til knibning til udplantning.
  const nextTaskTitle = nextTask?.title ?? estimateNextTask(plant).label

  const fakta: { label: string; value: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
    {
      label: startLabel,
      value: startDate ? formatDatoKort(startDate) : '—',
      Icon: Calendar,
    },
    {
      // Bytte-navn for "Alder" — "I jord" rimer på bjælkens "I VÆKST"
      // og beskriver tilstanden ("planten har været i jord X dage")
      // snarere end et abstrakt alders-tal.
      label: 'I jord',
      value: alder != null ? (alder === 1 ? '1 dag' : `${alder} dage`) : '—',
      Icon: Sprout,
    },
    {
      label: 'Næste',
      value: nextTaskTitle,
      Icon: Scissors,
    },
  ]

  const className = cn(
    'group relative block w-full overflow-hidden rounded-[32px] transition-all duration-200 ease-out',
    // No-photo-kort er strammere (lavere højde) så minimal-data ikke
    // efterlader en stor tom flade — men højt nok til at det botaniske
    // emblem kan stå frit under titlen.
    hasPhoto ? 'aspect-[4/5]' : 'aspect-[1/1]',
    'hover:-translate-y-0.5'
  )
  const style = { boxShadow: '0 20px 44px rgba(26,34,22,0.18)' } as const

  const inner = (
    <>
      {/* FOTO — fylder kortet, bærer al atmosfære. translateY(-11%)
          ligesom frøkort så motivet sidder højere; bund-gabet skjules
          af det varme papirpanel. Uden ægte foto vises en rolig
          botanisk Potalot-state i stedet (ikke et nød-/debug-banner). */}
      {hasPhoto ? (
        <>
          <div aria-hidden className="absolute inset-0" style={{ transform: 'translateY(-11%)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async"
              src={heroImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          </div>
          {/* Læsbarheds-scrim — en tand stærkere end frøkort fordi
              plantefotos ofte har tæt tekstur og lav kontrast i toppen.
              Kun på foto; den botaniske flade er allerede lys. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[52%]"
            style={{ background: 'linear-gradient(180deg, rgba(18,14,10,0.46) 0%, rgba(18,14,10,0.14) 60%, transparent 100%)' }}
          />
        </>
      ) : (
        <NoPhotoBotanical name={plant.name} />
      )}

      {/* TOP-VENSTRE — fast eyebrow + stor titel + sort.
          Eyebrow er ALTID "MIN HAVE · PLANTE" (ikke status-baseret) —
          status hører hjemme i bundpanelet, ikke i identitets-laget. */}
      <div className="absolute left-0 top-0 z-10 max-w-[74%] p-[22px]">
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: hasPhoto ? 'rgba(255,255,255,0.92)' : 'rgba(36,48,31,0.5)', textShadow: hasPhoto ? '0 1px 5px rgba(20,14,8,0.5)' : 'none' }}
        >
          MIN HAVE · PLANTE
        </p>
        <h3
          className="mt-3.5"
          style={{ fontFamily: sans, fontSize: titleSize, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.028em', color: hasPhoto ? '#FFFFFF' : '#24301F', textShadow: hasPhoto ? '0 3px 22px rgba(20,14,8,0.6)' : 'none' }}
        >
          {plant.name}
        </h3>
        {plant.variety && (
          <p
            className="mt-2.5"
            style={{ fontFamily: sans, fontSize: 27, fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.015em', color: hasPhoto ? 'rgba(255,255,255,0.9)' : 'rgba(36,48,31,0.62)', textShadow: hasPhoto ? '0 2px 12px rgba(20,14,8,0.5)' : 'none' }}
          >
            {plant.variety}
          </p>
        )}
      </div>

      {/* TOP-HØJRE — mekanisk flip-tæller / odometer-inspireret
          instrument. Viser ANTAL aktive planter (tilstedeværelse),
          ikke restmængde. Subtilt vandret split-divider på midten
          for det rolige mekaniske look. */}
      <ActivePlantCounter count={plant.quantity} />

      {plant.imageSource === 'guide_reference' && (
        <span
          className="pointer-events-none absolute right-[24px] top-[92px] z-20 flex items-center gap-1 rounded-full border border-white/15 bg-[#24301F]/55 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm"
          style={{ fontFamily: sans }}
        >
          <BookOpen className="h-3 w-3" aria-hidden />
          Referencefoto
        </span>
      )}

      {/* BUND — varmt botanisk papirpanel.
          Strammere højde end første pass (~26% af kortet, så fotoet
          klart dominerer). Materialet er printet papir, ikke glas:
          minimal blur, neutral warm-ivory tone, næsten usynlig kant. */}
      <div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{
          background: 'rgba(245,242,234,0.94)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderTop: '1px solid rgba(36,48,31,0.05)',
          boxShadow: '0 -4px 14px rgba(36,48,31,0.04)',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: maal ? '16px 14px 15px' : '14px 18px 14px',
        }}
      >
        {maal ? (
          <MaalRow maal={maal} logPlantId={logPlantId} />
        ) : (
          <>
        {/* Vækststadie-bjælke. startAnchor varierer mellem "Sået" og
            "Plantet" afhængig af om planten kom fra frø eller potte. */}
        <GrowthStageBar status={plant.status} statusLabel={statusMeta.label} startAnchor={startAnchor} />

        {/* Skille-streg — næsten usynlig.
            18px luft over (fra stage-labels), 12px luft under (til fakta). */}
        <div
          style={{
            height: 1,
            background: 'rgba(36,48,31,0.06)',
            marginTop: 18,
            marginBottom: 12,
          }}
        />

        {/* Fakta-række — Placering · Plantet · Alder.
            Tre blokke med ikon TIL VENSTRE + label/value-stack TIL
            HØJRE. Vertikale dividere mellem er ekstremt subtile. */}
        <div className="flex items-stretch">
          {fakta.map((f, i) => {
            const Icon = f.Icon
            return (
              <Fragment key={f.label}>
                {i > 0 && (
                  <div
                    aria-hidden
                    className="shrink-0"
                    style={{
                      width: 1,
                      background: 'rgba(36,48,31,0.07)',
                      marginInline: 10,
                      marginBlock: 4,
                    }}
                  />
                )}
                <div className="flex flex-1 items-center min-w-0" style={{ gap: 12 }}>
                  <Icon
                    className="shrink-0"
                    width={22}
                    height={22}
                    strokeWidth={1.75}
                    style={{ color: '#7B816F', opacity: 0.9 }}
                  />
                  <div className="min-w-0">
                    <p
                      className="uppercase"
                      style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: '#7B816F', lineHeight: 1 }}
                    >
                      {f.label}
                    </p>
                    <p
                      className="truncate"
                      style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.15, color: '#24301F', marginTop: 4 }}
                    >
                      {f.value}
                    </p>
                  </div>
                </div>
              </Fragment>
            )
          })}
        </div>
          </>
        )}
      </div>
    </>
  )

  // Detail-heroen (maal sat) er IKKE et selvlink — så CTA-ankeret i
  // bundpanelet ikke bliver et ugyldigt <a> inde i et <a>.
  if (maal) {
    return (
      <div className={className} style={style}>
        {inner}
      </div>
    )
  }
  return (
    <Link href={`/mine-planter/${plant.id}`} className={className} style={style}>
      {inner}
    </Link>
  )
}

/**
 * No-photo plante-state — en bevidst, rolig botanisk Potalot-flade i
 * stedet for et nød-/debug-banner. Dæmpet sage-gradient, artens initial
 * som sart monogram-watermark (bleeder mod hjørnet) + en enkel spire-
 * silhuet og arts-navnet som sekundær label. Honest om at fotoet
 * mangler — uden at råbe om det.
 */
function NoPhotoBotanical({ name }: { name: string }) {
  return (
    <div aria-hidden className="absolute inset-0">
      {/* Dæmpet botanisk gradient */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(158deg, #EBEDE2 0%, #DCE2CF 52%, #C9D3B5 100%)' }}
      />
      {/* Rolig emblem — artens initial som sart monogram med en enkel
          spire-silhuet foran. Centreret i den frie flade under titlen
          (paddingBottom løfter det op over Mål-panelet). */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: 40, paddingBottom: 92 }}
      >
        <div className="relative flex items-center justify-center">
          <span
            className="select-none"
            style={{
              fontFamily: sans,
              fontSize: 132,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: 'rgba(36,48,31,0.07)',
            }}
          >
            {name.charAt(0)}
          </span>
          <Sprout
            className="absolute"
            width={46}
            height={46}
            strokeWidth={1.5}
            style={{ color: 'rgba(36,48,31,0.30)' }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * MÅL-RÆKKE — Plantekortets bundpanel på plante-detaljen.
 *
 * Anna (16. juni 2026): ikonet ligger nu ØVERST og CENTRERET i hvert af
 * de fire afsnit (Status·Alder·Højde·Sundhed), med Potalot Soft Glyphs i
 * stedet for Lucide. Resten af afsnittet (label · værdi · note) er
 * centreret under ikonet. Første skridt i statusbar-redesignet.
 */
/** Trivsel-farve efter tilstand (kun til den korte oversigtsværdi). */
function trivselFarve(value: string): string {
  const v = value.toLowerCase()
  if (v.startsWith('god')) return '#5A7038'
  if (v.startsWith('nogenlunde')) return '#B08419'
  if (v.startsWith('kræver')) return '#B04E38'
  return 'rgba(36,48,31,0.45)' // ikke vurderet
}

function MaalRow({ maal, logPlantId }: { maal: DetailMaal; logPlantId?: string }) {
  const felter: {
    label: string
    value: string
    source?: string
    /** Sat på Trivsel/Højde → feltet åbner logformularen direkte med denne type. */
    logType?: PlantLogType
    color: string
    wrap: boolean
    Comp: (p: GlyphProps) => ReactNode
  }[] = [
    { label: 'Status', value: maal.statusValue, color: '#24301F', wrap: false, Comp: GlyphStatusFase },
    { label: 'Alder', value: maal.alderValue, color: '#24301F', wrap: false, Comp: GlyphAlder },
    // Trivsel + Højde er ægte logdata → klik åbner logformularen DIREKTE med
    // rette type valgt (ikke bare scroll til dagbogen). Viser kilde-dato.
    { label: 'Højde', value: maal.hoejdeValue, source: maal.hoejdeSource, logType: 'height_measurement', color: '#24301F', wrap: false, Comp: GlyphHojde },
    { label: 'Trivsel', value: maal.sundhedValue, source: maal.sundhedSource, logType: 'health', color: trivselFarve(maal.sundhedValue), wrap: true, Comp: GlyphSundhed },
  ]
  const cls = 'flex min-w-0 flex-1 flex-col items-center px-0.5 text-center'
  return (
    <>
      <div className="flex items-stretch">
        {felter.map((f, i) => {
          const G = f.Comp
          const inner = (
            <>
              <G size={20} aria-hidden />
              <span
                className="uppercase"
                style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(36,48,31,0.46)', lineHeight: 1, marginTop: 7 }}
              >
                {f.label}
              </span>
              <span
                style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.015em', color: f.color, lineHeight: 1.1, marginTop: 4, textTransform: 'lowercase', whiteSpace: f.wrap ? 'normal' : 'nowrap' }}
              >
                {f.value}
              </span>
              {f.source && (
                <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 600, color: 'rgba(36,48,31,0.42)', lineHeight: 1, marginTop: 3 }}>
                  {f.source}
                </span>
              )}
            </>
          )
          // Logget-ind + måletype → hele feltet er en LogForm-trigger (åbner
          // dialogen direkte med rette type). Ellers et roligt statisk felt.
          const felt =
            logPlantId && f.logType ? (
              <LogForm
                plantId={logPlantId}
                defaultType={f.logType}
                trigger={
                  <button
                    type="button"
                    className={`${cls} cursor-pointer appearance-none border-0 bg-transparent transition-opacity active:opacity-60`}
                    style={{ color: 'inherit', font: 'inherit' }}
                    aria-label={`${f.label}: ${f.value} — registrér ny`}
                  >
                    {inner}
                  </button>
                }
              />
            ) : (
              <div className={cls}>{inner}</div>
            )
          return (
            <Fragment key={f.label}>
              {i > 0 && (
                <div
                  aria-hidden
                  className="shrink-0"
                  style={{ width: 1, background: 'rgba(36,48,31,0.08)', marginInline: 8, marginBlock: 2 }}
                />
              )}
              {felt}
            </Fragment>
          )
        })}
      </div>

      {/* CTA — gør strimlen aktiv: invitér til at logge. In-page-anker til
          dagbogen (#dagbog) frem for en død forklarings-linje pr. felt. */}
      <a
        href="#dagbog"
        className="mt-3.5 flex items-center justify-center gap-1.5"
        style={{ borderTop: '1px solid rgba(36,48,31,0.08)', paddingTop: 12, fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: '#5E7D4F', letterSpacing: '0.01em' }}
      >
        Log nyt på planten
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
      </a>
    </>
  )
}

/**
 * Aktiv-plante-tæller — mekanisk flip-counter / odometer-inspireret
 * instrument. 92×54 afrundet rektangel med mørk mat baggrund og en
 * subtil vandret split-linje på midten der antyder den klassiske
 * flip-clock æstetik uden at gå i full retro mode.
 *
 * Visuelt rim med frøkortets seed-count-ring (samme glas-mørke
 * baggrund, samme papirfarvet tekst), men formen er rektangulær
 * og betydningen er en helt anden:
 *   frøkort:    rest af en batch (krymper når man bruger)
 *   plantekort: antal aktive planter (vokser når man planter)
 */
function ActivePlantCounter({ count }: { count: number }) {
  return (
    <div
      className="pointer-events-none absolute right-[24px] top-[28px] z-20"
      style={{ width: 78, height: 54 }}
    >
      {/* Tæller-baggrund */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          borderRadius: 20,
          background: 'rgba(36,48,31,0.72)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          border: '1px solid rgba(246,243,235,0.18)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
        }}
      />

      {/* Subtil flip-split — antyder mekanisk tæller uden retro-gimmick */}
      <div
        aria-hidden
        className="absolute inset-x-0"
        style={{
          top: '50%',
          height: 1,
          background: 'rgba(246,243,235,0.10)',
        }}
      />

      {/* Tal + label, centreret */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          style={{
            fontFamily: sans,
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: '#F6F3EB',
          }}
        >
          {count}
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'rgba(246,243,235,0.72)',
            marginTop: 2,
          }}
        >
          {count === 1 ? 'plante' : 'planter'}
        </span>
      </div>
    </div>
  )
}

/**
 * Vækststadie-bjælke — plantens rejse fra Plan til Høstklar læst
 * som ét vandret printet stadie-spor:
 *
 *   PLAN ─────────── I VÆKST ─────────── HØSTKLAR
 *
 * Layout: én højre-stillet stadie-tekst i toppen + ét vandret spor
 * (1px baseline + 7 mellemstadie-ticks) + en 3px afrundet progress-
 * linje fra start til nuværende stadie + en 6px nuværende-position-
 * dot. Tre anker-labels under sporet i lige afstand.
 *
 * Farve-logik: progress-linjen er ALTID #617345 (sund vækst-grøn) så
 * sporet aldrig veksler farve som en SaaS-progress-bar. Kun stadie-
 * teksten øverst skifter farve — til #C89A35 når planten er "ready/
 * attention" (klar_til_udplantning / hoestklar). Det giver et roligt
 * spor og bevarer status-signal som ét enkelt typografisk punkt.
 */
function GrowthStageBar({
  status,
  statusLabel,
  startAnchor,
}: {
  status: PlantStatus
  statusLabel: string
  /** Venstre anker-label — "Sået" for frø-baserede planter, "Plantet"
   *  for købte potteplanter/knolde. Reglen ejes af kort-komponenten. */
  startAnchor: 'Sået' | 'Plantet'
}) {
  const pos = statusPosition(status)
  const ticks = 7 // mellem 8 stadier
  const trackColor = '#617345' // altid sund vækst-grøn på selve sporet

  // Den grønne progress-markør dukker først op når planten faktisk er
  // i jorden. "Planlagt" er kun en idé — sporet skal stå tomt så
  // brugeren visuelt forstår at rejsen endnu ikke er begyndt.
  const inGround = status !== 'planlagt'

  // Stadie-tekstens farve — kun her veksler farven mellem ro og signal
  let textColor = '#617345'
  if (status === 'klar_til_udplantning' || status === 'hoestklar') {
    textColor = '#C89A35'
  } else if (status === 'planlagt' || status === 'afsluttet') {
    textColor = 'rgba(36,48,31,0.50)' // dæmpet for ikke-aktive stadier
  }

  return (
    <div>
      {/* Højre-stillet stadie-tekst — eneste tekstmæssige status-signal.
          Lowercase begyndelsesbogstav for at undgå overskrifts-energi:
          "klar til udplantning" læses som notat, ikke som etiket. */}
      <div className="flex justify-end">
        <span
          style={{
            fontFamily: sans,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: textColor,
            lineHeight: 1,
          }}
        >
          {statusLabel.charAt(0).toLowerCase() + statusLabel.slice(1)}
        </span>
      </div>

      {/* Sporet */}
      <div className="relative" style={{ height: 8, marginTop: 11 }}>
        {/* Base-linje */}
        <div
          className="absolute left-0 right-0"
          style={{ top: 3.5, height: 1, background: 'rgba(36,48,31,0.12)' }}
        />
        {/* Tick-marks — mellem hver af de 8 stadier */}
        {Array.from({ length: ticks }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${((i + 1) / 8) * 100}%`,
              top: 0,
              width: 1,
              height: 8,
              marginLeft: -0.5,
              background: 'rgba(36,48,31,0.12)',
            }}
          />
        ))}
        {/* Aktiv progress + nuværende position-dot. Vises kun når
            planten er i jorden — "planlagt" har ingen progress endnu. */}
        {inGround && (
          <>
            <div
              className="absolute rounded-full"
              style={{
                top: 2.5,
                height: 3,
                left: 0,
                width: `${pos * 100}%`,
                background: trackColor,
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                top: 1,
                width: 6,
                height: 6,
                left: `${pos * 100}%`,
                marginLeft: -3,
                background: trackColor,
              }}
            />
          </>
        )}
      </div>

      {/* Anker-labels — SÅET/PLANTET · I VÆKST · HØSTKLAR.
          Diskret og lige afstand, aldrig dominerende. */}
      <div
        className="flex justify-between"
        style={{
          marginTop: 10,
          fontFamily: sans,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: 'rgba(36,48,31,0.52)',
          textTransform: 'uppercase',
        }}
      >
        <span>{startAnchor}</span>
        <span>I vækst</span>
        <span>Høstklar</span>
      </div>
    </div>
  )
}
