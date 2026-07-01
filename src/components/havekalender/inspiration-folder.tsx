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

export function InspirationFolder({
  monthName = 'juni',
  seedItems = DEFAULT_SEED_ITEMS,
  juneItems = DEFAULT_JUNE_ITEMS,
  guideItems = DEFAULT_GUIDE_ITEMS,
  hasSeedSuggestions = seedItems.length > 0,
}: InspirationFolderProps) {
  const defaultTab = hasSeedSuggestions ? 'seedbank' : 'june'
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

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
            margin: '0 0 18px',
            textTransform: 'uppercase',
          }}
        >
          Inspiration
        </p>
        <h2
          id="inspiration-folder-title"
          style={{
            color: '#183421',
            fontFamily: serif,
            fontSize: 'clamp(40px, 10vw, 47px)',
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 0.96,
            margin: '0 0 18px',
            maxWidth: 320,
          }}
        >
          Når du vil mere med {monthName}
        </h2>
        <p
          style={{
            color: 'rgba(38,53,31,0.68)',
            fontFamily: sans,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.42,
            margin: 0,
            maxWidth: 560,
          }}
        >
          Frøbank, sæsonråd og guides samlet ét sted.
        </p>
      </header>

      <div style={{ position: 'relative' }}>
        <div
          role="tablist"
          aria-label="Inspiration"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            alignItems: 'end',
            gap: 4,
            marginBottom: -1,
            paddingInline: 6,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {TABS.map(tab => (
            <FolderTab
              key={tab.id}
              active={activeTab === tab.id}
              icon={tab.Icon}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <div
          style={{
            background:
              'linear-gradient(145deg, rgba(38,55,31,0.98), rgba(28,45,27,0.99))',
            borderRadius: 26,
            boxShadow: '0 10px 26px rgba(36,48,31,0.12)',
            color: '#F8F4E9',
            marginTop: 0,
            overflow: 'hidden',
            padding: '38px 24px 28px',
          }}
        >
          <FolderPanel tab={activeTab} content={activeContent} />
        </div>
      </div>
    </section>
  )
}

function FolderTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        alignItems: 'center',
        background: active ? '#26371F' : 'rgba(216,214,191,0.72)',
        border: 0,
        borderRadius: '18px 18px 0 0',
        color: active ? '#FBF6E9' : '#3A4A2E',
        cursor: 'pointer',
        display: 'inline-flex',
        fontFamily: sans,
        fontSize: 14,
        fontWeight: active ? 800 : 650,
        gap: 7,
        justifyContent: 'center',
        minHeight: 48,
        minWidth: 0,
        opacity: active ? 1 : 0.64,
        padding: '0 6px',
        position: 'relative',
        top: active ? 0 : 6,
        transition: 'background 160ms ease, color 160ms ease, top 160ms ease',
      }}
    >
      <Icon width={14} height={14} strokeWidth={1.75} aria-hidden />
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
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
            color: '#FBF6E9',
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
              color: 'rgba(248,244,233,0.76)',
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
          color: 'rgba(248,244,233,0.84)',
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
        background: '#F7F1E5',
        borderRadius: 20,
        color: '#183421',
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
          background: 'rgba(208,205,170,0.44)',
          borderRadius: 999,
          color: '#294029',
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
            color: '#16351F',
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
            color: 'rgba(36,48,31,0.68)',
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
        style={{ color: 'rgba(36,48,31,0.34)' }}
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
