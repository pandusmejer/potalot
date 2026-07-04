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
  Sprout,
  Wheat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'
// Guide-sprog (KUN Guides-fanen): opslagsværk/feltguide-karakter.
const guideDisplay = 'var(--font-plex-condensed), sans-serif'
const guideMono = 'var(--font-plex-mono), monospace'

type TabId = 'seedbank' | 'june' | 'guides'

interface FolderItem {
  title: string
  text: string
  /** Rundt thumbnail hvis tippet handler om en konkret plante/sort.
   *  Mangler den (generelt råd), vises en neutral kilde-markør i stedet. */
  image?: string
  imageAlt?: string
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
    title: 'Så salat igen',
    text: 'Little Gem kan give sprøde blade senere.',
    image: '/images/frokort/salat-little-gem.png',
    imageAlt: 'Little Gem-salat',
  },
  {
    title: 'Giv basilikum varme',
    text: 'Vent på lune nætter og varm jord.',
    image: '/images/frokort/basilikum-genovese.png',
    imageAlt: 'Basilikum',
  },
  {
    title: 'Hold øje med bønnerne',
    text: 'Spirer hurtigt i lun jord — hader kulde.',
    image: '/images/frokort/stangboenne-cobra.png',
    imageAlt: 'Stangbønne',
  },
]

const DEFAULT_JUNE_ITEMS: FolderItem[] = [
  {
    title: 'Vand dybt og roligt',
    text: 'Planter får mere ud af én grundig vanding end mange hurtige sjatter.',
    image: '/images/kalender/saeson/vand.jpg',
    imageAlt: '',
  },
  {
    title: 'Tyv tomaterne',
    text: 'Brug få minutter hver anden dag, så planterne ikke bliver et grønt trafikuheld i juli.',
    image: '/images/kalender/saeson/sol.jpg',
    imageAlt: '',
  },
  {
    title: 'Så til sensommeren',
    text: 'Grønkål, salat og kålroer kan nå at give en ny runde senere.',
    image: '/images/kalender/saeson/vaekst.jpg',
    imageAlt: '',
  },
]

const DEFAULT_GUIDE_ITEMS: FolderItem[] = [
  {
    title: 'Tomater i juni',
    text: 'Opbinding, sideskud og vand - det vigtigste lige nu.',
    image: '/images/kalender/guides/tomat-ranke.jpg',
    imageAlt: 'Tomater på ranken',
  },
  {
    title: 'Såning i varme perioder',
    text: 'Sådan får frøene en god start uden at tørre ud.',
    image: '/images/kalender/guides/saaning.jpg',
    imageAlt: 'Spirer i jord',
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
const Y_TAB_TOP = 8 // top af aktiv tab
const Y_TAB_TOP_IN = 12 // top af inaktive tabs (4px lavere = lag bagved)
const Y_SURFACE = 50 // mappens øverste flade (mellem tabs)
const Y_BOTTOM = 66 // bund af SVG = top af mappekroppen (flush)
// Aktiv fanehøjde = Y_SURFACE - Y_TAB_TOP = 42px → 16px tekst med rigelig luft
// over/under, så intet klippes. Inaktiv = 38px.
const TAB_R = 15 // hjørne-radius, aktiv tab-top (indre sider)
const TAB_R_IN = 13 // hjørne-radius, inaktive tab-tops (indre sider)
const OUTER_R = 14 // ydre hjørner — deles af kant-tab og mappekant
const TAB_CENTERS = [54, 171, 288] // ydre tabs flush med mappens kant (0 / 342)
const AW = 53 // halv bredde, aktiv tab — smallere → tydelige hak/mellemrum
const IW = 57 // halv bredde, inaktive tabs — lidt bredere → lagdelt overlap bagved
const SR_L = 30 // skulder-løb — blød, rundet step (som frøbank-redesignets notch)
const SR_R = 30 // symmetrisk
// Lavere KNEE = blødere, rundet step-skulder (frøbank-mappens seedFolderClip-
// karakter: flad fane-top → blød S-nedgang → mappekrop).
const KNEE = 0.35
const LAST = TAB_CENTERS.length - 1

/**
 * Aktiv tab + skuldre + mappe-top som ét die-cut path.
 * Yder-tabs (index 0 / sidste) deler mappens ydre hjørne, så de går helt
 * ud til kanten; kun de indre sider har bløde skuldre.
 */
function frontPath(active: number): string {
  const cx = TAB_CENTERS[active]
  const lx = cx - AW
  const rx = cx + AW
  const flushLeft = active === 0
  const flushRight = active === LAST
  const knee = Y_TAB_TOP + TAB_R + (Y_SURFACE - Y_TAB_TOP) * KNEE
  const p: string[] = [`M 0 ${Y_BOTTOM}`]

  // venstre side af den aktive tab
  if (flushLeft) {
    // tab deler mappens venstre kant → ydre hjørne op i tab-toppen
    p.push(`L 0 ${Y_TAB_TOP + OUTER_R}`)
    p.push(`Q 0 ${Y_TAB_TOP} ${OUTER_R} ${Y_TAB_TOP}`)
  } else {
    p.push(`L 0 ${Y_SURFACE + OUTER_R}`)
    p.push(`Q 0 ${Y_SURFACE} ${OUTER_R} ${Y_SURFACE}`)
    const sL = lx - SR_L
    p.push(`L ${sL} ${Y_SURFACE}`)
    p.push(`C ${sL + (lx - sL) * 0.5} ${Y_SURFACE} ${lx} ${knee} ${lx} ${Y_TAB_TOP + TAB_R}`)
    p.push(`Q ${lx} ${Y_TAB_TOP} ${lx + TAB_R} ${Y_TAB_TOP}`)
  }

  // tab-top
  p.push(`L ${flushRight ? VB_W - OUTER_R : rx - TAB_R} ${Y_TAB_TOP}`)

  // højre side af den aktive tab
  if (flushRight) {
    p.push(`Q ${VB_W} ${Y_TAB_TOP} ${VB_W} ${Y_TAB_TOP + OUTER_R}`)
    p.push(`L ${VB_W} ${Y_BOTTOM}`)
  } else {
    p.push(`Q ${rx} ${Y_TAB_TOP} ${rx} ${Y_TAB_TOP + TAB_R}`)
    const sR = rx + SR_R
    p.push(`C ${rx} ${knee} ${sR - (sR - rx) * 0.5} ${Y_SURFACE} ${sR} ${Y_SURFACE}`)
    p.push(`L ${VB_W - OUTER_R} ${Y_SURFACE}`)
    p.push(`Q ${VB_W} ${Y_SURFACE} ${VB_W} ${Y_SURFACE + OUTER_R}`)
    p.push(`L ${VB_W} ${Y_BOTTOM}`)
  }

  p.push('Z')
  return p.join(' ')
}

/**
 * Én inaktiv tab som blødt afrundet baglag. Yder-tabs går flush ud til
 * mappens kant og deler det ydre hjørne; de strækker sig ned bag fronten,
 * så der aldrig opstår en hak mellem tab og mappekrop.
 */
function backPath(index: number): string {
  const cx = TAB_CENTERS[index]
  const flushLeft = index === 0
  const flushRight = index === LAST
  const lx = flushLeft ? 0 : cx - IW
  const rx = flushRight ? VB_W : cx + IW
  const rL = flushLeft ? OUTER_R : TAB_R_IN
  const rR = flushRight ? OUTER_R : TAB_R_IN
  const yt = Y_TAB_TOP_IN
  const yb = Y_BOTTOM
  return [
    `M ${lx} ${yb}`,
    `L ${lx} ${yt + rL}`,
    `Q ${lx} ${yt} ${lx + rL} ${yt}`,
    `L ${rx - rR} ${yt}`,
    `Q ${rx} ${yt} ${rx} ${yt + rR}`,
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
          ? 'Sorter, du stadig kan nå.'
          : 'Din frøbank hviler lidt endnu.',
        cta: hasSeedSuggestions ? 'Se frøbanken' : 'Tilføj frø',
        href: hasSeedSuggestions ? '/froebank' : '/froebank/tilfoej',
        items: seedItems,
      }
    }

    if (activeTab === 'june') {
      return {
        title: `Få mere ud af ${monthName}`,
        subtitle: 'Råd til varme, vækst og høst.',
        cta: 'Se flere sæsonråd',
        href: '/kalender',
        items: juneItems,
      }
    }

    return {
      title: 'Forstå det, der gror',
      subtitle: 'Guides til sæsonen lige nu.',
      cta: 'Åbn guides',
      href: '/guides',
      // Indhold følger den aktuelle måned (ikke hardcodet juni).
      items: guideItems.map(it => ({ ...it, title: it.title.replace('juni', monthName) })),
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
              {/* Blød skygge så det aktive ark løfter sig over baglagene (papir-på-papir) */}
              <filter id="folderLift" x="-10%" y="-30%" width="120%" height="170%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#2A3020" floodOpacity="0.18" />
              </filter>
              {/* Tynd papirskygge under hvert inaktivt ark → man ser at de ligger bagved */}
              <filter id="paperLayer" x="-15%" y="-25%" width="130%" height="150%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#26351F" floodOpacity="0.10" />
              </filter>
            </defs>
            {/* inaktive tabs som lysere papir-baglag, let forskudt bagved */}
            {TABS.map((tab, i) =>
              i === activeIndex ? null : (
                <path
                  key={tab.id}
                  d={backPath(i)}
                  fill="#E1E0D3"
                  stroke="rgba(38,53,31,0.08)"
                  strokeWidth={1}
                  filter="url(#paperLayer)"
                />
              ),
            )}
            {/* aktiv tab + skuldre + mappe-top som ét ark, løftet over baglagene */}
            <path d={frontPath(activeIndex)} fill="url(#folderFront)" filter="url(#folderLift)" />
          </svg>

          {/* klikbare labels — transparent overlay oven på silhuetten */}
          <div role="tablist" aria-label="Inspiration" style={{ position: 'absolute', inset: 0 }}>
            {TABS.map((tab, i) => {
              const active = i === activeIndex
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: active ? '#F6F1E6' : 'rgba(38,53,31,0.50)',
                    cursor: 'pointer',
                    fontFamily: sans,
                    fontSize: 16,
                    fontWeight: active ? 600 : 500,
                    left: `${(TAB_CENTERS[i] / VB_W) * 100}%`,
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    position: 'absolute',
                    textAlign: 'center',
                    top: active ? 22 : 25,
                    transform: 'translateX(-50%)',
                    transition: 'color 160ms ease, top 160ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mappekrop — samme farve, fortsætter silhuetten */}
        <div
          style={{
            background: 'linear-gradient(180deg, #62766B 0%, #5A6E63 100%)',
            borderRadius: '0 0 24px 24px',
            boxShadow: '0 10px 24px rgba(35,45,34,0.13)',
            color: '#F8F4E9',
            marginTop: -2, // kroppen dækker kun 2px af fanernes bund (æder ikke tekst)
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
      <div style={{ overflow: 'visible', padding: '8px 4px 22px' }}>
        <h3
          style={{
            color: '#F6F1E6',
            fontFamily: serif,
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: '0',
            lineHeight: 1.12,
            margin: 0,
            overflow: 'visible',
          }}
        >
          {content.title}
        </h3>
        {content.subtitle && (
          <p
            style={{
              color: 'rgba(246,241,230,0.84)',
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.35,
              margin: '7px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {tab === 'guides' && <FeaturedGuideCard />}

      <div style={{ display: 'grid', gap: 12 }}>
        {content.items.map(item => (
          <FolderItemCard
            key={item.title}
            item={item}
            href={content.href}
            sourceTab={tab}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 11 }}>
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
            padding: '4px 2px',
            textDecoration: 'none',
          }}
        >
          {content.cta}
          <ArrowRight width={17} height={17} strokeWidth={1.8} aria-hidden />
        </Link>
      </div>
    </div>
  )
}

function FolderItemCard({
  item,
  href,
  sourceTab,
}: {
  item: FolderItem
  href: string
  sourceTab: TabId
}) {
  return (
    <Link
      href={href}
      style={{
        alignItems: 'center',
        background: '#F6F1E6',
        borderRadius: 20,
        color: '#23382B',
        display: 'grid',
        gridTemplateColumns: '44px minmax(0, 1fr) 16px',
        gap: 14,
        minHeight: 104,
        padding: 18,
        textDecoration: 'none',
      }}
    >
      <LeadingVisual image={item.image} alt={item.imageAlt} sourceTab={sourceTab} />
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            color: '#23382B',
            display: 'block',
            // Guides får condensed guide-font; øvrige faner beholder UI-sans.
            fontFamily: sourceTab === 'guides' ? guideDisplay : sans,
            fontSize: sourceTab === 'guides' ? 18 : 17,
            fontWeight: sourceTab === 'guides' ? 600 : 700,
            letterSpacing: sourceTab === 'guides' ? '0' : undefined,
            lineHeight: sourceTab === 'guides' ? 1.12 : 1.14,
            marginBottom: 5,
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            color: '#5E675D',
            display: '-webkit-box',
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 500,
            lineHeight: 1.34,
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {item.text}
        </span>
      </span>
      <ChevronRight
        width={15}
        height={15}
        strokeWidth={1.8}
        style={{ color: 'rgba(94,103,93,0.4)' }}
        aria-hidden
      />
    </Link>
  )
}

/**
 * Leading visual — hybrid: rundt thumbnail hvis tippet handler om en konkret
 * plante/sort (item.image), ellers en neutral kilde-markør, der læses som
 * kategori (frøbank/sæson/guide), ikke som en handling. Samme 44px footprint
 * i begge tilfælde, så rækkerne holder rytme. Broken image → fald til markør.
 */
function LeadingVisual({
  image,
  alt,
  sourceTab,
}: {
  image?: string
  alt?: string
  sourceTab: TabId
}) {
  const [errored, setErrored] = useState(false)

  // Tre faste visuelle systemer, ét pr. fane:
  //   Frøbank  → konkrete plante-thumbnails (frøkort)
  //   Sæsonråd → atmosfæriske natur-crops (materiale/stemning, ikke sort)
  //   Guides   → emne-specifikke thumbnails (tomat, såning/jord)
  // Alle faner viser thumbnail hvis item.image findes; ellers neutral markør.
  if (image && !errored) {
    return (
      <span
        style={{
          borderRadius: 999,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.55), 0 1px 2px rgba(35,56,43,0.12)',
          flexShrink: 0,
          height: 44,
          overflow: 'hidden',
          position: 'relative',
          width: 44,
        }}
      >
        <Image
          src={image}
          alt={alt ?? ''}
          fill
          sizes="44px"
          // Små, altid-synlige thumbnails: eager load, så de ikke afhænger af
          // IntersectionObserver (som ikke trigger for billeder der monteres
          // allerede-i-viewport ved fane-skift).
          loading="eager"
          // Motivet zoomes let ind + centreres, så det læser som et udsnit
          // frem for "et lille billede sat ind i en cirkel".
          style={{ objectFit: 'cover', objectPosition: 'center', transform: 'scale(1.14)' }}
          onError={() => setErrored(true)}
        />
      </span>
    )
  }

  const MarkerIcon = sourceTab === 'guides' ? BookOpen : sourceTab === 'june' ? Wheat : Sprout
  return (
    <span
      aria-hidden
      style={{
        alignItems: 'center',
        background: '#E7E1D2',
        borderRadius: 999,
        color: '#7C8578',
        display: 'inline-flex',
        flexShrink: 0,
        height: 44,
        justifyContent: 'center',
        width: 44,
      }}
    >
      <MarkerIcon width={17} height={17} strokeWidth={1.6} />
    </span>
  )
}

function FeaturedGuideCard() {
  return (
    <Link
      href="/guides"
      style={{
        background: 'linear-gradient(135deg, #EEE9CA, #F7F1E5)',
        borderRadius: 28,
        color: '#173826',
        display: 'block',
        marginBottom: 12,
        minHeight: 210,
        overflow: 'hidden',
        padding: '28px 28px 26px',
        position: 'relative',
        textDecoration: 'none',
      }}
    >
      <MoleculeWatermark />
      <p
        style={{
          color: 'rgba(35,56,43,0.50)',
          fontFamily: guideMono,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.18em',
          margin: '0 0 16px',
          position: 'relative',
          textTransform: 'uppercase',
        }}
      >
        Feltguide
      </p>
      <p
        style={{
          color: '#173826',
          fontFamily: guideDisplay,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: '-0.005em',
          lineHeight: 1,
          margin: '0 0 14px',
          maxWidth: '13ch',
          position: 'relative',
        }}
      >
        Dyrkningsguides
      </p>
      <p
        style={{
          color: 'rgba(35,56,43,0.70)',
          fontFamily: sans,
          fontSize: 17,
          fontWeight: 500,
          lineHeight: 1.35,
          margin: 0,
          maxWidth: '22ch',
          position: 'relative',
        }}
      >
        Forstå planterne, vejret og sæsonen.
      </p>
      <span
        aria-hidden
        style={{
          alignItems: 'center',
          background: 'rgba(35,56,43,0.08)',
          borderRadius: 999,
          color: '#173826',
          display: 'inline-flex',
          height: 54,
          justifyContent: 'center',
          marginTop: 24,
          position: 'relative',
          width: 54,
        }}
      >
        <ArrowRight width={24} height={24} strokeWidth={1.8} />
      </span>
    </Link>
  )
}

/**
 * Molekyle-/netværks-vandmærke i intro-kortets højre side (30% fra toppen,
 * delvist bag teksten) — signalerer viden/systematik i feltguide-sproget.
 * Tegnet inline i sage, så det kan cropes af kortets runding og holdes diskret.
 */
function MoleculeWatermark() {
  return (
    <svg
      viewBox="0 0 1420 2000"
      width={196}
      aria-hidden
      style={{
        opacity: 0.16,
        pointerEvents: 'none',
        position: 'absolute',
        right: -34,
        top: '30%',
      }}
    >
      <g fill="#7f8c68" stroke="#7f8c68" strokeWidth={13}>
        {/* bindinger */}
        <line x1="1045" y1="255" x2="895" y2="620" />
        <line x1="895" y1="620" x2="448" y2="705" />
        <line x1="895" y1="620" x2="1200" y2="962" />
        <line x1="448" y1="705" x2="162" y2="525" />
        <line x1="448" y1="705" x2="345" y2="1140" />
        <line x1="345" y1="1140" x2="632" y2="1470" />
        <line x1="632" y1="1470" x2="448" y2="1745" />
        <line x1="632" y1="1470" x2="1092" y2="1400" />
        <line x1="1092" y1="1400" x2="1200" y2="962" />
        {/* atomer */}
        <circle cx="1045" cy="255" r="132" />
        <circle cx="895" cy="620" r="78" />
        <circle cx="448" cy="705" r="152" />
        <circle cx="162" cy="525" r="88" />
        <circle cx="345" cy="1140" r="58" />
        <circle cx="632" cy="1470" r="74" />
        <circle cx="448" cy="1745" r="140" />
        <circle cx="1200" cy="962" r="138" />
        <circle cx="1092" cy="1400" r="128" />
      </g>
    </svg>
  )
}
