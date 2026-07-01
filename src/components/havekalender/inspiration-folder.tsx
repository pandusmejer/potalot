'use client'

/**
 * Handoff component: compact editorial inspiration folder for Kalender.
 *
 * Status: built for review, not wired into the live calendar.
 *
 * Product role:
 * - Collect optional calendar inspiration in one compact folder.
 * - No task mutations, no checkboxes, no "klaret", no persistence.
 * - Later replacement candidate for the loose inspiration area.
 *
 * Locked visual direction:
 * - Dark botanical folder surface with soft paper cards.
 * - Tabs should feel like a garden-book folder, not a technical tabbar.
 * - Use lucide-react only; no new image assets or icon libraries.
 */

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Droplets,
  Leaf,
  Scissors,
  Sprout,
  Sun,
  Wheat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

type TabId = 'seedbank' | 'june' | 'guides'

interface FolderItem {
  title: string
  text: string
  Icon: LucideIcon
}

interface InspirationFolderProps {
  monthName?: string
  seedItems?: FolderItem[]
  juneItems?: FolderItem[]
  guideItems?: FolderItem[]
  hasSeedSuggestions?: boolean
}

const DEFAULT_SEED_ITEMS: FolderItem[] = [
  {
    title: 'Så et nyt hold salat',
    text: 'Little Gem kan give en ny omgang sprøde blade senere på sommeren.',
    Icon: Leaf,
  },
  {
    title: 'Giv basilikum varme',
    text: 'Basilikum trives bedst, når nætterne er lune og jorden ikke er kold.',
    Icon: Sprout,
  },
  {
    title: 'Hold øje med bønnerne',
    text: 'Bønner spirer hurtigt i lun jord, men hader kulde og våd jord.',
    Icon: Wheat,
  },
]

const DEFAULT_JUNE_ITEMS: FolderItem[] = [
  {
    title: 'Vand dybt og roligt',
    text: 'Planter får mere ud af én grundig vanding end mange hurtige sjatter.',
    Icon: Droplets,
  },
  {
    title: 'Tyv tomaterne',
    text: 'Brug få minutter hver anden dag, så planterne ikke bliver et grønt trafikuheld i juli.',
    Icon: Scissors,
  },
  {
    title: 'Så til sensommeren',
    text: 'Grønkål, salat og kålroer kan nå at give en ny runde senere.',
    Icon: Sprout,
  },
]

const DEFAULT_GUIDE_ITEMS: FolderItem[] = [
  {
    title: 'Tomater i juni',
    text: 'Opbinding, sideskud og vand - det vigtigste lige nu.',
    Icon: Sprout,
  },
  {
    title: 'Såning i varme perioder',
    text: 'Sådan får frøene en god start uden at tørre ud.',
    Icon: Sun,
  },
]

const TABS: Array<{ id: TabId; label: string; Icon: LucideIcon }> = [
  { id: 'seedbank', label: 'Frøbank', Icon: Sprout },
  { id: 'june', label: 'Sæsonråd', Icon: Wheat },
  { id: 'guides', label: 'Guides', Icon: BookOpen },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Die-cut manillamappe-silhuet
 *
 * Toppen tegnes IKKE som "tre tabs oven på en kasse", men som én
 * sammenhængende papirform: den aktive tab + brede, bløde, let asymmetriske
 * skuldre + mappens øverste kant er ét SVG-path i samme farve som kroppen —
 * tabben "gror ud af" mappen. De inaktive tabs er et lysere baglag, der kun
 * kigger op bagved. Klikbare labels ligger som et transparent overlay.
 *
 * Koordinater i et fast viewBox (342 × 84); SVG'en skalerer proportionalt med
 * bredden, så kurverne aldrig forvrænges.
 * ────────────────────────────────────────────────────────────────────────── */
const VB_W = 342
const Y_TAB_TOP = 4 // top af aktiv tab
const Y_TAB_TOP_IN = 16 // top af inaktive tabs (mere tilbagetrukne)
const Y_SURFACE = 46 // mappens øverste flade (mellem/ved siden af tabs)
const Y_BOTTOM = 84 // bund af SVG = top af mappekroppen (flush)
const TAB_R = 18 // hjørne-radius, aktiv tab-top
const TAB_R_IN = 15 // hjørne-radius, inaktive tab-tops
const OUTER_R = 26 // øvre ydre hjørner på mappekroppen
const TAB_CENTERS = [86, 171, 256] // tab-midter (ydre tabs rykket ind)
const AW = 54 // halv bredde, aktiv tab
const IW = 48 // halv bredde, inaktive tabs
const SR_L = 34 // venstre skulder-løb (bredere → asymmetri)
const SR_R = 27 // højre skulder-løb (kortere)

/** Aktiv tab + skuldre + mappe-top som ét die-cut path. */
function frontPath(active: number): string {
  const cx = TAB_CENTERS[active]
  const lx = cx - AW
  const rx = cx + AW
  const sL = lx - SR_L
  const sR = rx + SR_R
  const hasLeft = sL > OUTER_R + 4
  const hasRight = sR < VB_W - OUTER_R - 4
  const knee = Y_TAB_TOP + TAB_R + (Y_SURFACE - Y_TAB_TOP) * 0.35

  const p: string[] = [
    `M 0 ${Y_BOTTOM}`,
    `L 0 ${Y_SURFACE + OUTER_R}`,
    `Q 0 ${Y_SURFACE} ${OUTER_R} ${Y_SURFACE}`,
  ]

  // venstre skulder op i tabben (bred rolig kurve) — eller kort løft ved kanten
  if (hasLeft) {
    p.push(`L ${sL} ${Y_SURFACE}`)
    p.push(`C ${sL + (lx - sL) * 0.5} ${Y_SURFACE} ${lx} ${knee} ${lx} ${Y_TAB_TOP + TAB_R}`)
  } else {
    p.push(`L ${Math.max(OUTER_R, lx)} ${Y_SURFACE}`)
    p.push(`C ${lx} ${Y_SURFACE} ${lx} ${knee} ${lx} ${Y_TAB_TOP + TAB_R}`)
  }

  // tab-top
  p.push(`Q ${lx} ${Y_TAB_TOP} ${lx + TAB_R} ${Y_TAB_TOP}`)
  p.push(`L ${rx - TAB_R} ${Y_TAB_TOP}`)
  p.push(`Q ${rx} ${Y_TAB_TOP} ${rx} ${Y_TAB_TOP + TAB_R}`)

  // højre skulder ned i mappe-fladen
  if (hasRight) {
    p.push(`C ${rx} ${knee} ${sR - (sR - rx) * 0.5} ${Y_SURFACE} ${sR} ${Y_SURFACE}`)
  } else {
    p.push(`C ${rx} ${knee} ${rx} ${Y_SURFACE} ${Math.min(VB_W - OUTER_R, rx)} ${Y_SURFACE}`)
  }

  p.push(`L ${VB_W - OUTER_R} ${Y_SURFACE}`)
  p.push(`Q ${VB_W} ${Y_SURFACE} ${VB_W} ${Y_SURFACE + OUTER_R}`)
  p.push(`L ${VB_W} ${Y_BOTTOM}`)
  p.push('Z')
  return p.join(' ')
}

/** Én inaktiv tab som blødt afrundet baglag, der tuckes ind under fronten. */
function backPath(index: number): string {
  const cx = TAB_CENTERS[index]
  const lx = cx - IW
  const rx = cx + IW
  const yt = Y_TAB_TOP_IN
  const yb = Y_SURFACE + 8
  return [
    `M ${lx} ${yb}`,
    `L ${lx} ${yt + TAB_R_IN}`,
    `Q ${lx} ${yt} ${lx + TAB_R_IN} ${yt}`,
    `L ${rx - TAB_R_IN} ${yt}`,
    `Q ${rx} ${yt} ${rx} ${yt + TAB_R_IN}`,
    `L ${rx} ${yb}`,
    'Z',
  ].join(' ')
}

export function InspirationFolder({
  monthName = 'juni',
  seedItems = DEFAULT_SEED_ITEMS,
  juneItems = DEFAULT_JUNE_ITEMS,
  guideItems = DEFAULT_GUIDE_ITEMS,
  hasSeedSuggestions = seedItems.length > 0,
}: InspirationFolderProps) {
  const defaultTab = hasSeedSuggestions ? 'seedbank' : 'june'
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)
  const activeIndex = TABS.findIndex(tab => tab.id === activeTab)

  const activeContent = useMemo(() => {
    if (activeTab === 'seedbank') {
      return {
        title: 'Fra din frøbank',
        subtitle: hasSeedSuggestions
          ? 'Sorter, der stadig kan nå at give noget i år.'
          : 'Din frøbank hviler lidt endnu.',
        cta: hasSeedSuggestions ? 'Se frøbanken' : 'Tilføj frø',
        href: hasSeedSuggestions ? '/froebank' : '/froebank/tilfoej',
        items: seedItems,
      }
    }

    if (activeTab === 'june') {
      return {
        title: `Få mere ud af ${monthName}`,
        subtitle: 'Små råd, der hjælper haven gennem varme, vækst og høst.',
        cta: 'Se flere sæsonråd',
        href: '/kalender',
        items: juneItems,
      }
    }

    return {
      title: 'Forstå det, der gror',
      subtitle: 'Guides til planterne, vejret og sæsonen.',
      cta: 'Åbn guides',
      href: '/guides',
      items: guideItems,
    }
  }, [activeTab, guideItems, hasSeedSuggestions, juneItems, monthName, seedItems])

  return (
    <section aria-labelledby="inspiration-folder-title" style={{ paddingTop: 6 }}>
      <header style={{ marginBottom: 30, paddingInline: 2 }}>
        <p
          style={{
            color: 'rgba(36,48,31,0.58)',
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 850,
            letterSpacing: '0.22em',
            lineHeight: 1.2,
            margin: '0 0 calc(18px - 2mm)',
            textTransform: 'uppercase',
          }}
        >
          Inspiration
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
          <h2
            id="inspiration-folder-title"
            style={{
              color: '#9F7A24',
              fontFamily: serif,
              fontSize: 'clamp(38px, 9.5vw, 45px)',
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 0.96,
              margin: 0,
              maxWidth: 320,
            }}
          >
            Når du vil mere<br />med {monthName}
          </h2>
          {/* Bi-glyph som lille sommer-accent til højre for den hø-gule overskrift. */}
          <Image
            src="/images/glyphs/bi.png"
            alt=""
            aria-hidden
            width={256}
            height={206}
            style={{ width: 54, height: 'auto', flexShrink: 0, transform: 'translateX(4mm) rotate(-37deg)' }}
          />
        </div>
      </header>

      <div style={{ position: 'relative' }}>
        {/* Die-cut top: én sammenhængende silhuet (tabs + skuldre + mappe-top) */}
        <div style={{ position: 'relative' }}>
          <svg
            viewBox={`0 0 ${VB_W} ${Y_BOTTOM}`}
            width="100%"
            style={{ display: 'block' }}
            aria-hidden
          >
            <defs>
              <linearGradient id="folderFront" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6C8175" />
                <stop offset="1" stopColor="#62766B" />
              </linearGradient>
            </defs>
            {/* inaktive tabs som lysere baglag */}
            {TABS.map((tab, i) =>
              i === activeIndex ? null : (
                <path key={tab.id} d={backPath(i)} fill="#D9D8C8" />
              ),
            )}
            {/* aktiv tab + skuldre + mappe-top som ét path */}
            <path d={frontPath(activeIndex)} fill="url(#folderFront)" />
          </svg>

          {/* klikbare labels — transparent overlay oven på silhuetten */}
          <div role="tablist" aria-label="Inspiration" style={{ position: 'absolute', inset: 0 }}>
            {TABS.map((tab, i) => {
              const active = i === activeIndex
              const Icon = tab.Icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    alignItems: 'center',
                    background: 'transparent',
                    border: 0,
                    color: active ? '#F6F1E6' : '#7C8578',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontFamily: sans,
                    fontSize: 13.5,
                    fontWeight: active ? 800 : 650,
                    gap: 6,
                    left: `${(TAB_CENTERS[i] / VB_W) * 100}%`,
                    position: 'absolute',
                    top: active ? 12 : 18,
                    transform: 'translateX(-50%)',
                    transition: 'color 160ms ease, top 160ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon width={13} height={13} strokeWidth={1.8} aria-hidden />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mappekrop — samme farve, fortsætter silhuetten */}
        <div
          style={{
            background: 'linear-gradient(180deg, #62766B 0%, #5A6E63 100%)',
            borderRadius: '0 0 32px 32px',
            boxShadow: '0 14px 30px rgba(60,80,72,0.20)',
            color: '#F8F4E9',
            marginTop: -1,
            overflow: 'hidden',
            padding: '12px 24px 28px',
          }}
        >
          <FolderPanel tab={activeTab} content={activeContent} />
        </div>
      </div>
    </section>
  )
}

function FolderPanel({
  tab,
  content,
}: {
  tab: TabId
  content: {
    title: string
    subtitle: string
    cta: string
    href: string
    items: FolderItem[]
  }
}) {
  return (
    <div>
      <div style={{ padding: '2px 4px 22px' }}>
        <h3
          style={{
            color: '#F6F1E6',
            fontFamily: serif,
            fontSize: tab === 'june' ? 30 : 36,
            fontWeight: tab === 'june' ? 700 : 600,
            letterSpacing: '0',
            lineHeight: 1,
            margin: 0,
          }}
        >
          {content.title}
        </h3>
        {content.subtitle && (
          <p
            style={{
              color: 'rgba(246,241,230,0.84)',
              fontFamily: sans,
              fontSize: 15.5,
              fontWeight: 500,
              lineHeight: 1.4,
              margin: '10px 0 0',
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {tab === 'guides' && <FeaturedGuideCard />}

      <div style={{ display: 'grid', gap: 11 }}>
        {content.items.map(item => (
          <FolderItemCard
            key={item.title}
            item={item}
            href={content.href}
          />
        ))}
      </div>

      <Link
        href={content.href}
        style={{
          alignItems: 'center',
          color: 'rgba(246,241,230,0.9)',
          display: 'inline-flex',
          fontFamily: sans,
          fontSize: 15,
          fontWeight: 750,
          gap: 9,
          marginTop: 11,
          padding: '4px 2px',
          textDecoration: 'none',
        }}
      >
        {content.cta}
        <ArrowRight width={17} height={17} strokeWidth={1.8} aria-hidden />
      </Link>
    </div>
  )
}

function FolderItemCard({
  item,
  href,
}: {
  item: FolderItem
  href: string
}) {
  const Icon = item.Icon

  return (
    <Link
      href={href}
      style={{
        alignItems: 'center',
        background: '#F6F1E6',
        borderRadius: 20,
        color: '#23382B',
        display: 'grid',
        gridTemplateColumns: '48px minmax(0, 1fr) 18px',
        gap: 12,
        minHeight: 96,
        padding: '17px 18px',
        textDecoration: 'none',
      }}
    >
      <span
        aria-hidden
        style={{
          alignItems: 'center',
          background: '#E7E1D2',
          borderRadius: 999,
          color: '#3A5147',
          display: 'inline-flex',
          height: 48,
          justifyContent: 'center',
          width: 48,
        }}
      >
        <Icon width={20} height={20} strokeWidth={1.75} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            color: '#23382B',
            display: 'block',
            fontFamily: sans,
            fontSize: 18,
            fontWeight: 850,
            lineHeight: 1.15,
            marginBottom: 4,
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            color: '#5E675D',
            display: 'block',
            fontFamily: sans,
            fontSize: 14.5,
            fontWeight: 500,
            lineHeight: 1.35,
          }}
        >
          {item.text}
        </span>
      </span>
      <ChevronRight
        width={16}
        height={16}
        strokeWidth={1.8}
        style={{ color: 'rgba(94,103,93,0.55)' }}
        aria-hidden
      />
    </Link>
  )
}

function FeaturedGuideCard() {
  return (
    <Link
      href="/guides"
      style={{
        background: 'linear-gradient(135deg, #EEE9CA, #F7F1E5)',
        borderRadius: 22,
        color: '#183421',
        display: 'block',
        marginBottom: 10,
        minHeight: 126,
        overflow: 'hidden',
        padding: 18,
        position: 'relative',
        textDecoration: 'none',
      }}
    >
      {/* Diskret botanisk dekoration mod nederste højre hjørne. Ingen
          lokal line-art-PNG findes, så et lille, lav-kontrast BookOpen
          fungerer som rolig tekstur — ikke et placeholder-stort ikon. */}
      <BookOpen
        width={38}
        height={38}
        strokeWidth={1}
        style={{
          color: 'rgba(38,55,31,0.11)',
          position: 'absolute',
          right: 16,
          bottom: 14,
        }}
        aria-hidden
      />
      <p
        style={{
          color: '#183421',
          fontFamily: serif,
          fontSize: 31,
          fontWeight: 600,
          lineHeight: 1,
          margin: 0,
          maxWidth: 260,
          position: 'relative',
        }}
      >
        Dyrkningsguides
      </p>
      <p
        style={{
          color: 'rgba(36,48,31,0.70)',
          fontFamily: sans,
          fontSize: 14.5,
          fontWeight: 500,
          lineHeight: 1.4,
          margin: '10px 0 0',
          maxWidth: 250,
          position: 'relative',
        }}
      >
        Forklaringer, råd og sæsonforståelse for planterne i juni.
      </p>
      <span
        aria-hidden
        style={{
          alignItems: 'center',
          background: 'rgba(208,205,170,0.56)',
          borderRadius: 999,
          display: 'inline-flex',
          height: 42,
          justifyContent: 'center',
          marginTop: 10,
          position: 'relative',
          width: 42,
        }}
      >
        <ArrowRight width={18} height={18} strokeWidth={1.7} />
      </span>
    </Link>
  )
}
