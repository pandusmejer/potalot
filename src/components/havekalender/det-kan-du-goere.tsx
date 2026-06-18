'use client'

/**
 * "Det kan du gøre i [måned]" — sektionen der erstatter den gamle
 * "Månedens guide". Et roligt papir-card med månedens admin-kuraterede
 * gøremål (sæsonbestemt haveviden), navigerbart måned for måned.
 *
 * NB om navngivning: skærm-navn = kode-navn (DetKanDuGoere). Komponenten
 * viser p.t. KUN gøremåls-listen ("MÅNEDENS GØREMÅL"). Selve
 * Dyrkningsrytme-visualiseringen (rytme-tidslinje pr. afgrøde) bor i
 * `TimingHorisont` og er gated bag Årshjul-blokken — ikke her.
 *
 * MÅ IKKE føles som: blog-guide, artikel-card, opgave-liste,
 * dashboard-widget, Gantt-chart eller Notion-database.
 */

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  ChevronDown, ChevronLeft, ChevronRight, Info, Check,
  Sprout, Wheat, Droplets, Scissors, Leaf, Sun, Snowflake, CloudRain,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import type { GeneralGardenTask } from '@/lib/types'
import { MONTHS_DA } from '@/lib/constants'
import { hideGeneralTask } from '@/actions/aarshjul'
import { createTask, completeTask, deleteTask } from '@/actions/havekalender'

const sans = 'var(--font-manrope)'

interface Props {
  month: number
  year: number
  generalTasks: GeneralGardenTask[]
  /** Om brugeren er logget ind. I demo-mode er server actions ikke
   *  tilgængelige — knapperne disables i stedet for at redirecte. */
  isLoggedIn: boolean
}

export function DetKanDuGoere({ month, year, generalTasks, isLoggedIn }: Props) {
  // Lokal state: hvilken måned vises i card'et. Starter på aktuel måned
  // (prop'en) men kan ændres via APRIL ← / → JUNI navigation. Card'ets
  // indhold reagerer på denne state — titel og focus-tasks.
  const [viewMonth, setViewMonth] = useState(month)
  void year

  const maaned = MONTHS_DA[viewMonth - 1]
  const maanedNavn = maaned.full

  // Forrige/næste måned med wrap-around (jan → dec, dec → jan)
  const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1
  const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1
  const prevLabel = MONTHS_DA[prevMonth - 1].full
  const nextLabel = MONTHS_DA[nextMonth - 1].full

  // Alle admin-kuraterede gøremål for den valgte måned (sorteret
  // efter prioritet). De første 3 vises som "Månedens fokus"; resten
  // foldes ud bag CTA'en.
  const allMonthTasks = buildMonthTasks(generalTasks, viewMonth)

  return (
    <section
      aria-label={`Det kan du gøre i ${maaned.full}`}
      style={{
        marginInline: 0,
        marginTop: 8,
        borderRadius: 26,
        background: 'rgba(246,243,235,0.94)',
        border: '1px solid rgba(36,48,31,0.08)',
        boxShadow: '0 8px 24px rgba(36,48,31,0.05)',
        overflow: 'hidden',
      }}
    >
      <CardHeader
        maanedNavn={maanedNavn}
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        onPrev={() => setViewMonth(prevMonth)}
        onNext={() => setViewMonth(nextMonth)}
      />

      <FokusBlock
        tasks={allMonthTasks}
        maaned={maaned.full}
        month={viewMonth}
        isLoggedIn={isLoggedIn}
      />
    </section>
  )
}

// ════════════════════════════════════════════════════════════════
// HEADER
// ════════════════════════════════════════════════════════════════

function CardHeader({
  maanedNavn,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
}: {
  maanedNavn: string
  prevLabel: string
  nextLabel: string
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <header
      style={{
        padding: '18px 24px 16px',
        background:
          'linear-gradient(180deg, rgba(246,243,235,0.98), rgba(246,243,235,0.90))',
      }}
    >
      {/* Top-række: måneds-navigation. */}
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <NavButton direction="prev" label={prevLabel} onClick={onPrev} />
        <NavButton direction="next" label={nextLabel} onClick={onNext} />
      </div>

      {/* Sektion-titel — matcher "Denne uge i haven"-card'ets titel-
          stil (Manrope 800, 18px) så de to sektion-cards føles som
          ÉT system: uge-laget og måned-laget. */}
      <h2
        style={{
          fontFamily: sans,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#24301F',
          margin: 0,
        }}
      >
        Det kan du gøre i
      </h2>

      {/* Måneds-navn som content-titel under sektionen — bærer den
          variable identitet (Maj / Juni / ...). Cormorant Garamond
          500 så månedsnavnet får editorial vægt og matcher
          "Kommende"-card'ets serif-tone. */}
      <p
        style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: '#24301F',
          margin: 0,
          marginTop: 8,
        }}
      >
        {maanedNavn}
      </p>
    </header>
  )
}

function NavButton({
  direction,
  label,
  onClick,
}: {
  direction: 'prev' | 'next'
  label: string
  onClick: () => void
}) {
  const isPrev = direction === 'prev'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? `Forrige måned: ${label}` : `Næste måned: ${label}`}
      className="inline-flex items-center"
      style={{
        gap: 4,
        padding: '4px 8px',
        marginInline: -8, // overflod så hit-target rækker forbi tekst
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: sans,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#6F7563',
      }}
    >
      {isPrev && <ChevronLeft width={14} height={14} strokeWidth={2} />}
      {label}
      {!isPrev && <ChevronRight width={14} height={14} strokeWidth={2} />}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════
// MÅNEDENS FOKUS — 3 prioriterede tasks + fold-ud med resten
// ════════════════════════════════════════════════════════════════

interface FocusTask {
  id: string
  title: string
  description: string
  category: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

/** Slug brugt til at finde månedens hero-billede i /public/images/. */
const MAANED_SLUG = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
] as const

function FokusBlock({
  tasks,
  maaned,
  month,
  isLoggedIn,
}: {
  tasks: FocusTask[]
  maaned: string
  month: number
  isLoggedIn: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  // Sæt af opgave-id'er som brugeren har handlet på (tilføjet, gjort
  // eller skjult). Disse fjernes fra synlige listen; næste opgave fra
  // køen rykker automatisk op så top-listen altid har 3 (hvis der er
  // nok i køen).
  const [actionedIds, setActionedIds] = useState<Set<string>>(new Set())
  const handleActioned = (id: string) => {
    setActionedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  if (tasks.length === 0) return null

  const TOP_COUNT = 3
  const visible = tasks.filter(t => !actionedIds.has(t.id))
  const top = visible.slice(0, TOP_COUNT)
  const rest = visible.slice(TOP_COUNT)
  const hasMore = rest.length > 0

  if (visible.length === 0) {
    return (
      <div style={{ padding: '24px 24px 28px' }}>
        {/* 🔒 LÅST PERMANENT TITEL — "Månedens gøremål" må IKKE omdøbes. */}
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#7B816F',
            margin: 0,
            marginBottom: 10,
          }}
        >
          Månedens gøremål
        </p>
        <p
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.5,
            color: 'rgba(36,48,31,0.62)',
            margin: 0,
          }}
        >
          Ingen flere gøremål denne måned. Resten af haven kan klare sig selv.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '22px 24px 10px' }}>
        {/* 🔒 LÅST PERMANENT TITEL — "Månedens gøremål" må IKKE omdøbes
            (fx til "Gøremål i sæsonen"). Brugervalgt, fast. */}
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#7B816F',
            margin: 0,
          }}
        >
          Månedens gøremål
        </p>
        {/* Editorial rolle: universelle havejobs for måneden — IKKE brugerens
            plantebundne opgaver (dem ejer Ugens fokus). */}
        <p
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'rgba(36,48,31,0.55)',
            margin: '4px 0 0',
          }}
        >
          Forslag til hele haven i {maaned.toLowerCase()} — ikke kun dine planter.
        </p>
      </div>

      {/* Top 3 — den primære liste. Rækker er nu separate
          rektangler med drop-skygge; mellem-spacing giver dem luft. */}
      <div
        style={{
          paddingInline: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {top.map((t, i) => (
          <FocusTaskRow
            key={t.id}
            task={t}
            month={month}
            stripIndex={i}
            isLoggedIn={isLoggedIn}
            onActioned={handleActioned}
          />
        ))}
      </div>

      {/* Fold-ud: resten af månedens gøremål. */}
      {hasMore && expanded && (
        <div
          style={{
            paddingInline: 12,
            paddingTop: 4,
            borderTop: '1px solid rgba(36,48,31,0.06)',
            marginTop: 14,
          }}
        >
          <p
            style={{
              fontFamily: sans,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#A7B098',
              margin: 0,
              padding: '12px 12px 8px',
            }}
          >
            Også i {maaned.toLowerCase()}
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {rest.map((t, i) => (
              <FocusTaskRow
                key={t.id}
                task={t}
                month={month}
                stripIndex={top.length + i}
                isLoggedIn={isLoggedIn}
                onActioned={handleActioned}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom toggle — symmetrisk med "Se alle afgrøder" øverst. */}
      {hasMore && (
        <FoldOutButton
          expanded={expanded}
          onClick={() => setExpanded(v => !v)}
          collapsedLabel={`Se alle ${genitiveMonth(maaned)} gøremål (${visible.length})`}
          expandedLabel={`Vis færre (${TOP_COUNT})`}
        />
      )}
    </div>
  )
}

/**
 * Et månedsgøremål som redaktionelt forslag (Gardeners' World "jobs this
 * month"), IKKE en plantebunden task. Knap-hierarki (Anna 18/6):
 *   default:  [Tilføj til mine opgaver] (primær) · [Skjul] (sekundær, diskret)
 *   tilføjet: ✓ Tilføjet · [Marker som klaret] (tertiær) · [Fjern]
 *   klaret:   dæmpet ✓ Klaret
 * "Klaret" er bevidst IKKE en primær handling — brugeren vælger først, om
 * gøremålet er relevant for deres have.
 *
 * Hero-strimmel langs venstre kant (watermark af månedens billede) bindes
 * visuelt til resten af kalenderen.
 */
function FocusTaskRow({
  task,
  month,
  stripIndex,
  isLoggedIn,
  onActioned,
}: {
  task: FocusTask
  month: number
  stripIndex: number
  isLoggedIn: boolean
  onActioned: (id: string) => void
}) {
  const [pending, startTransition] = useTransition()
  const [demoNotice, setDemoNotice] = useState(false)
  const [rowState, setRowState] = useState<'default' | 'added' | 'done'>('default')
  const [createdId, setCreatedId] = useState<string | null>(null)

  const showDemoIfNeeded = (): boolean => {
    if (isLoggedIn) return false
    setDemoNotice(true)
    return true
  }

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (showDemoIfNeeded()) return
    startTransition(async () => {
      const today = new Date().toISOString().slice(0, 10)
      const res = await createTask({
        title: task.title,
        description: task.description || undefined,
        date: today,
        taskType: 'custom',
        priority: 'medium',
        source: 'general',
        sourceId: task.id,
      })
      if (res && 'id' in res) {
        setCreatedId(res.id)
        setRowState('added')
      }
    })
  }

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (showDemoIfNeeded()) return
    startTransition(async () => {
      await hideGeneralTask(task.id)
      onActioned(task.id)
    })
  }

  // Tertiær — kun efter gøremålet er gjort til en personlig opgave.
  const handleDone = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!createdId) return
    startTransition(async () => {
      await completeTask(createdId)
      setRowState('done')
    })
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!createdId) return
    startTransition(async () => {
      await deleteTask(createdId)
      setCreatedId(null)
      setRowState('default')
    })
  }

  if (demoNotice) {
    return <ConfirmationRow status="demo" title={task.title} />
  }

  const heroSrc = `/images/heroes-maaneder/hero-${MAANED_SLUG[month - 1] ?? 'maj'}-foto.png`
  const stripOffsets = ['12%', '38%', '64%', '88%', '24%', '52%', '76%', '4%']
  const stripPos = stripOffsets[stripIndex % stripOffsets.length]
  const cat = categoryLabel(task.category)

  return (
    <div
      style={{
        position: 'relative',
        padding: '11px 14px 12px 30px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.62)',
        border: '1px solid rgba(36,48,31,0.05)',
        boxShadow: '0 2px 6px rgba(36,48,31,0.05), 0 1px 2px rgba(36,48,31,0.03)',
        opacity: pending ? 0.55 : rowState === 'done' ? 0.5 : 1,
        transition: 'opacity 180ms ease-out',
        overflow: 'hidden',
      }}
    >
      {/* Hero-watermark langs venstre kant — atmosfærisk, fader ud mod højre. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: 120,
          backgroundImage: `url("${heroSrc}")`,
          backgroundSize: 'auto 100%',
          backgroundPosition: `${stripPos} center`,
          backgroundRepeat: 'no-repeat',
          maskImage:
            'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Kategori-chip øverst — markerer at det er et redaktionelt forslag. */}
      {cat && (
        <span
          style={{
            position: 'relative', zIndex: 1, display: 'inline-block',
            fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'rgba(36,48,31,0.5)',
            background: 'rgba(36,48,31,0.06)', padding: '2px 9px', borderRadius: 999,
            marginBottom: 6,
          }}
        >
          {cat}
        </span>
      )}

      <p style={{ position: 'relative', zIndex: 1, fontFamily: sans, fontSize: 15, fontWeight: 800, lineHeight: 1.2, color: '#24301F', margin: 0 }}>
        {task.title}
      </p>
      {task.description && (
        <p style={{ position: 'relative', zIndex: 1, fontFamily: sans, fontSize: 12, fontWeight: 500, lineHeight: 1.35, color: 'rgba(36,48,31,0.62)', margin: '3px 0 0' }}>
          {task.description}
        </p>
      )}

      {/* Handlinger — afhænger af state. */}
      {rowState === 'default' && (
        <div className="flex items-center" style={{ position: 'relative', zIndex: 1, gap: 8, marginTop: 11 }}>
          <ActionPill aria-label="Tilføj til mine opgaver" onClick={handleAdd} disabled={pending} variant="primaryFilled" style={{ flex: 1 }}>
            Tilføj til mine opgaver
          </ActionPill>
          <ActionPill aria-label="Skjul — ikke relevant for min have" onClick={handleHide} disabled={pending} variant="ghost">
            Skjul
          </ActionPill>
        </div>
      )}

      {rowState === 'added' && (
        <div style={{ position: 'relative', zIndex: 1, marginTop: 10 }}>
          <p className="inline-flex items-center" style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: '#3D5A26', margin: 0, gap: 5 }}>
            <Check width={14} height={14} strokeWidth={2.4} aria-hidden />
            Tilføjet til dine opgaver
          </p>
          <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
            <ActionPill aria-label="Marker som klaret" onClick={handleDone} disabled={pending} variant="outline">
              Marker som klaret
            </ActionPill>
            <ActionPill aria-label="Fjern fra mine opgaver igen" onClick={handleRemove} disabled={pending} variant="ghost">
              Fjern
            </ActionPill>
          </div>
        </div>
      )}

      {rowState === 'done' && (
        <p className="inline-flex items-center" style={{ position: 'relative', zIndex: 1, fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: 'rgba(36,48,31,0.5)', margin: '11px 0 0', gap: 5 }}>
          <Check width={14} height={14} strokeWidth={2.4} aria-hidden />
          Klaret
        </p>
      )}
    </div>
  )
}

/** Pæn label for en gøremåls-kategori (admin-slug → dansk). Fallback: kapitalisér. */
function categoryLabel(cat: string): string {
  if (!cat) return ''
  const map: Record<string, string> = {
    vanding: 'Vanding', drivhus: 'Drivhus', ukrudt: 'Ukrudt', jord: 'Jord',
    skadedyr: 'Skadedyr', ferie: 'Ferie', hoest: 'Høst', høst: 'Høst',
    pleje: 'Pleje', saaning: 'Såning', saning: 'Såning', såning: 'Såning',
    blomster: 'Blomster', biodiversitet: 'Biodiversitet', koekkenhave: 'Køkkenhave',
    udplantning: 'Udplantning', kompost: 'Kompost', graes: 'Plæne', plaene: 'Plæne',
    haek: 'Hæk', stauder: 'Stauder', krukker: 'Krukker',
  }
  const key = cat.toLowerCase().trim()
  return map[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * (Tidligere CheckButton-komponent fjernet — markér-som-gjort-
 * funktionen er pillet ud af denne sektion. Hvis den genaktiveres
 * skal CheckButton + handleDone + createTask({status:'completed'})
 * pattern flyttes ind igen.)
 */
function _RemovedCheckButton() {
  return null
}

// (buildOrganicEdge fjernet — hero-strimlen bruger nu en simpel
// horisontal linear-gradient mask til at fade ud mod papirbaggrunden.
// Hvis bølge-kant skal genaktiveres senere, kan funktionen gendannes
// fra git-historik.)

/**
 * Genbrugelig fold-out knap. Bruges af BÅDE crops- og fokus-blokken
 * så de visuelt opfører sig ens: fuld-bredde række, border-top som
 * sektion-separator, mørk tekst, V-pil der roterer 180° når åben.
 */
function FoldOutButton({
  expanded,
  onClick,
  collapsedLabel,
  expandedLabel,
}: {
  expanded: boolean
  onClick: () => void
  collapsedLabel: string
  expandedLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="flex w-full items-center justify-between"
      style={{
        marginTop: 8,
        height: 48,
        padding: '0 24px',
        background: 'transparent',
        borderWidth: 0,
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: 'rgba(36,48,31,0.06)',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 700,
          // Let dæmpet — knapperne er sekundære affordances, ikke
          // primære CTA'er. Skal indikere "der er mere" uden at
          // konkurrere med selve listen ovenfor.
          color: 'rgba(36,48,31,0.55)',
        }}
      >
        {expanded ? expandedLabel : collapsedLabel}
      </span>
      <ChevronDown
        width={18}
        height={18}
        strokeWidth={1.8}
        style={{
          color: 'rgba(36,48,31,0.45)',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 200ms ease-out',
        }}
      />
    </button>
  )
}

/**
 * Dansk genitiv for månedsnavne. De fleste måneder får simpelt s:
 * "maj" → "majs", "april" → "aprils". "Marts" ender allerede på s, så
 * vi tilføjer ikke et ekstra (moderne dansk konvention er at lade
 * apostrof væk: "marts gøremål").
 */
function genitiveMonth(maaned: string): string {
  const lower = maaned.toLowerCase()
  if (lower.endsWith('s')) return lower
  return `${lower}s`
}

/**
 * Tekst-baseret action-pille. Tre varianter:
 *   - done: outline-pille med sage-border og transparent baggrund
 *     + sage tekst og check-ikon. Læser som "klik for at markere
 *     som gjort" — IKKE som en status der allerede er aktiveret.
 *   - primary: subtle sage-tint baggrund + mørkere sage tekst —
 *     "tilføj til kommende opgaver" (planlægning).
 *   - ghost: transparent baggrund + dæmpet olive tekst — sekundær
 *     handling ("Skjul").
 */
function ActionPill({
  children,
  variant,
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  variant: 'primaryFilled' | 'outline' | 'ghost'
}) {
  const styles =
    variant === 'primaryFilled'
      ? {
          background: '#5A6F44',
          color: '#F7F8EF',
          border: 'none',
          padding: '8px 14px',
        }
      : variant === 'outline'
        ? {
            background: 'transparent',
            color: '#3D5A26',
            border: '1.5px solid rgba(90,111,68,0.5)',
            padding: '6px 12px',
          }
        : {
            background: 'transparent',
            color: 'rgba(36,48,31,0.5)',
            border: 'none',
            padding: '7px 10px',
          }
  return (
    <button
      type="button"
      {...props}
      className="inline-flex items-center justify-center"
      style={{
        borderRadius: 999,
        ...styles,
        fontFamily: sans,
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.005em',
        whiteSpace: 'nowrap',
        cursor: props.disabled ? 'default' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        transition: 'background 140ms ease-out, color 140ms ease-out, border-color 140ms ease-out',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/**
 * Bekræftelses-række efter en action — viser en stille "noteret"-
 * tilstand. Vises i ca. 2 sekunder eller indtil næste reload.
 * Bevidst lav-kontrast så det ikke føles som en triumf-banner.
 */
function ConfirmationRow({
  status,
  title,
}: {
  status: 'added' | 'hidden' | 'demo'
  title: string
}) {
  const isDemo = status === 'demo'
  const label = isDemo
    ? 'Opret bruger for at gemme'
    : status === 'added'
      ? 'Tilføjet til mine opgaver'
      : 'Skjult — vises ikke igen'

  const sublabel = isDemo
    ? 'Du ser PotAlot i demo-tilstand'
    : title

  const bg = isDemo
    ? 'rgba(201,160,74,0.12)'
    : status === 'added'
      ? 'rgba(123,148,96,0.10)'
      : 'rgba(36,48,31,0.03)'

  const iconBg = isDemo
    ? 'rgba(201,160,74,0.28)'
    : status === 'added'
      ? 'rgba(123,148,96,0.25)'
      : 'rgba(36,48,31,0.08)'

  const iconColor = isDemo ? '#7A5C12' : status === 'added' ? '#3D5A26' : '#56604D'

  return (
    <div
      className="flex items-center"
      style={{
        gap: 12,
        padding: '14px 12px',
        borderRadius: 14,
        background: bg,
        minHeight: 56,
        opacity: 0.95,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: iconBg,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isDemo ? (
          <Info width={16} height={16} strokeWidth={2} style={{ color: iconColor }} />
        ) : (
          <Check width={16} height={16} strokeWidth={2} style={{ color: iconColor }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            color: '#24301F',
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(36,48,31,0.55)',
            margin: 0,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sublabel}
        </p>
      </div>
      {isDemo && (
        <Link
          href="/opret"
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#7A5C12',
            textDecoration: 'none',
            paddingInline: 10,
            paddingBlock: 6,
            borderRadius: 999,
            background: 'rgba(201,160,74,0.18)',
            flexShrink: 0,
          }}
        >
          Opret bruger
        </Link>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// DATA — focus-tasks udvælgelse
// ════════════════════════════════════════════════════════════════

const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * Heuristisk ikon-valg pr. opgave baseret på category/title-tekst.
 * Vi tager botaniske ikoner først, vejr-ikoner som backup.
 */
function iconForTask(t: GeneralGardenTask): ComponentType<SVGProps<SVGSVGElement>> {
  // Brug kun titel — kategorien indeholder ofte uvedkommende attributter.
  // Vigtigt: handlings-verber vinder over modifikatorer ("Udplant
  // frostfølsomme planter" → spire-ikon, ikke snefnug).
  const txt = t.title.toLowerCase()
  if (/^(udplant|plant)\b/.test(txt)) return Sprout
  if (/^(så|sow|forspir)\b/.test(txt)) return Sprout
  if (/^høst\b/.test(txt)) return Wheat
  if (/^(beskær|skær|tyv|knib)\b/.test(txt)) return Scissors
  if (/^(vand|tilse|gød)\b/.test(txt)) return Droplets
  if (/^(hærd|hold øje|dæk)\b.*(frost|natte)/.test(txt)) return Snowflake
  if (/frost|nattefrost/.test(txt)) return Snowflake
  if (/sol|varme|lys/.test(txt)) return Sun
  if (/regn|skybrud/.test(txt)) return CloudRain
  if (/luft|drivhus/.test(txt)) return Leaf
  return Leaf
}

/**
 * Returner ALLE månedens admin-kuraterede gøremål, sorteret efter
 * prioritet. De første 3 vises som "Månedens fokus"; resten foldes
 * ud bag CTA'en når brugeren ønsker det. Skjulte opgaver
 * (user_hidden_general_tasks) er allerede filtreret væk på server-
 * siden via isHiddenByMe.
 */
function buildMonthTasks(
  tasks: GeneralGardenTask[],
  month: number,
): FocusTask[] {
  return tasks
    .filter(t => t.month === month && t.isActive && !t.isHiddenByMe)
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 0
      const pb = PRIORITY_ORDER[b.priority] ?? 0
      return pb - pa
    })
    .map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || t.timeWindow || t.tip || '',
      category: t.category || '',
      Icon: iconForTask(t),
    }))
}
