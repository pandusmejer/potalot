'use client'

import Link from 'next/link'
import { PLANT_STATUS_META } from '@/lib/constants'
import { dageSiden, formatDatoKort } from '@/lib/datetime'
import type { Plant, PlantStatus, CalendarTask } from '@/lib/types'
import { estimateNextTask } from '@/lib/next-plant-task'
import { Sprout, Calendar, Scissors, BookOpen, Heart, Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Fragment, type ComponentType, type SVGProps } from 'react'
import { resolvePotalotImage } from '@/lib/images/resolve-potalot-image'
import type { DetailMaal } from '@/data/plant-detail'

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
  /** Når sat: bundpanelet viser Mål (Status·Alder·Højde·Sundhed) i stedet
   *  for vækstbjælke + fakta. Bruges på plante-detaljen (editorial-hero). */
  maal?: DetailMaal | null
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
export function PlantCard({ plant, nextTask, maal }: Props) {
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
  const { src: heroImage } = resolvePotalotImage({
    guideId: plant.guideId,
    varietySlug,
    role: 'plant-card',
    preferredSrc: plant.primaryImageId,
  })
  const statusMeta = PLANT_STATUS_META[plant.status]
  const alder = plant.sowDate ? dageSiden(plant.sowDate) : null
  const color = statusColor(plant.status)

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
    'group relative block aspect-[4/5] w-full overflow-hidden rounded-[32px] transition-all duration-200 ease-out',
    'hover:-translate-y-0.5'
  )
  const style = { boxShadow: '0 20px 44px rgba(26,34,22,0.18)' } as const

  return (
    <Link href={`/mine-planter/${plant.id}`} className={className} style={style}>
      {/* FOTO — fylder kortet, bærer al atmosfære. translateY(-11%)
          ligesom frøkort så motivet sidder højere; bund-gabet skjules
          af det varme papirpanel. */}
      {heroImage ? (
        <div aria-hidden className="absolute inset-0" style={{ transform: 'translateY(-11%)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div aria-hidden className="absolute inset-0" style={{ background: color }} />
      )}

      {/* Læsbarheds-scrim — en tand stærkere end frøkort fordi
          plantefotos ofte har tæt tekstur og lav kontrast i toppen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[52%]"
        style={{ background: 'linear-gradient(180deg, rgba(18,14,10,0.46) 0%, rgba(18,14,10,0.14) 60%, transparent 100%)' }}
      />

      {/* TOP-VENSTRE — fast eyebrow + stor titel + sort.
          Eyebrow er ALTID "MIN HAVE · PLANTE" (ikke status-baseret) —
          status hører hjemme i bundpanelet, ikke i identitets-laget. */}
      <div className="absolute left-0 top-0 z-10 max-w-[74%] p-[22px]">
        <p
          className="uppercase"
          style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 5px rgba(20,14,8,0.5)' }}
        >
          MIN HAVE · PLANTE
        </p>
        <h3
          className="mt-3.5"
          style={{ fontFamily: sans, fontSize: 56, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.028em', color: '#FFFFFF', textShadow: '0 3px 22px rgba(20,14,8,0.6)' }}
        >
          {plant.name}
        </h3>
        {plant.variety && (
          <p
            className="mt-2.5"
            style={{ fontFamily: sans, fontSize: 27, fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.015em', color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 12px rgba(20,14,8,0.5)' }}
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
          <MaalRow maal={maal} />
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
    </Link>
  )
}

/**
 * MÅL-RÆKKE — Plantekortets bundpanel på plante-detaljen.
 *
 * Anna (14. juni 2026): Mål-strimlen (Status·Alder·Højde·Sundhed) skal
 * ligge ovenpå heroen, i stedet for vækstbjælke + fakta. Fire rolige
 * kolonner på det varme papirpanel; grøn prik på Status, hjerte på
 * Sundhed, sarte grå ikoner på Alder/Højde.
 */
function MaalRow({ maal }: { maal: DetailMaal }) {
  const felter: {
    label: string
    value: string
    note: string
    dot?: string
    heart?: boolean
    Icon: ComponentType<SVGProps<SVGSVGElement>> | null
  }[] = [
    { label: 'Status', value: maal.statusValue, note: maal.statusNote, dot: '#617345', Icon: null },
    { label: 'Alder', value: maal.alderValue, note: maal.alderNote, Icon: Sprout },
    { label: 'Højde', value: maal.hoejdeValue, note: maal.hoejdeNote, Icon: Ruler },
    { label: 'Sundhed', value: maal.sundhedValue, note: maal.sundhedNote, heart: true, Icon: Heart },
  ]
  return (
    <div className="flex items-stretch">
      {felter.map((f, i) => {
        const Icon = f.Icon
        return (
          <Fragment key={f.label}>
            {i > 0 && (
              <div
                aria-hidden
                className="shrink-0"
                style={{ width: 1, background: 'rgba(36,48,31,0.08)', marginInline: 8, marginBlock: 2 }}
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col px-0.5">
              <span
                className="flex items-center gap-1 uppercase"
                style={{ fontFamily: sans, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(36,48,31,0.46)', lineHeight: 1 }}
              >
                {Icon && <Icon width={12} height={12} strokeWidth={1.75} aria-hidden />}
                {f.label}
              </span>
              <span className="mt-1.5 flex items-center" style={{ gap: 5 }}>
                {f.dot && (
                  <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: f.dot }} />
                )}
                {f.heart && (
                  <Heart width={14} height={14} strokeWidth={2} style={{ color: '#617345' }} aria-hidden className="shrink-0" />
                )}
                <span
                  className="whitespace-nowrap"
                  style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: '#24301F', lineHeight: 1.1 }}
                >
                  {f.value}
                </span>
              </span>
              <span
                className="mt-1 whitespace-nowrap"
                style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: 'rgba(36,48,31,0.5)', lineHeight: 1 }}
              >
                {f.note}
              </span>
            </div>
          </Fragment>
        )
      })}
    </div>
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
