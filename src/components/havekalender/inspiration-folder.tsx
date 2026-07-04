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
// Lagdelt mappe-stak (Annas reference-foto): TRE faner med SAMME form — flad
// top + referencens 45°-diagonale højreskulder. Fast dybde venstre→højre =
// forrest→bagest = mørkest→lysest. Hver fane er en fuld mappe (fane + krop der
// strækker sig til højre kant + ned), tegnet bagest→forrest, så den forreste
// (mørke) mappes krop bliver selve panelet og dækker de bagvedliggende kroppe;
// kun fanerne kigger frem. Skulderen (28.64 bred × 20.31 høj) er 1:1 fra
// referencen; KUN den flade fane-bredde (FW) er tilpasset til mobil-bredden.
const VB_W = 342
const Y_TAB_TOP = 7 // fane-top (ens for alle tre → teksterne flugter)
// Fladen er sænket ~7.3 enheder (≈ 2mm) → fanerne er 2mm højere = mere tekstplads.
// Referencens 45°-diagonal er forlænget tilsvarende; rundinger + vinkel bevaret.
const Y_SURFACE = 34.61 // flade = Y_TAB_TOP + skulderhøjde 27.61 (reference 20.31 + 2mm)
const Y_BOTTOM = 47 // bund af SVG = top af mappekroppen (flush)
const OUTER_R = 13 // ydre hjørner (venstre kant-fane + mappens højre kant)
const SR = 35.92 // skulder-løb (bredde) = runding 7.16 + diagonal 21.6 + runding 7.16
const FW = 89 // flad fane-bredde — 3mm bredere (var 78) → fanerne overlapper let
const CORNER = 8 // top-venstre radius på ikke-forreste faner (skjult bag fronten)

// index 0 = forrest (venstre, mørkest) … 2 = bagest (højre, lysest).
// Rækkefølge matcher TABS: 0=Frøbank, 1=Sæsonråd, 2=Guides. xL er sat så Guides'
// skulder stadig lander ved VB_W-OUTER_R (329) = blokkens højre kant, samtidig
// med at de bredere faner overlapper hinanden let (~23 enheder mod ~6 før).
const LAYERS = [
  { xL: 0, labelCx: 46, fill: '#5A6B4E', label: '#F2EEE2' }, // Frøbank — forrest/mørkest
  { xL: 102, labelCx: 158, fill: '#7A8A6C', label: '#28331F' }, // Sæsonråd — midt
  { xL: 204, labelCx: 260, fill: '#9EAB8C', label: '#28331F' }, // Guides — bagest/lysest
]

/**
 * Én mappe i stakken som ét path: venstre kant op → flad fane-top →
 * referencens 45°-diagonale HØJRE-skulder → mappe-flade ud til højre kant →
 * ned → bund. Alle tre faner bruger SAMME funktion (samme form); kun `xL`
 * (fanens venstre position) skifter. Den forreste (xL = 0) deler mappens
 * venstre kant med et større ydre hjørne; de bagvedliggende har et lille
 * top-venstre hjørne, der alligevel skjules bag den forreste fanes skulder.
 */
function folderLayer(xL: number): string {
  const flushLeft = xL === 0
  const rL = flushLeft ? OUTER_R : CORNER
  const xR = xL + FW
  return [
    `M ${xL} ${Y_BOTTOM}`,
    `L ${xL} ${Y_TAB_TOP + rL}`,
    `Q ${xL} ${Y_TAB_TOP} ${xL + rL} ${Y_TAB_TOP}`,
    `L ${xR} ${Y_TAB_TOP}`,
    // højre skulder = referencens skulder, diagonalen forlænget 2mm (bevaret 45°):
    // lille runding af tab-toppen → ren 45° diagonal → blød runding på fladen.
    'c 2.68 0 5.26 1.07 7.16 2.97',
    'l 21.6 21.67',
    'c 1.89 1.9 4.47 2.97 7.16 2.97',
    `L ${VB_W - OUTER_R} ${Y_SURFACE}`,
    `Q ${VB_W} ${Y_SURFACE} ${VB_W} ${Y_SURFACE + OUTER_R}`,
    `L ${VB_W} ${Y_BOTTOM}`,
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
              {/* Blød skygge så hver mappe løfter sig over den bagvedliggende */}
              <filter id="folderLift" x="-10%" y="-40%" width="120%" height="180%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#2A3020" floodOpacity="0.16" />
              </filter>
            </defs>
            {/* Tegn bagest→forrest: bagest (lysest) først, forrest (mørkest) sidst
                oven på — så den forreste mappes krop bliver panelet og dækker de
                bagvedliggende kroppe; kun fanerne kigger frem. */}
            {[2, 1, 0].map(i => (
              <path key={i} d={folderLayer(LAYERS[i].xL)} fill={LAYERS[i].fill} filter="url(#folderLift)" />
            ))}
          </svg>

          {/* klikbare labels — transparent overlay oven på silhuetten */}
          <div role="tablist" aria-label="Inspiration" style={{ position: 'absolute', inset: 0 }}>
            {TABS.map((tab, i) => {
              const active = i === activeIndex
              const layer = LAYERS[i]
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
                    color: layer.label,
                    cursor: 'pointer',
                    fontFamily: sans,
                    // Alle tre ENS: samme størrelse, samme vægt, samme top → de
                    // flugter og ser lige store/lige bold ud. Farve følger lagets
                    // dybde; aktiv markeres kun ved fuld opacitet (inaktiv dæmpet).
                    fontSize: 14,
                    fontWeight: 600,
                    left: `${(layer.labelCx / VB_W) * 100}%`,
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    opacity: active ? 1 : 0.72,
                    position: 'absolute',
                    textAlign: 'center',
                    top: 15,
                    transform: 'translateX(-50%)',
                    transition: 'opacity 160ms ease',
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
            background: 'linear-gradient(180deg, #5A6B4E 0%, #53634A 100%)',
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
