'use client'

/**
 * "Inspiration" — kalender-sektion bygget som TRE asymmetriske lag,
 * ikke en dashboard-grid. Hvert lag har sin egen visuelle behandling
 * så sektionen føles editorial og atmosfærisk snarere end funktionel:
 *
 *   1. FRA DIN FRØBANK    — personlig pil-liste fra brugerens
 *                            inventory (eller poetisk tom-tilstand)
 *   2. INSPIRATION         — kurateret/sæsonbestemt korte cards
 *   3. FORDYB DIG          — invitation til Dyrkningsguides
 *
 * Mellem lagene står små sanselige quotes der ikke kobler til data —
 * bare stille observationer om hvad måneden føles som.
 *
 * Launch-fokus: hjælpe brugeren i haven, ikke fællesskab. Community-
 * lagene ("Andre dyrker", "Idétavle") er bevidst fjernet — de hører
 * til en senere social fase.
 *
 * Princippet: "mindre funktion, mere stemning."
 */

import Link from 'next/link'
import { MONTHS_DA } from '@/lib/constants'
import type { InventoryItem, Plant } from '@/lib/types'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  month: number
  inventory: InventoryItem[]
  plants: Plant[]
}

export function Inspiration({ month, inventory, plants }: Props) {
  const maaned = MONTHS_DA[month - 1].full
  const stemning = MAANED_STEMNING[month] ?? MAANED_STEMNING[5]

  const fraFroebank = buildFraFroebank(inventory, plants, month)
  const kurateret = CURATED_INSPIRATION[month] ?? CURATED_INSPIRATION[5]

  return (
    <section className="space-y-9">
      {/* TOP-HEADER — sektionens hovedinvitation */}
      <header style={{ paddingTop: 4 }}>
        <p
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#7B816F',
            margin: 0,
          }}
        >
          Inspiration
        </p>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: 22,
            lineHeight: 1.25,
            color: 'rgba(36,48,31,0.72)',
            margin: 0,
            marginTop: 8,
            maxWidth: 440,
          }}
        >
          Hvordan {maaned.toLowerCase()} bevæger sig lige nu.
        </p>
      </header>

      {/* LAG 1 — FRA DIN FRØBANK */}
      <FraFroebank items={fraFroebank} maaned={maaned} />

      {/* Sanselig quote mellem lag */}
      <SensoryQuote text={stemning.q1} />

      {/* LAG 2 — INSPIRATION (kurateret) */}
      <KurateretInspiration items={kurateret} maaned={maaned} />

      {/* Sanselig quote mellem lag */}
      <SensoryQuote text={stemning.q2} />

      {/* LAG 3 — FORDYB DIG */}
      <FordybDig />
    </section>
  )
}

// ════════════════════════════════════════════════════════════════
// LAG 1 — Fra din frøbank
// ════════════════════════════════════════════════════════════════

interface FraFroebankItem {
  text: string
  href?: string
}

function FraFroebank({ items, maaned }: { items: FraFroebankItem[]; maaned: string }) {
  return (
    <div>
      <LayerEyebrow>Fra din Frøbank</LayerEyebrow>
      <LayerTitle>Frøbanken foreslår</LayerTitle>

      {items.length > 0 ? (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginTop: 14,
          }}
        >
          {items.map((it, i) => (
            <li
              key={i}
              style={{
                fontFamily: sans,
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.55,
                color: '#3F4A35',
                paddingBlock: 8,
                borderBottom:
                  i === items.length - 1
                    ? 'none'
                    : '1px solid rgba(36,48,31,0.06)',
              }}
            >
              {it.href ? (
                <Link
                  href={it.href}
                  className="inline-flex items-baseline"
                  style={{ gap: 10, color: 'inherit', textDecoration: 'none' }}
                >
                  <span style={{ color: '#7B816F' }}>→</span>
                  <span>{it.text}</span>
                </Link>
              ) : (
                <span className="inline-flex items-baseline" style={{ gap: 10 }}>
                  <span style={{ color: '#7B816F' }}>→</span>
                  <span>{it.text}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: 17,
            lineHeight: 1.4,
            color: 'rgba(36,48,31,0.58)',
            margin: 0,
            marginTop: 14,
            maxWidth: 440,
          }}
        >
          {emptyStateLine(maaned)}
        </p>
      )}
    </div>
  )
}

function buildFraFroebank(
  inventory: InventoryItem[],
  plants: Plant[],
  month: number,
): FraFroebankItem[] {
  const out: FraFroebankItem[] = []
  const aktivePlanterSourceIds = new Set(
    plants.filter(p => !p.isArchived && p.sourceElementId).map(p => p.sourceElementId as string)
  )

  for (const item of inventory) {
    if (item.primaryCategoryId !== 'fro') continue
    const navn = item.variety ? `${item.name} ${item.variety}` : item.name

    // 1. Hvis brugeren ALLEREDE har en plante fra dette frø der er
    //    "klar til udplantning" og månedens plantingOutMonths matcher
    //    → "Dine X skal hærdes af"
    const existingPlant = plants.find(
      p => !p.isArchived && p.sourceElementId === item.id
    )
    if (existingPlant && existingPlant.status === 'klar_til_udplantning'
        && item.plantingOutMonths.includes(month)) {
      out.push({ text: `${item.name} skal hærdes af`, href: `/mine-planter/${existingPlant.id}` })
      continue
    }

    // 2. Hvis brugeren har eksisterende plante og pre-cultivation status er forspirring og udplantnings-måned matcher
    if (existingPlant && existingPlant.status === 'i_vaekst'
        && item.plantingOutMonths.includes(month)) {
      out.push({ text: `${item.name} kan plantes ud denne måned`, href: `/mine-planter/${existingPlant.id}` })
      continue
    }

    // 3. Hvis IKKE aktiv allerede OG månedens sowingMonths matcher
    //    → "Tid til at så X"
    if (!aktivePlanterSourceIds.has(item.id) && item.sowingMonths.includes(month)) {
      out.push({
        text: item.preCultivation ? `Forkultivér ${navn}` : `Så ${item.name} nu`,
        href: `/froebank/${item.id}`,
      })
      continue
    }

    // 4. Hvis månedens plantingOut matcher OG brugeren ikke har plante endnu
    if (!aktivePlanterSourceIds.has(item.id) && item.plantingOutMonths.includes(month)) {
      out.push({
        text: `${item.name} kan plantes ud denne måned`,
        href: `/froebank/${item.id}`,
      })
      continue
    }

    // 5. Høst-vindue
    if (item.harvestMonths.includes(month) && existingPlant) {
      out.push({
        text: `Høst ${item.name}`,
        href: `/mine-planter/${existingPlant.id}`,
      })
      continue
    }
  }

  return out.slice(0, 6)
}

const EMPTY_STATE_LINES = [
  'Din Frøbank hviler lidt endnu.',
  'Maj venter stadig på dine sorter.',
  'Endnu intet i støbeskeen — pust ud.',
  'Jorden er rolig. Det er du også.',
]

function emptyStateLine(maaned: string): string {
  // Variér efter måned så det ikke føles statisk
  if (maaned === 'Maj') return EMPTY_STATE_LINES[1]
  if (maaned === 'November' || maaned === 'December') return EMPTY_STATE_LINES[3]
  return EMPTY_STATE_LINES[0]
}

// ════════════════════════════════════════════════════════════════
// LAG 2 — Kurateret inspiration (sæson)
// ════════════════════════════════════════════════════════════════

interface KurateretItem {
  title: string
  text: string
}

function KurateretInspiration({ items, maaned }: { items: KurateretItem[]; maaned: string }) {
  return (
    <div>
      <LayerEyebrow>Inspiration</LayerEyebrow>
      <LayerTitle>Få mere ud af {maaned.toLowerCase()}</LayerTitle>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 10,
          marginTop: 14,
        }}
      >
        {items.map((c, i) => (
          <div
            key={i}
            style={{
              padding: '16px 18px',
              borderRadius: 18,
              background: 'rgba(246,243,235,0.78)',
              border: '1px solid rgba(36,48,31,0.06)',
              boxShadow: '0 2px 8px rgba(36,48,31,0.04)',
            }}
          >
            <p
              style={{
                fontFamily: sans,
                fontSize: 15,
                fontWeight: 800,
                lineHeight: 1.2,
                color: '#24301F',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {c.title}
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.45,
                color: 'rgba(36,48,31,0.62)',
                margin: 0,
                marginTop: 4,
              }}
            >
              {c.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export const CURATED_INSPIRATION: Record<number, KurateretItem[]> = {
  1: [
    { title: 'Læg planen for året', text: 'Skitsér bede, rotation, og hvad du vil dyrke for første gang.' },
    { title: 'Gennemgå Frøbanken', text: 'Se, hvad du allerede har, hvad der mangler, og hvilke frø du vil bruge først.' },
    { title: 'Forspir det langsomme', text: 'Chili og aubergine kræver et forspring nu.' },
  ],
  2: [
    { title: 'Begynd forspiring', text: 'Tomat, peberfrugt og chili kan starte indenfor.' },
    { title: 'Skitsér sæsonen', text: 'Klargør bedplaner og sædskifte, før foråret tager fart.' },
    { title: 'Vask redskaberne', text: 'Rene knive og bakker giver sundere spirer.' },
  ],
  3: [
    { title: 'Klar drivhuset', text: 'Vask ruder, luft ud, fyld bedene op.' },
    { title: 'Så de hårdføre', text: 'Spinat, radise og ærter kan ud i koldhus.' },
    { title: 'Forspir de varmekrævende', text: 'Squash, agurk og tomat kan starte indenfor.' },
  ],
  4: [
    { title: 'Hærd forspirede planter af', text: 'Lad dem stå ude lidt længere dag for dag, så de vænner sig til vind og lys.' },
    { title: 'Direkte såning', text: 'Gulerod, radise, salat og ærter kan i jorden nu.' },
    { title: 'Forbered jorden', text: 'Riv jorden, læg kompost på, og planlæg rækkerne.' },
  ],
  5: [
    { title: 'Så noget hurtigt voksende', text: 'Radise, salat og bønner kan stadig nå at give høst.' },
    { title: 'Start sensommerens planer', text: 'Så grønkål, pak choi og vinterportulak nu.' },
    { title: 'Giv krydderurterne mere plads', text: 'Persille, basilikum og dild trives når de står frit.' },
  ],
  6: [
    { title: 'Vand dybt og roligt', text: 'Bedre én lang vanding end mange overfladiske.' },
    { title: 'Tyv tomaterne', text: 'Fjern små sideskud løbende, før de vokser sig store.' },
    { title: 'Så til vinteren', text: 'Grønkål og kålroer kan nå at modnes i god tid.' },
  ],
  7: [
    { title: 'Pluk ofte', text: 'Høst ærter og bønner løbende, og tag salaten, mens den er frisk og sprød.' },
    { title: 'Tør krydderurter', text: 'Høst dem på en tør dag, når de dufter kraftigt.' },
    { title: 'Giv de sarte lidt skygge', text: 'Beskyt spirebakker og nyudplantede planter mod den skarpeste middagssol.' },
  ],
  8: [
    { title: 'Saml dine bedste frø', text: 'Saml modne frøstande fra planter, du gerne vil dyrke igen.' },
    { title: 'Plant til efterår', text: 'Vinterportulak og feldsalat kan nå at slå rødder.' },
    { title: 'Vand grundigt ved behov', text: 'August kan stadig være tør, især i krukker og nyplantede bede.' },
  ],
  9: [
    { title: 'Sæt grøngødning', text: 'Honningurt, boghvede eller rug — jorden takker dig til foråret.' },
    { title: 'Plant vinterhvidløg', text: 'Sæt feddene i efteråret, mens jorden stadig er til at arbejde med.' },
    { title: 'Saml løvkompost', text: 'Gratis jordforbedring for næste sæson.' },
  ],
  10: [
    { title: 'Tag det sarte ind', text: 'Flyt frostfølsomme krukker og planter i læ eller ind, hvis de skal overvintre.' },
    { title: 'Plant træer og buske', text: 'Jorden er stadig varm — perfekt til at slå rødder.' },
    { title: 'Læg løg i jord', text: 'Tulipaner og forårsløg vil have et godt forspring.' },
  ],
  11: [
    { title: 'Pak jorden ind', text: 'Et lag løv eller halm holder jorden levende.' },
    { title: 'Notér året', text: 'Hvad lykkedes? Hvad vil du justere?' },
  ],
  12: [
    { title: 'Drøm om næste sæson', text: 'Læs frøkataloger, og skitsér nye bede.' },
    { title: 'Pas på krukkerne', text: 'Tjek dræn, beskyt mod frostskader.' },
    { title: 'Lad jorden hvile', text: 'Det vigtigste i december er ofte at gøre ingenting.' },
  ],
}

// ════════════════════════════════════════════════════════════════
// LAG 3 — Fordyb dig
// ════════════════════════════════════════════════════════════════

function FordybDig() {
  return (
    <div>
      <LayerEyebrow>Fordyb dig</LayerEyebrow>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 12,
          marginTop: 14,
        }}
      >
        <DeepCard
          href="/guides"
          title="Dyrkningsguides"
          tagline="Lær hvorfor planterne gør som de gør."
          background="linear-gradient(135deg, rgba(168,196,128,0.65) 0%, rgba(122,154,82,0.85) 100%)"
        />
      </div>
    </div>
  )
}

function DeepCard({
  href,
  title,
  tagline,
  background,
}: {
  href: string
  title: string
  tagline: string
  background: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '24px 22px 22px',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 28,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 6,
        background,
        textDecoration: 'none',
        boxShadow: '0 10px 24px rgba(36,48,31,0.08)',
        minHeight: 140,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <p
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 32,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: 'rgba(36,48,31,0.92)',
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.4,
          color: 'rgba(36,48,31,0.72)',
          margin: 0,
          marginTop: 10,
          maxWidth: 320,
        }}
      >
        {tagline}
      </p>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: 18,
          bottom: 18,
          fontFamily: sans,
          fontSize: 22,
          color: 'rgba(36,48,31,0.55)',
        }}
      >
        →
      </span>
    </Link>
  )
}

// ════════════════════════════════════════════════════════════════
// Delete hjælpere
// ════════════════════════════════════════════════════════════════

function LayerEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: '#7B816F',
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}

function LayerTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: sans,
        fontSize: 19,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: '#24301F',
        margin: 0,
        marginTop: 6,
      }}
    >
      {children}
    </h3>
  )
}

function SensoryQuote({ text }: { text: string }) {
  return (
    <p
      style={{
        fontFamily: serif,
        fontStyle: 'italic',
        fontSize: 17,
        lineHeight: 1.45,
        color: 'rgba(36,48,31,0.55)',
        margin: 0,
        marginInline: 'auto',
        maxWidth: 420,
        textAlign: 'left',
        paddingBlock: 2,
      }}
    >
      {text}
    </p>
  )
}

// Sanselige quotes — én mellem lag 1+2 og én mellem 2+3.
// Bevidst NOT motivationelle. Forankrede observationer.
const MAANED_STEMNING: Record<number, { q1: string; q2: string }> = {
  1: { q1: 'Jorden hviler, men frøene husker varmen.', q2: 'Året er endnu et udkast.' },
  2: { q1: 'Lyset bliver længere uden at man har bedt om det.', q2: 'Spirerne kommer altid før vi tror.' },
  3: { q1: 'Det første spireblad er stadig en lille åbenbaring.', q2: 'Marts lover meget og holder det halvt.' },
  4: { q1: 'April kan ikke beslutte sig, men det er en del af charmen.', q2: 'Jorden har taget sin sweater af.' },
  5: { q1: 'Maj smager af sol og koldt vand.', q2: 'Alt vil ud i jorden samtidig.' },
  6: { q1: 'Aftnerne bliver lange og bløde.', q2: 'Bedene fyldes hurtigere, end man kan følge med.' },
  7: { q1: 'Tomaterne dufter inden de modner.', q2: 'Juli kræver tålmodighed på en helt anden måde.' },
  8: { q1: 'August er overflod og første afsked.', q2: 'Bierne arbejder hårdere end os.' },
  9: { q1: 'Lyset bliver gyldent uden at varsle.', q2: 'Jorden er nu varmere end luften.' },
  10: { q1: 'Bladene falder roligere end vi tror.', q2: 'Smag på æblerne, mens de stadig dufter af regn.' },
  11: { q1: 'Haven trækker vejret dybt nu.', q2: 'Det er svært at se vækst, men den findes.' },
  12: { q1: 'Stilheden i bedet er ikke tom — den planlægger.', q2: 'December er hvile, ikke død.' },
}
