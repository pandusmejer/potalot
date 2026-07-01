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
  },
  {
    title: 'Såning i varme perioder',
    text: 'Sådan får frøene en god start uden at tørre ud.',
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
const Y_TAB_TOP = 9 // top af aktiv tab (fladere → mindre app-bølge)
const Y_TAB_TOP_IN = 18 // top af inaktive tabs (mere tilbagetrukne)
const Y_SURFACE = 42 // mappens øverste flade (mellem tabs)
const Y_BOTTOM = 82 // bund af SVG = top af mappekroppen (flush)
const TAB_R = 20 // hjørne-radius, aktiv tab-top (indre sider)
const TAB_R_IN = 16 // hjørne-radius, inaktive tab-tops (indre sider)
const OUTER_R = 26 // ydre hjørner — deles af kant-tab og mappekant (flush)
const TAB_CENTERS = [54, 171, 288] // ydre tabs flush med mappens kant (0 / 342)
const AW = 66 // halv bredde, aktiv tab (bredere folderfane)
const IW = 62 // halv bredde, inaktive tabs — overlapper aktiv en smule (lag)
const SR_L = 44 // venstre skulder-løb (bredt + fladt)
const SR_R = 38 // højre skulder-løb (lidt kortere → asymmetri)
const KNEE = 0.52 // skulder-kurvens fladhed (højere = fladere, mindre U)
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
                <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#2A3020" floodOpacity="0.24" />
              </filter>
              {/* Tynd papirskygge under hvert inaktivt ark → man ser at de ligger bagved */}
              <filter id="paperLayer" x="-15%" y="-25%" width="130%" height="150%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#26351F" floodOpacity="0.14" />
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
            {/* diskret top-highlight langs det aktive arks kant (papir-lysning) */}
            <path d={frontPath(activeIndex)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
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
                    color: active ? '#F6F1E6' : 'rgba(38,53,31,0.52)',
                    cursor: 'pointer',
                    fontFamily: sans,
                    fontSize: 18,
                    fontWeight: active ? 650 : 600,
                    left: `${(TAB_CENTERS[i] / VB_W) * 100}%`,
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    position: 'absolute',
                    textAlign: 'center',
                    top: active ? 16 : 21,
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
            borderRadius: '0 0 32px 32px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.13), 0 10px 24px rgba(35,45,34,0.13)',
            color: '#F8F4E9',
            marginTop: -18, // rykker mappens overskrifter op mod tabs (m. luft til serif-top)
            padding: '12px 24px 28px',
          }}
        >
          <FolderPanel tab={activeTab} content={activeContent} monthName={monthName} />
        </div>
      </div>
    </section>
  )
}

function FolderPanel({
  tab,
  content,
  monthName,
}: {
  tab: TabId
  content: {
    title: string
    subtitle: string
    cta: string
    href: string
    items: FolderItem[]
  }
  monthName: string
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

      {tab === 'guides' && <FeaturedGuideCard monthName={monthName} />}

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
            fontFamily: sans,
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.14,
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
  //   Guides   → botanisk illustration (mangler assets → neutral bog-badge)
  // Guides bruger derfor altid fallback-markøren; de øvrige viser thumbnail.
  if (image && !errored && sourceTab !== 'guides') {
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

function FeaturedGuideCard({ monthName }: { monthName: string }) {
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
        Forklaringer, råd og sæsonforståelse for planterne i {monthName}.
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
