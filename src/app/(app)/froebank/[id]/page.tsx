import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FavoritePinButtons } from '@/components/froebank/favorite-pin-buttons'
import { DeleteInventoryButton } from '@/components/froebank/delete-button'
import { EditInventoryDialog } from '@/components/froebank/edit-inventory-dialog'
import { FlytTilFroebank } from '@/components/froebank/flyt-til-froebank'
import { SowDialog } from '@/components/froebank/sow-dialog'
import { GuideLink } from '@/components/froebank/guide-link'
import { getInventoryItem, getFroeposerForSort } from '@/actions/froebank'
import { getAllPlants } from '@/actions/mine-planter'
import { getAllGuides, getGuide } from '@/actions/guides'
import { getAllTasks } from '@/actions/havekalender'
import {
  PRIMARY_CATEGORIES, INVENTORY_STATUS_META, MONTHS_DA,
  LIGHT_META, WATER_META, GROWING_LOCATION_META, SYSTEM_SUBCATEGORIES,
} from '@/lib/constants'
import { formatDatoMedAar } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import { resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import { gruppensForsidefoto, poseStatusForSort, erUdloebet } from '@/lib/froebank-grupper'
import { irrelevanteDyrkningsfelter } from '@/lib/froebank-feltrelevans'
import {
  ArrowLeft, Calendar, BookOpen, Sprout, ArrowRight,
  MapPin, Droplets, Sun, Ruler, ArrowDown, ExternalLink,
} from 'lucide-react'
import { guideHref } from '@/lib/guides/guide-href'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

// Top-venstre og top-højre hjørne har nu SAMME hjørne-radius (3 viewBox-enheder):
// venstre Q 0 8 3 8, højre Q 100 4 100 7. Skulderen rejser sig stadig til y4.
const HERO_FOLDER_PATH =
  'M 0 100 L 0 11 Q 0 8 3 8 L 52 8 C 54 8 55 4 57 4 L 97 4 Q 100 4 100 7 L 100 94 Q 100 100 94 100 L 6 100 Q 0 100 0 94 Z'

// Kun mappens OVERKANT (top-venstre hjørne → lav top → skulder → top-højre
// hjørne) — bruges til en tynd, lys highlight-streg langs overkanten.
const HERO_FOLDER_TOP_EDGE =
  'M 0 11 Q 0 8 3 8 L 52 8 C 54 8 55 4 57 4 L 97 4 Q 100 4 100 7'

export default async function InventoryDetailPage({ params }: Props) {
  const { id } = await params
  const [item, allPlants, allTasks] = await Promise.all([
    getInventoryItem(id),
    getAllPlants(),
    getAllTasks(),
  ])
  if (!item) notFound()

  // Samme sort kan ligge i flere fysiske frøposer (forskellig leverandør,
  // årgang, udløb). Tom liste = kun én pose → afsnittet vises slet ikke.
  const froeposer = await getFroeposerForSort(item)

  // Udløb og brugsrækkefølge er AFLEDT ved visning — intet af det står i
  // databasen. "Brug denne først" er rådgivning, ikke en tilstand posen
  // har, og gives kun når Potalot har et fagligt grundlag (se
  // poseStatusForSort). Bedst før er ligeledes rådgivende: frøene bliver
  // ikke ubrugelige, og posen skjules aldrig.
  const poseStatus = poseStatusForSort(froeposer)
  const denneErUdloebet = erUdloebet(item.expiryDate)
  const nogenUdloebet = froeposer.some((p) => poseStatus.get(p.id)?.udloebet)
  const UDLOEB_HJAELP = 'Frø kan stadig spire efter bedst før-datoen. Prøv dem gerne, hvis de ser fine ud.'

  const linkedPlants = allPlants.filter(p => p.sourceElementId === item.id)
  const linkedTasks = allTasks
    .filter(t => t.linkedInventoryItemId === item.id)
    .sort((a, b) => a.date.localeCompare(b.date))
  const [guide, allGuides] = await Promise.all([
    item.guideId ? getGuide(item.guideId) : Promise.resolve(null),
    getAllGuides(),
  ])

  const cat = PRIMARY_CATEGORIES[item.primaryCategoryId]
  const subcat = SYSTEM_SUBCATEGORIES.find(s => s.id === item.subcategoryId)
  const statusMeta = INVENTORY_STATUS_META[item.status]
  const lightMeta = item.light ? LIGHT_META[item.light] : null
  const waterMeta = item.water ? WATER_META[item.water] : null

  // Dyrkningsfakta skal kun fremhæve det, der gælder for DENNE art/sort.
  // Ren præsentation: intet slettes, og felter skjules kun, når Potalot
  // POSITIVT ved, at de ikke bruges (manglende data ≠ irrelevant). Brugerens
  // egne afvigende værdier hiver altid feltet frem igen — se
  // lib/froebank-feltrelevans.ts.
  const irrelevante = irrelevanteDyrkningsfelter(item.name, item.variety, {
    preCultivation: item.preCultivation,
    plantingOutMonths: item.plantingOutMonths,
  })

  // Hero-statusblok — appens sans-font arves (ingen serif-override). Samme
  // krympede label/værdi-stil som tidligere, så heroens kolonne bevarer
  // præcis sine dimensioner; kun INDHOLDET skifter fra metadata til status.
  const detailLabel = { fontSize: 11, fontWeight: 400, lineHeight: 1.1, color: 'rgba(38,51,33,0.62)' }
  const detailValue = { fontSize: 12, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.01em', color: '#263321' }

  // Forsidefoto (#1): brugerens primære foto hvis aktivt valgt, ellers det
  // kuraterede frøkort. Samme resolver-prioritet som frøbank-kortet, så
  // detaljesiden og kortet altid viser det samme forsidefoto.
  //
  // Frøkortet tilhører SORTEN (jf. "Dine frøposer" nedenfor: guide, frøkort
  // og dyrkningsdata er fælles for poserne), så ligger sorten i flere poser,
  // bruges gruppens deterministisk valgte forsidefoto — ikke den åbnede
  // poses. Ellers ville samme sort vise ét billede i gridet og et andet
  // afhængigt af hvilken pose man klikkede sig ind på.
  //
  // Opslaget sker på navn+sort ved HVER visning: får Potalot et frøkort til
  // sorten efter posen blev oprettet, dukker det op af sig selv. Ingen
  // redigering, ingen gem, intet skrevet til databasen.
  const forsidefoto = froeposer.length > 1
    ? gruppensForsidefoto(froeposer)
    : item.primaryImageId
  const heroResolved = resolveSeedCard({
    guideId: item.guideId,
    name: item.name,
    variety: item.variety,
    preferredSrc: forsidefoto,
  })
  const hero = heroResolved.source === 'fallback' ? null : heroResolved
  // Galleri = øvrige uploadede fotos (forsidefotoet vises separat ovenfor).
  const galleriFotos = item.imageIds.filter((u) => u !== hero?.src)

  return (
    <article className="space-y-6 max-w-3xl">
      {/* ─────────────────────────────────────────────────────────────
          HERO — LÅST 2026-06-28. Rør ALDRIG uden ny eksplicit retning.
          "Et frøkort taget ud af en fysisk frøbank-mappe": mappen er
          BAGPLADE/kontekst, frøkort-billedet er hovedmotivet i FULD 4:5
          profil (ingen beskæring/front-lomme/overlay).

          Låste dimensioner (alle målt ved 390px mobil):
          · grid: minmax(0,1fr) | 91px, gap 12px (billede ~225×322)
          · billed-aspekt 550:786 (w-full), creme 3px ramme, radius 16
          · folder padding 38/12/27, billed-bund 7mm over mappebund,
            CTA-bund flugter med billed-bund (0px)
          · HØJRE KOLONNE = "Frøstatus" (handling/status, IKKE metadata —
            metadata bor i Detaljer-boksen nedenfor). Label/værdi-format,
            separatorer centreret (pb-16/mb-10), starter 5mm under billed-top.
          Indhold må opdateres; mål/former/skygger/farver må ikke.
          ───────────────────────────────────────────────────────────── */}
      <section aria-label={`${item.name}${item.variety ? ` ${item.variety}` : ''} — frøkort`}>
        {/* Topbar — diskret, over mappen, samme margin som siden */}
        <div className="flex items-center justify-between gap-2 pb-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/froebank" aria-label="Tilbage">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <FavoritePinButtons
              id={item.id}
              isFavorite={item.isFavorite}
              isPinned={item.isPinned}
            />
            {/* Status-chip — rektangulær knap med rundede hjørner, SAMME højde
                som star/pin-squircles (42px). */}
            <span
              className="inline-flex items-center whitespace-nowrap"
              style={{
                height: 38,
                paddingInline: 14,
                borderRadius: 12,
                background: '#DCE6CC',
                color: '#5E7048',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* Åben frøbank-mappe: én samlet mappeform + et diskret materialelag. */}
        <div className="relative">
          <div
            className="relative"
            style={{
              padding: '38px 12px 27px',
            }}
          >
            <svg
              aria-hidden
              className="absolute inset-0"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
              style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 12px 26px rgba(74,64,44,0.13)) drop-shadow(0 3px 7px rgba(74,64,44,0.07))',
              }}
            >
              <path d={HERO_FOLDER_PATH} fill="#E4DAC0" />
            </svg>
            <svg
              aria-hidden
              className="absolute inset-0"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
              style={{
                width: '100%',
                height: '100%',
                opacity: 0.055,
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
              }}
            >
              <defs>
                <pattern id="hero-folder-grain" width="6" height="6" patternUnits="userSpaceOnUse">
                  <circle cx="1.2" cy="1.5" r="0.28" fill="rgba(84,72,48,0.55)" />
                  <circle cx="4.4" cy="3.8" r="0.22" fill="rgba(255,255,255,0.75)" />
                </pattern>
              </defs>
              <path d={HERO_FOLDER_PATH} fill="url(#hero-folder-grain)" />
            </svg>
            {/* Tynd, lys highlight-streg langs mappens overkant (1px, ikke-skaleret) */}
            <svg
              aria-hidden
              className="absolute inset-0"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              {/* 'Smudgy' mørkere hjørner — radial vignette (let brugt look). */}
              <defs>
                <radialGradient id="hero-folder-smudge" cx="50%" cy="46%" r="66%">
                  <stop offset="50%" stopColor="rgba(74,60,32,0)" />
                  <stop offset="100%" stopColor="rgba(74,60,32,0.13)" />
                </radialGradient>
              </defs>
              <path d={HERO_FOLDER_PATH} fill="url(#hero-folder-smudge)" />
              <path
                d={HERO_FOLDER_TOP_EDGE}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
            </svg>
            <span
              className="absolute right-0 top-[32px] z-[1] w-[43%] text-center text-[10px] font-medium uppercase tracking-[0.15em] text-[#5C5436]"
            >
              {cat.name}{subcat && ` · ${subcat.name}`}
            </span>
            {/* Folder-title — direkte på mappen: stor editorial Cormorant-serif,
                to linjer (art øverst, sort i kursiv nedenunder). NB: font-serif
                er i dette projekt remappet til Inter, så Cormorant sættes
                eksplicit via --font-cormorant. */}
            <div
              className="relative z-[1] max-w-[72%]"
              style={{ marginLeft: 2, marginTop: 31, marginBottom: 28 }}
            >
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 0.95,
                  letterSpacing: '-0.01em',
                  color: '#263321',
                }}
              >
                {item.name}
              </h1>
              {item.variety && (
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 25,
                    lineHeight: 1.05,
                    color: '#6A7057',
                    marginTop: 2,
                  }}
                >
                  {item.variety}
                </p>
              )}
            </div>

            <div className="relative z-[1] grid grid-cols-[minmax(0,1fr)_91px] items-start gap-3">
              {/* Frøkort-billedet — fuldt synligt i 4:5 portræt, ovenpå
                  bagpladen. w-full h-auto = naturligt format, ingen beskæring. */}
              {hero && (
                <div className="flex justify-start">
                  <div
                    className="w-full overflow-hidden"
                    style={{
                      borderRadius: 16,
                      border: '3px solid #F7F2E6',
                      boxShadow:
                        '0 14px 30px rgba(56,48,30,0.26), 0 5px 12px rgba(56,48,30,0.15)',
                    }}
                  >
                    {/* TEST: billed-aspekt 550:786 (≈0,70). Kilden er 4:5, så
                        object-fit cover beskærer ~6% i siderne. Let at rulle tilbage. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img loading="lazy" decoding="async"
                      src={hero.src}
                      alt={item.name}
                      className="block w-full"
                      style={{ aspectRatio: '550 / 786', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              )}
              <aside className="flex min-h-full flex-col justify-between gap-3 pt-[19px] text-[#4A432C]">
                <div>
                  <h2
                    className="uppercase"
                    style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.12em', color: '#5D5741', marginBottom: 14 }}
                  >
                    Frøstatus
                  </h2>
                  {/* Samme label/værdi-struktur som den tidligere DETALJER-blok
                      (uændrede dimensioner/typografi/separatorer) — kun INDHOLDET
                      skifter fra metadata til status/sæson, så heroen svarer
                      "kan jeg bruge det nu?" uden at gentage Detaljer-boksen. */}
                  <dl className="divide-y divide-[rgba(101,94,71,0.14)]">
                    {item.seedCount != null && (
                      <div className="pt-[6px] first:pt-0 pb-[16px] last:pb-0 mb-[10px] last:mb-0">
                        <dt style={detailLabel}>Frø tilbage</dt>
                        <dd className="mt-1" style={detailValue}>{item.seedsRemaining ?? item.seedCount}</dd>
                      </div>
                    )}
                    {item.seedsSown != null && item.seedsSown > 0 && (
                      <div className="pt-[6px] first:pt-0 pb-[16px] last:pb-0 mb-[10px] last:mb-0">
                        <dt style={detailLabel}>Sået i år</dt>
                        <dd className="mt-1" style={detailValue}>{item.seedsSown}</dd>
                      </div>
                    )}
                    {item.sowingMonths.length > 0 && (
                      <div className="pt-[6px] first:pt-0 pb-[16px] last:pb-0 mb-[10px] last:mb-0">
                        <dt style={detailLabel}>Såvindue</dt>
                        <dd className="mt-1" style={detailValue}>{formatMonths(item.sowingMonths)}</dd>
                      </div>
                    )}
                    {item.harvestMonths.length > 0 && (
                      <div className="pt-[6px] first:pt-0 pb-[16px] last:pb-0 mb-[10px] last:mb-0">
                        <dt style={detailLabel}>Høst</dt>
                        <dd className="mt-1" style={detailValue}>{formatMonths(item.harvestMonths)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <SowDialog
                  inventoryItemId={item.id}
                  suggestedLocations={item.growingLocations}
                  itemLabel={item.variety ?? item.name}
                >
                  <Button
                    className="h-auto w-full px-2 py-2 text-xs"
                    style={{
                      borderRadius: 12,
                      boxShadow: '0 6px 14px rgba(40,52,26,0.30), 0 2px 5px rgba(40,52,26,0.18)',
                    }}
                  >
                    <Sprout className="h-3.5 w-3.5" />
                    Så et frø
                  </Button>
                </SowDialog>
              </aside>
            </div>

          </div>
        </div>
      </section>

      {/* Billed-galleri — øvrige uploadede fotos (fx for-/bagside af posen).
          Forsidefotoet vises allerede ovenfor og gentages ikke her. */}
      {galleriFotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {galleriFotos.map((url, i) => (
            <div key={url} className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" decoding="async" src={url} alt={`${item.name} billede ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {guide && (
        <Button asChild variant="outline" className="w-full">
          <Link href={guideHref(guide.id, `/froebank/${item.id}`)}>
            <BookOpen className="h-4 w-4" />
            Se guide
          </Link>
        </Button>
      )}

      {/* Dyrkningsfakta — primær datasektion under hero. Papir-kort med varm
          dybde; to kolonner, rolig rytme. */}
      <Card
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 100%), #F7F1E4',
          border: '1px solid rgba(117,101,62,0.13)',
          borderRadius: 26,
          boxShadow: '0 10px 22px rgba(64,58,42,0.075), 0 3px 8px rgba(64,58,42,0.045), inset 0 1px 0 rgba(255,255,255,0.42)',
          padding: '20px 22px 22px',
        }}
      >
        <CardHeader className="!p-0 !space-y-0">
          {/* Farvet sektionsikon = sektionens identitet (max 1 pr. sektion). */}
          <CardTitle className="flex items-center" style={{ gap: 9, fontSize: 23, lineHeight: 1.05, fontWeight: 750, color: '#263321', marginBottom: 22 }}>
            <Sprout className="h-[22px] w-[22px] shrink-0" strokeWidth={1.9} style={{ color: '#536F36' }} />
            Dyrkningsfakta
          </CardTitle>
        </CardHeader>
        <CardContent className="!p-0 grid grid-cols-2" style={{ columnGap: 38, rowGap: 20 }}>
          <Fact label="Sås" value={formatMonths(item.sowingMonths)} icon={<Calendar className="h-4 w-4" strokeWidth={1.9} />} />
          {/* Sådybde: null = ukendt (vis intet — ukendt er bedre end
              opdigtet præcision), 0 = eksplicit overfladesåning (en
              sætning, ikke "0 mm"), >0 = målet. */}
          {item.sowingDepthMm != null && (
            <Fact
              label="Sådybde"
              value={item.sowingDepthMm === 0 ? 'Sås på overfladen' : `${item.sowingDepthMm} mm`}
              icon={<ArrowDown className="h-4 w-4" strokeWidth={1.9} />}
            />
          )}
          {!irrelevante.has('preCultivation') && (
            <Fact
              label="Forkultivering"
              value={item.preCultivation == null ? '—' : item.preCultivation ? 'Ja' : 'Nej'}
            />
          )}
          {!irrelevante.has('plantingOutMonths') && (
            <Fact label="Plant ud" value={formatMonths(item.plantingOutMonths)} />
          )}
          <Fact label="Høst" value={formatMonths(item.harvestMonths)} />
          {lightMeta && <Fact label="Lys" value={lightMeta.label} icon={<Sun className="h-4 w-4" strokeWidth={1.9} />} />}
          {waterMeta && <Fact label="Vand" value={waterMeta.label} icon={<Droplets className="h-4 w-4" strokeWidth={1.9} />} />}
          {item.soil && <Fact label="Jord" value={item.soil} />}
          {item.germinationTemperature && <Fact label="Spiretemp" value={item.germinationTemperature} />}
          {item.germinationDays && <Fact label="Spiretid" value={formatDays(item.germinationDays)} />}
          {item.plantSpacing && <Fact label="Planteafstand" value={item.plantSpacing} icon={<Ruler className="h-4 w-4" strokeWidth={1.9} />} />}
          {item.rowSpacing && <Fact label="Rækkeafstand" value={item.rowSpacing} />}
        </CardContent>
      </Card>

      {/* Dyrkningssted — kompakt papir-strip; chips bærer indholdet. */}
      {item.growingLocations.length > 0 && (
        <Card
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 100%), #F7F1E4',
            border: '1px solid rgba(117,101,62,0.13)',
            borderRadius: 24,
            boxShadow: '0 10px 22px rgba(64,58,42,0.075), 0 3px 8px rgba(64,58,42,0.045), inset 0 1px 0 rgba(255,255,255,0.42)',
            padding: '18px 22px 20px',
          }}
        >
          <CardHeader className="!p-0 !space-y-0">
            <CardTitle className="flex items-center" style={{ gap: 9, fontSize: 23, lineHeight: 1.05, fontWeight: 750, color: '#263321', marginBottom: 14 }}>
              <MapPin className="h-5 w-5 shrink-0" strokeWidth={1.9} style={{ color: '#536F36' }} />
              Dyrkningssted
            </CardTitle>
          </CardHeader>
          <CardContent className="!p-0 flex gap-2 flex-wrap">
            {item.growingLocations.map(loc => {
              const meta = GROWING_LOCATION_META[loc]
              return (
                <Badge
                  key={loc}
                  variant="outline"
                  className="border-0"
                  style={{
                    height: 34,
                    paddingInline: 17,
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.28)',
                    border: '1px solid rgba(117,101,62,0.18)',
                    color: '#263321',
                  }}
                >
                  {meta.label}
                </Badge>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Dine frøposer — vises KUN når sorten ligger i flere fysiske poser.
          Poserne slås aldrig sammen: hver har sin leverandør, årgang, udløb
          og antal, og redigeres hver for sig. Sortens guide, frøkort og
          dyrkningsdata er derimod fælles og står i afsnittene ovenfor. */}
      {froeposer.length > 1 && (
        <Card
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 100%), #F7F1E4',
            border: '1px solid rgba(117,101,62,0.13)',
            borderRadius: 26,
            boxShadow: '0 10px 22px rgba(64,58,42,0.075), 0 3px 8px rgba(64,58,42,0.045), inset 0 1px 0 rgba(255,255,255,0.42)',
            padding: '20px 22px 22px',
          }}
        >
          <CardHeader className="!p-0 !space-y-0">
            <CardTitle style={{ fontSize: 21, lineHeight: 1.05, fontWeight: 700, color: '#263321', marginBottom: 6 }}>
              Dine frøposer
            </CardTitle>
            <p style={{ fontSize: 13, lineHeight: 1.35, color: 'rgba(38,51,33,0.62)', marginBottom: 16 }}>
              Du har {froeposer.length} poser af {item.name}
              {item.variety ? ` ${item.variety}` : ''}.
            </p>
          </CardHeader>
          <CardContent className="!p-0 space-y-2">
            {froeposer.map((pose) => {
              const erDenneSide = pose.id === item.id
              const status = poseStatus.get(pose.id)
              const detaljer = [
                pose.supplier,
                pose.purchaseYear != null ? String(pose.purchaseYear) : null,
                pose.expiryDate ? `bedst før ${formatDatoMedAar(pose.expiryDate)}` : null,
                // Ukendt antal står tomt — der opdigtes aldrig et 0.
                status?.froeTilbage != null
                  ? `${status.froeTilbage} frø tilbage`
                  : pose.quantity != null
                    ? `${pose.quantity} stk`
                    : null,
              ].filter(Boolean) as string[]

              const maerkater = [
                status?.udloebet ? 'udløbet' : null,
                status?.brugFoerst ? 'brug denne først' : null,
              ].filter(Boolean) as string[]

              const indhold = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block" style={{ fontSize: 14, lineHeight: 1.35, color: '#263321' }}>
                      {detaljer.length > 0 ? detaljer.join(' · ') : 'Ingen poseoplysninger endnu'}
                    </span>
                    {maerkater.length > 0 && (
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {status?.udloebet && <PoseMaerkat slags="udloebet" />}
                        {status?.brugFoerst && <PoseMaerkat slags="brug-foerst" />}
                      </span>
                    )}
                  </span>
                  {erDenneSide ? (
                    <span
                      className="shrink-0 whitespace-nowrap"
                      style={{ fontSize: 11, fontWeight: 650, letterSpacing: '0.08em', color: 'rgba(38,51,33,0.5)' }}
                    >
                      DENNE POSE
                    </span>
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0" style={{ color: 'rgba(38,51,33,0.45)' }} aria-hidden />
                  )}
                </>
              )

              const stil = {
                borderRadius: 16,
                border: '1px solid rgba(117,101,62,0.14)',
                background: erDenneSide ? 'rgba(220,230,204,0.5)' : 'rgba(255,255,255,0.42)',
                padding: '12px 14px',
              } as const

              return erDenneSide ? (
                <div key={pose.id} className="flex items-center gap-3" style={stil}>
                  {indhold}
                </div>
              ) : (
                <Link
                  key={pose.id}
                  href={`/froebank/${pose.id}`}
                  className="no-underline flex items-center gap-3"
                  style={stil}
                  aria-label={`Åbn frøposen ${[...detaljer, ...maerkater].join(', ')}`}
                >
                  {indhold}
                </Link>
              )
            })}
          </CardContent>
          {nogenUdloebet && (
            <p
              style={{ marginTop: 14, fontSize: 13, lineHeight: 1.45, color: 'rgba(38,51,33,0.62)' }}
            >
              {UDLOEB_HJAELP}
            </p>
          )}
        </Card>
      )}

      {/* Basis-info / metadata — SEKUNDÆR ift. Dyrkningsfakta (mindre titel,
          lettere værdivægt via tone="secondary"). Samme kort-materialitet. */}
      <Card
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 100%), #F7F1E4',
          border: '1px solid rgba(117,101,62,0.13)',
          borderRadius: 26,
          boxShadow: '0 10px 22px rgba(64,58,42,0.075), 0 3px 8px rgba(64,58,42,0.045), inset 0 1px 0 rgba(255,255,255,0.42)',
          padding: '20px 22px 22px',
        }}
      >
        <CardHeader className="!p-0 !space-y-0">
          <CardTitle style={{ fontSize: 21, lineHeight: 1.05, fontWeight: 700, color: '#263321', marginBottom: 18 }}>
            Detaljer
          </CardTitle>
        </CardHeader>
        <CardContent className="!p-0 grid grid-cols-1 sm:grid-cols-2" style={{ columnGap: 40, rowGap: 18 }}>
          {item.latinName && <Fact label="Latinsk navn" value={item.latinName} tone="secondary" />}
          {item.supplier && <Fact label="Leverandør" value={item.supplier} tone="secondary" />}
          {item.seedCount != null && (
            <Fact
              label="Frø"
              value={`${item.seedCount} (${item.seedsSown ?? 0} sået, ${item.seedsRemaining ?? item.seedCount} tilbage)`}
              tone="secondary"
            />
          )}
          {item.seedCount == null && item.quantity != null && <Fact label="Antal" value={`${item.quantity} stk`} tone="secondary" />}
          {item.purchaseYear && <Fact label="Købsår" value={String(item.purchaseYear)} tone="secondary" />}
          {item.purchaseDate && !item.purchaseYear && <Fact label="Indkøbsdato" value={formatDatoMedAar(item.purchaseDate)} tone="secondary" />}
          {item.expiryDate && (
            <Fact
              label="Udløber"
              tone="secondary"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  {formatDatoMedAar(item.expiryDate)}
                  {denneErUdloebet && <PoseMaerkat slags="udloebet" />}
                </span>
              }
            />
          )}
          {item.purchaseUrl && (
            <Fact
              label="Købt her"
              tone="secondary"
              value={
                <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate block">
                  {item.purchaseUrl}
                </a>
              }
            />
          )}
        </CardContent>
        {denneErUdloebet && froeposer.length < 2 && (
          <p style={{ marginTop: 18, fontSize: 13, lineHeight: 1.45, color: 'rgba(38,51,33,0.62)' }}>
            {UDLOEB_HJAELP}
          </p>
        )}
        {item.notes && (
          <p
            className="italic break-words"
            style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(101,94,71,0.14)', fontSize: 14, lineHeight: 1.4, color: 'rgba(38,51,33,0.7)' }}
          >
            {item.notes}
          </p>
        )}
      </Card>

      {/* Opgaver knyttet til dette frø */}
      {linkedTasks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Opgaver
              <span className="text-sm font-normal text-muted-foreground">
                ({linkedTasks.filter(t => t.status === 'open').length} åbne)
              </span>
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/kalender">
                Se kalender <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedTasks.map(t => (
              <div
                key={t.id}
                className={cn(
                  'flex items-start gap-3 p-2 rounded-lg',
                  t.status === 'completed' && 'opacity-60'
                )}
              >
                <div className={cn(
                  'h-2 w-2 rounded-full mt-2 shrink-0',
                  t.status === 'completed' ? 'bg-muted-foreground'
                    : t.priority === 'high' || t.priority === 'critical' ? 'bg-destructive'
                    : 'bg-primary'
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm text-foreground', t.status === 'completed' && 'line-through')}>
                    {t.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDatoMedAar(t.date)}
                    {t.status === 'completed' && ' · Udført'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Linkede planter */}
      {linkedPlants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-primary" />
              Dyrkes herfra
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {linkedPlants.length} {linkedPlants.length === 1 ? 'plante' : 'planter'} i Mine planter er
              oprettet fra denne frøpost. Frøbanken er kilden — Planter følger forløbet.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedPlants.map(p => (
              <Link
                key={p.id}
                href={`/mine-planter/${p.id}`}
                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-accent/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    {p.name}{p.variety ? ` — ${p.variety}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.sowDate && `Sået ${formatDatoMedAar(p.sowDate)}`}
                    {p.location && ` · ${p.location}`}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Frø→plante-broen (adaptive onboarding): frøet ligger i banken, men
          intet er sået endnu — forklar næste naturlige skridt og gevinsten.
          Væk så snart en plante er koblet (hjælp gentager sig aldrig). */}
      {item.status === 'i_froebank' && item.primaryCategoryId !== 'indkoebsliste' && linkedPlants.length === 0 && (
        <p className="text-xs text-muted-foreground" style={{ marginTop: 26, maxWidth: '42ch' }}>
          Frøet er lagt i din Frøbank. Når du sår det, kan du oprette en plante
          og følge den fra spiring til høst.
        </p>
      )}

      {/* Dyrkningsguide — lidt mere luft over end de tætte datakort (30px). */}
      <div style={{ marginTop: 30 }}>
        <GuideLink item={item} currentGuide={guide} allGuides={allGuides} />
      </div>

      {/* Ønskeliste-items: broen videre til Frøbanken (kategori-skifte, alt bevares). */}
      {item.primaryCategoryId === 'indkoebsliste' && (
        <div style={{ marginTop: 30 }}>
          <FlytTilFroebank itemId={item.id} />
        </div>
      )}

      {/* Rediger / slet — sekundære handlinger, rolige. */}
      <div className="flex items-center justify-end" style={{ gap: 18, marginTop: 38, marginBottom: 104 }}>
        <EditInventoryDialog item={item} />
        <DeleteInventoryButton id={item.id} name={item.name} />
      </div>
    </article>
  )
}

/**
 * Diskret mærkat på en fysisk frøpose. Begge er RÅDGIVENDE og afledt ved
 * visning — hverken "Udløbet" eller "Brug denne først" er en tilstand
 * posen har i databasen.
 *
 * "Udløbet" er bevidst jordfarvet, ikke rød: en passeret bedst før-dato
 * gør ikke frøene dårlige, og Potalot foreslår aldrig at kassere dem.
 */
function PoseMaerkat({ slags }: { slags: 'udloebet' | 'brug-foerst' }) {
  const stil =
    slags === 'udloebet'
      ? { background: 'rgba(150,116,58,0.15)', color: '#6E5527', tekst: 'UDLØBET' }
      : { background: 'rgba(79,111,53,0.16)', color: '#3D5626', tekst: 'BRUG DENNE FØRST' }
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full whitespace-nowrap"
      style={{
        padding: '3px 8px',
        background: stil.background,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: stil.color,
      }}
    >
      {stil.tekst}
    </span>
  )
}

function Fact({ label, value, icon, tone }: { label: string; value: React.ReactNode; icon?: React.ReactNode; tone?: 'secondary' }) {
  return (
    <div className="flex flex-col min-w-0">
      <span
        className="uppercase inline-flex items-center gap-1.5"
        style={{ fontSize: 11, fontWeight: 650, letterSpacing: '0.13em', color: 'rgba(38,51,33,0.56)' }}
      >
        {icon && <span className="inline-flex shrink-0" style={{ color: '#757B61' }}>{icon}</span>}
        {label}
      </span>
      <span
        className="break-words"
        style={{ marginTop: 6, fontSize: 16, lineHeight: 1.12, fontWeight: tone === 'secondary' ? 500 : 600, color: '#263321' }}
      >
        {value || '—'}
      </span>
    </div>
  )
}

// germinationDays kan være en formateret streng ("7-10 dage") ELLER et tal.
// Append kun enheden når værdien er numerisk; vis strenge råt (undgår "dage dage").
function formatDays(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'number') return `${value} dage`
  return value
}

function formatMonths(months: number[]): string {
  if (!months.length) return '—'
  const sorted = [...months].sort((a, b) => a - b)
  if (sorted.length === 1) return MONTHS_DA[sorted[0] - 1].full
  return `${MONTHS_DA[sorted[0] - 1].short}–${MONTHS_DA[sorted[sorted.length - 1] - 1].short}`
}
