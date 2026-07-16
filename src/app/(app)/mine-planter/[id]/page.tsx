import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlantCard } from '@/components/mine-planter/plant-card'
import { PlantKarakter } from '@/components/mine-planter/plant-karakter'
import { PlantNaeste } from '@/components/mine-planter/plant-naeste'
import { PlantTidslinje } from '@/components/mine-planter/plant-tidslinje'
import { PlantGalleri } from '@/components/mine-planter/plant-galleri'
import { PlantFotoManager } from '@/components/mine-planter/plant-foto-manager'
import { PlantSammenligning } from '@/components/mine-planter/plant-sammenligning'
import { LogForm } from '@/components/mine-planter/log-form'
import { Timeline } from '@/components/mine-planter/timeline'
import { karakterFor, type PlantKarakter as Karakter } from '@/data/plant-karakter'
import { overrideFor, type PlantDetail } from '@/data/plant-detail'
import { buildPlantDetail } from '@/lib/plant-detail/build-plant-detail'
import { PLANT_STATUS_META } from '@/lib/constants'
import {
  getMockPlantById,
  mockPlantTasks,
  type MockPlant,
  type MockPlantLog,
} from '@/data/mock-plants'
import type { Plant, PlantLog } from '@/lib/types'
import { getPlant, getPlantLogs } from '@/actions/mine-planter'
import { PlanteAdmin } from '@/components/mine-planter/plante-admin'
import { IMPORTED_GUIDES } from '@/data/guides-imported'
import { resolvePlantGuideHref } from '@/lib/plant-detail/resolve-guide-href'
import {
  ArrowLeft,
  ChevronRight,
  History,
  Lightbulb,
  NotebookText,
  Plus,
} from 'lucide-react'

/** Logging-kontekst: brugerens rigtige logs + om de kan redigeres (logget ind). */
interface LogContext {
  logs: PlantLog[]
  canLog: boolean
}

interface Props {
  params: Promise<{ id: string }>
}

// Dynamisk: siden henter brugerens plante via getPlant() (cookies/Supabase).
// Uden dette kaster produktions-renderen DYNAMIC_SERVER_USAGE → 500.
export const dynamic = 'force-dynamic'

/**
 * Plante-detail — real-data først, mock-fallback for demo-browsing.
 *
 * For ægte logged-in brugere fetcher vi planten fra DB via getPlant(id).
 * Hvis ikke fundet (UUID matcher ingen plante for current user), prøver vi
 * mock-data (demo-pathen). Hvis stadig ikke fundet → 404.
 *
 * To render-spor:
 *   • EDITORIAL (ny, fase 1) — når sorten har redaktionelt detalje-
 *     indhold (src/data/plant-detail.ts). Den perfekte planteside som
 *     statisk artefakt: Hero → Mål → Lige nu → Karakter → Tidslinje →
 *     Billeder → Sammenligning. San Marzano er bygget 1:1 efter mockup.
 *   • KLASSISK (fallback) — alle andre planter beholder det eksisterende
 *     layout, indtil deres detalje-indhold er skrevet sort for sort.
 */
export default async function PlanteDetailPage({ params }: Props) {
  const { id } = await params

  // 1) Real-data path: prøv DB først
  const realPlant = await getPlant(id)
  if (realPlant) {
    // Logget ind med egen plante → hent rigtige logs + tillad logging.
    const logs = await getPlantLogs(realPlant.id)
    return renderDetail(toMockShape(realPlant), null, { logs, canLog: true })
  }

  // 2) Demo-fallback: kig i mock-bibliotek (anonym → ingen skrivning).
  const mockPlant = getMockPlantById(id)
  if (mockPlant) {
    const nextTask = mockPlantTasks.find(t => t.linkedPlantId === mockPlant.id) ?? null
    return renderDetail(mockPlant, nextTask, { logs: [], canLog: false })
  }

  notFound()
}

/**
 * Wrap en ægte Plant i MockPlant-form med tomme/default extras, så
 * detail-siden kan rendre uden større refaktorering. Sektioner der
 * afhænger af extras (Billeder, Noter, Dyrkningsguide) vil vise tomme
 * tilstande — det er korrekt: brugeren har endnu ikke logget noget.
 */
function toMockShape(plant: Plant): MockPlant {
  return {
    ...plant,
    seedId: plant.sourceElementId ?? '',
    type: 'Plante',
    sownDate: plant.sowDate ?? null,
    sproutedDate: null,
    repottedDate: null,
    plantedOutDate: plant.plantingOutDate ?? null,
    expectedHarvestStart: null,
    expectedHarvestEnd: null,
    notes: '',
    pictures: [],
    latestActivity: {
      id: `activity-${plant.id}`,
      plantId: plant.id,
      plantName: plant.name,
      action: PLANT_STATUS_META[plant.status]?.label ?? 'Aktiv',
      when: plant.updatedAt,
    },
    nextAction: {
      id: `next-${plant.id}`,
      plantId: plant.id,
      plantName: plant.name,
      action: 'Tjek planten',
      timing: 'Når du har tid',
      image: plant.primaryImageId ?? null,
    },
    logs: [],
    guide: {
      title: '',
      body: '',
    },
  }
}

function renderDetail(
  plant: MockPlant,
  nextTask: import('@/lib/types').CalendarTask | null,
  log: LogContext,
) {
  const karakter = karakterFor(plant.guideId)
  const resolvedNextTask =
    nextTask ?? mockPlantTasks.find(task => task.linkedPlantId === plant.id) ?? null

  // Data-drevet editorial som STANDARD for ALLE planter (Annas beslutning,
  // 2026-06-15). Override (hvis sorten har en, fx San Marzano) beriger
  // siden — ellers bygges den helt af plantens egne data. plant-detail.ts
  // er ikke længere adgangsbillet til layoutet.
  const detail = buildPlantDetail({ plant, override: overrideFor(plant.guideId) })
  // "Se guide" skal føre til DEN relevante guide (art/sort), ikke /guides-forsiden.
  if (detail.naeste) detail.naeste.guideHref = resolvePlantGuideHref(plant, IMPORTED_GUIDES)
  return renderEditorial(plant, detail, karakter, resolvedNextTask, log)
}

/**
 * EDITORIAL-spor — den perfekte planteside som statisk artefakt.
 * Rækkefølge (Annas valg): Plantekort-hero → Karakter → Lige nu →
 * Tidslinje → Billeder → Sammenligning. Dagbog + arkivér diskret nederst.
 *
 * Heroen er det klassiske Plantekort (foto-kort med titel ovenpå + tæller).
 * Dets bundpanel viser Mål-strimlen (Status·Alder·Højde·Sundhed) — den
 * ligger altså OVENPÅ hero-fotoet, i stedet for vækstbjælke + fakta
 * (Annas valg). Drives af `maal`-prop'en på <PlantCard>.
 */
function renderEditorial(
  plant: MockPlant,
  detail: PlantDetail,
  karakter: Karakter | null,
  nextTask: import('@/lib/types').CalendarTask | null,
  log: LogContext,
) {
  return (
    <article className="space-y-5 pb-4">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/mine-planter">
            <ArrowLeft className="h-4 w-4" />
            Tilbage
          </Link>
        </Button>
        {/* Mål-strimlen er Plantekortets bundpanel (Status·Alder·Højde·
            Sundhed) — ligger ovenpå hero-fotoet (Annas valg 14. juni). */}
        <PlantCard plant={plant} nextTask={nextTask} maal={detail.maal} />
      </div>

      {/* KARAKTER = sektion 2, lige efter hero (Annas valg). */}
      {karakter && <PlantKarakter karakter={karakter} />}
      <PlantNaeste naeste={detail.naeste} />
      <PlantTidslinje milestones={detail.tidslinje} />
      {/* Billeder: logget-ind bruger får det INTERAKTIVE galleri (kan tilføje
          fotos til planten når som helst — også efter så-et-frø/onboarding).
          Demo-browsing beholder det statiske, kuraterede galleri. */}
      {log.canLog ? (
        <PlantFotoManager
          plantId={plant.id}
          initialImages={plant.imageIds ?? []}
          initialPrimary={plant.primaryImageId ?? null}
        />
      ) : (
        detail.billeder.length > 0 && <PlantGalleri billeder={detail.billeder} />
      )}
      {detail.sammenligning && <PlantSammenligning data={detail.sammenligning} />}

        <DagbogSektion plant={plant} log={log} />

        <PlanteAdmin
          plantId={plant.id}
          name={plant.name}
          variety={plant.variety ?? null}
          location={plant.location ?? null}
          isArchived={plant.isArchived}
        />
    </article>
  )
}

/**
 * PLANTENS HISTORIE — én aktuel hændelse stor, resten foldet væk.
 *
 * Anna (14. juni 2026, mockup): dagbogen er ikke en liste — den er ÉT
 * opslag. Seneste hændelse fylder det hele: chip + dominerende dato +
 * handlingen som serif-overskrift + noten som brødtekst + "DET BETØD"-
 * callout (Potalots stemme, med pære). Resten ligger bag "Se hele
 * historien". Handlingen ("Bundet op") er nu overskriften — ikke skjult
 * metadata; noten er fortællingen under den.
 *
 * Ægte (logget-ind) bruger beholder Timeline (redigér/slet via LogForm).
 * Demo viser det redaktionelle opslag fra mock-loggen.
 */
const sansFont = 'var(--font-manrope)'
const serifFont = 'var(--font-cormorant), Georgia, serif'
const GROEN = '#5A7038'
const BLAEK = '#24301F'

function dagbogDag(date: string): string {
  return String(new Date(date).getDate()).padStart(2, '0')
}
function dagbogMaaned(date: string): string {
  return new Intl.DateTimeFormat('da-DK', { month: 'short' })
    .format(new Date(date))
    .replace('.', '')
    .toUpperCase()
}

function DagbogSektion({ plant, log }: { plant: MockPlant; log: LogContext }) {
  const { logs, canLog } = log
  // Nyeste først: [0] er helten, resten ligger bag "Se hele historien".
  const kapitler = [...plant.logs].sort((a, b) => b.date.localeCompare(a.date))
  const seneste = kapitler[0]
  const aeldre = kapitler.slice(1)
  const aar = plant.sowDate ? new Date(plant.sowDate).getFullYear() : ''

  return (
    <section
      id="dagbog"
      style={{ background: '#FBF8EC', border: '1px solid rgba(36,48,31,0.08)', borderRadius: 24, padding: 24, scrollMarginTop: 80 }}
    >
      {/* Header — ikon-badge + titel/underlinje + Tilføj. */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className="flex shrink-0 items-center justify-center"
            style={{ width: 46, height: 46, borderRadius: 14, background: '#E7ECDD', color: '#3D4A2C' }}
          >
            <NotebookText className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <p
              className="uppercase whitespace-nowrap"
              style={{ fontFamily: sansFont, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.15em', color: '#3D4A2C', margin: 0 }}
            >
              Plantens historie
            </p>
            <p style={{ fontFamily: sansFont, fontSize: 14, fontWeight: 400, color: 'rgba(36,48,31,0.55)', margin: '3px 0 0' }}>
              Din logbog for {plant.variety ?? plant.name}{aar ? ` i ${aar}` : ''}.
            </p>
          </div>
        </div>
        {canLog ? (
          <LogForm
            plantId={plant.id}
            trigger={
              <Button variant="outline" size="sm" className="shrink-0 rounded-full bg-card/70">
                <Plus className="h-4 w-4" />
                Tilføj
              </Button>
            }
          />
        ) : (
          <Button variant="outline" size="sm" className="shrink-0 rounded-full bg-card/70" disabled>
            <Plus className="h-4 w-4" />
            Tilføj
          </Button>
        )}
      </div>

      {/* Ægte bruger → funktionel Timeline. Demo → redaktionelt opslag. */}
      {canLog ? (
        <div className="mt-5">
          {logs.length > 0 ? (
            <Timeline plant={plant} logs={logs} showMilestones={false} />
          ) : (
            <p className="py-2 text-sm italic text-muted-foreground">
              Ingen historie endnu. Tilføj dit første kapitel.
            </p>
          )}
        </div>
      ) : !seneste ? (
        <p className="mt-5 py-2 text-sm italic text-muted-foreground">Ingen historie endnu.</p>
      ) : (
        <>
          <DagbogHero entry={seneste} />

          {/* Se hele historien — folder de ældre kapitler ud. */}
          {aeldre.length > 0 && (
            <details className="group">
              <summary
                className="mt-6 flex cursor-pointer list-none items-center justify-between border-t pt-4 [&::-webkit-details-marker]:hidden"
                style={{ borderColor: 'rgba(36,48,31,0.1)' }}
              >
                <span className="flex items-center gap-2.5" style={{ fontFamily: sansFont, fontSize: 15, fontWeight: 600, color: BLAEK }}>
                  <History className="h-[18px] w-[18px]" strokeWidth={2} style={{ color: GROEN }} aria-hidden />
                  Se hele historien
                </span>
                <ChevronRight
                  className="h-[18px] w-[18px] transition-transform group-open:rotate-90"
                  strokeWidth={2}
                  style={{ color: 'rgba(36,48,31,0.4)' }}
                  aria-hidden
                />
              </summary>
              <ol className="mt-2">
                {aeldre.map((entry) => (
                  <DagbogListe key={entry.id} entry={entry} />
                ))}
              </ol>
            </details>
          )}
        </>
      )}
    </section>
  )
}

/**
 * Seneste hændelse — opslaget. Chip + dominerende dato | streg | indhold.
 * Handlingen er serif-overskriften; noten er brødteksten; konsekvensen
 * bliver "DET BETØD"-callout (Potalots stemme).
 */
function DagbogHero({ entry }: { entry: MockPlantLog }) {
  return (
    <div className="mt-6">
      <span
        className="inline-block uppercase"
        style={{ fontFamily: sansFont, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#4A5A33', background: '#E3E9D4', borderRadius: 999, padding: '6px 13px' }}
      >
        Seneste hændelse
      </span>

      <div className="mt-5 flex gap-5">
        {/* Dato-søjle. */}
        <div className="shrink-0" style={{ width: 60 }}>
          <p style={{ fontFamily: serifFont, fontWeight: 600, fontSize: 50, lineHeight: 0.9, letterSpacing: '-0.01em', color: BLAEK, margin: 0 }}>
            {dagbogDag(entry.date)}
          </p>
          <p className="uppercase" style={{ fontFamily: sansFont, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(36,48,31,0.5)', margin: '6px 0 0' }}>
            {dagbogMaaned(entry.date)}
          </p>
        </div>

        {/* Lodret streg. */}
        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(36,48,31,0.12)' }} aria-hidden />

        {/* Indhold. */}
        <div className="min-w-0 flex-1">
          <h3 style={{ fontFamily: serifFont, fontWeight: 600, fontSize: 30, lineHeight: 1.02, letterSpacing: '-0.005em', color: BLAEK, margin: 0 }}>
            {entry.action}
          </h3>
          {entry.note && (
            <p style={{ fontFamily: sansFont, fontSize: 15.5, fontWeight: 400, lineHeight: 1.5, color: 'rgba(36,48,31,0.72)', margin: '12px 0 0' }}>
              {entry.note}
            </p>
          )}

          {entry.konsekvens && (
            <div
              className="mt-5"
              style={{ background: '#E8EDE0', borderRadius: 16, padding: '16px 18px', width: 'calc(100% - 7mm)' }}
            >
              {/* Pære + overskrift på samme horisontale linje, midterjusteret. */}
              <div className="flex items-center gap-3">
                <span
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.6)', color: GROEN }}
                >
                  <Lightbulb className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
                </span>
                <p className="uppercase" style={{ fontFamily: sansFont, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: GROEN, margin: 0 }}>
                  Det betød
                </p>
              </div>
              {/* Brødtekst under — venstrekant på linje med ikonet. */}
              <p style={{ fontFamily: sansFont, fontSize: 14.5, fontWeight: 500, lineHeight: 1.45, color: 'rgba(45,58,36,0.85)', margin: '12px 0 0' }}>
                {entry.konsekvens}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Ældre kapitel — samme anatomi (dato | streg | indhold), men dæmpet.
 * Konsekvensen koger ind til én rolig "→"-linje.
 */
function DagbogListe({ entry }: { entry: MockPlantLog }) {
  return (
    <li
      className="flex gap-5"
      style={{ paddingTop: 18, marginTop: 18, borderTop: '1px solid rgba(36,48,31,0.07)' }}
    >
      <div className="shrink-0" style={{ width: 60 }}>
        <p style={{ fontFamily: serifFont, fontWeight: 600, fontSize: 28, lineHeight: 0.95, color: 'rgba(36,48,31,0.6)', margin: 0 }}>
          {dagbogDag(entry.date)}
        </p>
        <p className="uppercase" style={{ fontFamily: sansFont, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(36,48,31,0.4)', margin: '5px 0 0' }}>
          {dagbogMaaned(entry.date)}
        </p>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(36,48,31,0.08)' }} aria-hidden />
      <div className="min-w-0 flex-1">
        <h4 style={{ fontFamily: serifFont, fontWeight: 600, fontSize: 21, lineHeight: 1.1, color: '#2D2A24', margin: 0 }}>
          {entry.action}
        </h4>
        {entry.note && (
          <p style={{ fontFamily: sansFont, fontSize: 14, fontWeight: 400, lineHeight: 1.45, color: 'rgba(45,42,36,0.6)', margin: '7px 0 0' }}>
            {entry.note}
          </p>
        )}
        {entry.konsekvens && (
          <p
            className="flex items-start gap-1.5"
            style={{ fontFamily: sansFont, fontSize: 12.5, fontWeight: 500, lineHeight: 1.4, color: 'rgba(36,48,31,0.5)', margin: '9px 0 0' }}
          >
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: 'rgba(90,112,56,0.7)' }} aria-hidden />
            {entry.konsekvens}
          </p>
        )}
      </div>
    </li>
  )
}

