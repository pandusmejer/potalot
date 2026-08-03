'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { ArrowLeft, ChevronDown, Plus, Sprout, Wand2 } from 'lucide-react'
import { PRIMARY_CATEGORIES, PRIMARY_CATEGORY_IDS, SYSTEM_SUBCATEGORIES } from '@/lib/constants'
import type { PrimaryCategoryId } from '@/lib/types'
import { createInventoryItem } from '@/actions/froebank'
import { resolveSeedCard } from '@/lib/images/resolve-potalot-image'
import { findFroebankAutofill, tomDyrkning, type FroebankAutofill } from '@/lib/froebank-autofill'
import { slugify } from '@/lib/afledninger'
import { DyrkningsfaktaFields, type DyrkningsfaktaState } from './dyrkningsfakta-fields'
import type { KildeType } from './kilde-badge'
import { cn } from '@/lib/utils'

/**
 * ManuelOpret — to-trins manuel frø-oprettelse (Annas oplæg + plan 2/8).
 *
 *   Trin 1 "Hvilket frø er det?"  — identitet (holdes LET: kategori, art,
 *     sort, leverandør, foto; resten under "Flere oplysninger om frøposen")
 *   Trin 2 "Dyrkning"             — alle dyrkningsfelter, autofyldt fra
 *     sortsguide → artsguide (aldrig kategori), med kilde-badges.
 *
 * Principper: Potalot foreslår, brugeren bestemmer. Opfind aldrig data.
 * Al proveniens (badges) er form-session-only — intet persisteres; når
 * brugeren gemmer, er alle værdier brugerens egne.
 */

type Trin = 'identitet' | 'dyrkning'
type PrefillValg = 'ubesvaret' | 'potalot' | 'selv'

interface Props {
  returnTo?: string
  /** Forudfyldning (fra søgning-uden-match / guide-CTA'er) — ingen blindgyder. */
  initialName?: string
  initialVariety?: string
}

function erEns(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => x === b[i])
  }
  return a === b
}

export function ManuelOpret({ returnTo = '/froebank', initialName, initialVariety }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [trin, setTrin] = useState<Trin>('identitet')

  // ── Trin 1: identitet ──
  const [name, setName] = useState(initialName ?? '')
  const [variety, setVariety] = useState(initialVariety ?? '')
  const [latinName, setLatinName] = useState('')
  const [supplier, setSupplier] = useState('')
  const [primaryCat, setPrimaryCat] = useState<PrimaryCategoryId>('fro')
  const [subcat, setSubcat] = useState('')
  const [quantity, setQuantity] = useState('')
  const [seedCount, setSeedCount] = useState('')
  const [purchaseYear, setPurchaseYear] = useState('')
  const [purchaseUrl, setPurchaseUrl] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [primaryImage, setPrimaryImage] = useState<string | null>(null)
  const [visFlereOplysninger, setVisFlereOplysninger] = useState(false)

  // ── Trin 2: dyrkning + autofill ──
  const [autofill, setAutofill] = useState<FroebankAutofill | null>(null)
  const [lookupKey, setLookupKey] = useState('')
  const [prefillValg, setPrefillValg] = useState<PrefillValg>('ubesvaret')
  const [dyrkning, setDyrkning] = useState<DyrkningsfaktaState>(tomDyrkning)
  const [fieldState, setFieldState] = useState<Partial<Record<keyof DyrkningsfaktaState, KildeType>>>({})
  /** Afventende art-skifte-bekræftelse: brugeren har egne felter OG har skiftet art. */
  const [artSkift, setArtSkift] = useState<{ fra: string; til: string; nyt: FroebankAutofill | null } | null>(null)

  const isFroe = primaryCat === 'fro'
  const tilgaengeligeSubs = SYSTEM_SUBCATEGORIES.filter(s => s.parentCategoryIds.includes(primaryCat))

  // Frøkort-opslag (reaktivt, uden brugerens upload — samme regel som
  // harKurateretFroekort): findes et kurateret Potalot-frøkort for sorten?
  const froekort = name.trim() ? resolveSeedCard({ name: name.trim(), variety: variety.trim() || null }) : null
  const harFroekort = !!froekort && (froekort.source === 'guide-images' || froekort.source === 'asset-convention')

  /** Anvend autofill-facts på ikke-'egen'-felter; 'egen'-felter røres aldrig. */
  function anvendPaaIkkeEgne(nyt: FroebankAutofill | null) {
    const tom = tomDyrkning()
    setDyrkning(prev => {
      const next = { ...tom }
      for (const k of Object.keys(tom) as (keyof DyrkningsfaktaState)[]) {
        if (fieldState[k] === 'egen') {
          ;(next as Record<string, unknown>)[k] = prev[k]
        } else if (nyt) {
          ;(next as Record<string, unknown>)[k] = nyt.facts[k]
        }
      }
      return next
    })
    setFieldState(prev => {
      const next: typeof prev = {}
      for (const [k, v] of Object.entries(prev)) if (v === 'egen') next[k as keyof DyrkningsfaktaState] = v
      if (nyt) {
        for (const [k, v] of Object.entries(nyt.fieldSources)) {
          if (next[k as keyof DyrkningsfaktaState] !== 'egen') next[k as keyof DyrkningsfaktaState] = v
        }
      }
      return next
    })
  }

  function gaaTilDyrkning() {
    if (!name.trim()) return
    setError(null)
    const key = `${name.trim()}|${variety.trim()}`
    if (key !== lookupKey) {
      const nyt = findFroebankAutofill(name, variety)
      const gammelArt = lookupKey.split('|')[0] ?? ''
      const artAendret = gammelArt !== '' && slugify(gammelArt) !== slugify(name.trim())
      const harEgne = Object.values(fieldState).some(v => v === 'egen')

      if (artAendret && harEgne) {
        // Bevar brugerens data — men aldrig ind i botanisk absurditet uden
        // at spørge (Anna: tomatafstand skal ikke arves af guleroden i stilhed).
        setArtSkift({ fra: gammelArt, til: name.trim(), nyt })
      } else if (prefillValg === 'potalot') {
        // Stille gen-opslag: urørte forslag følger det nye opslag.
        setAutofill(nyt)
        anvendPaaIkkeEgne(nyt)
        if (!nyt && !harEgne) setPrefillValg('ubesvaret')
      } else {
        // Intet anvendt endnu ('ubesvaret') eller brugeren har fravalgt ('selv').
        setAutofill(nyt)
        if (prefillValg === 'ubesvaret') {
          setDyrkning(tomDyrkning())
          setFieldState({})
        }
      }
      setLookupKey(key)
    }
    setTrin('dyrkning')
  }

  function besvarArtSkift(behold: boolean) {
    if (!artSkift) return
    setAutofill(artSkift.nyt)
    if (behold) {
      anvendPaaIkkeEgne(artSkift.nyt)
      // 'egen'-felter overlever; forslag fra den nye art ligger under dem.
      if (artSkift.nyt) setPrefillValg('potalot')
    } else {
      setDyrkning(tomDyrkning())
      setFieldState({})
      setPrefillValg('ubesvaret')
    }
    setArtSkift(null)
  }

  function vaelgPrefill(valg: 'potalot' | 'selv') {
    if (valg === 'potalot' && autofill) {
      setDyrkning(autofill.facts)
      setFieldState(autofill.fieldSources)
    }
    setPrefillValg(valg)
  }

  /** Dirty-tracking: ændrede felter markeres 'egen' → "Tilpasset af dig". */
  function handleDyrkningChange(next: DyrkningsfaktaState) {
    const aendrede = (Object.keys(next) as (keyof DyrkningsfaktaState)[])
      .filter(k => !erEns(dyrkning[k], next[k]))
    if (aendrede.length) {
      setFieldState(prev => {
        const p = { ...prev }
        for (const k of aendrede) p[k] = 'egen'
        return p
      })
    }
    setDyrkning(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createInventoryItem({
        name: name.trim(),
        latinName: latinName.trim() || undefined,
        variety: variety.trim() || undefined,
        supplier: supplier.trim() || undefined,
        primaryCategoryId: primaryCat,
        subcategoryId: subcat || undefined,
        quantity: !isFroe && quantity ? parseInt(quantity, 10) : undefined,
        seedCount: isFroe && seedCount ? parseInt(seedCount, 10) : undefined,
        purchaseYear: purchaseYear ? parseInt(purchaseYear, 10) : undefined,
        purchaseUrl: purchaseUrl.trim() || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
        sowingMonths: dyrkning.sowingMonths,
        sowingDepthMm: dyrkning.sowingDepthMm ?? undefined,
        preCultivation: dyrkning.preCultivation ?? undefined,
        plantingOutMonths: dyrkning.plantingOutMonths,
        harvestMonths: dyrkning.harvestMonths,
        light: dyrkning.light ?? undefined,
        water: dyrkning.water ?? undefined,
        soil: dyrkning.soil.trim() || undefined,
        germinationDays: dyrkning.germinationDays.trim() || undefined,
        germinationTemperature: dyrkning.germinationTemperature.trim() || undefined,
        plantSpacing: dyrkning.plantSpacing.trim() || undefined,
        rowSpacing: dyrkning.rowSpacing.trim() || undefined,
        imageUrls: images,
        // BEVIDST afvigelse fra scan-flowets withholding (tilfoej-flow
        // l.118-152): dér er posefotos KILDEMATERIALE og frøkortet vinder
        // i stilhed. Her har brugeren set "Potalots foto af sorten"-boksen
        // og ALLIGEVEL valgt/beholdt sit eget som primært — et eksplicit,
        // forklaret valg. "Brug Potalots foto i stedet"-linket rydder
        // valget igen (primaryImage=null → resolveren viser frøkortet).
        primaryImageUrl: primaryImage ?? undefined,
      })
      if ('error' in res) { setError(res.error); return }
      router.push(`/froebank/${res.id}`)
    })
  }

  // ════════════════ TRIN 1 · Hvilket frø er det? ════════════════
  if (trin === 'identitet') {
    return (
      <Card>
        <CardContent className="py-5 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Trin 1 af 2</p>
            <h2 className="font-serif text-xl text-foreground">Hvilket frø er det?</h2>
          </div>

          <div>
            <Label>Primær kategori</Label>
            <select value={primaryCat} onChange={e => { setPrimaryCat(e.target.value as PrimaryCategoryId); setSubcat('') }}
              className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
              {PRIMARY_CATEGORY_IDS.filter(id => id !== 'favoritter').map(id => (
                <option key={id} value={id}>{PRIMARY_CATEGORIES[id].name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Navn *</Label><Input value={name} onChange={e => setName(e.target.value)} required placeholder="fx Tomat" className="mt-1.5" /></div>
            <div><Label>Sort</Label><Input value={variety} onChange={e => setVariety(e.target.value)} placeholder="fx Sungold" className="mt-1.5" /></div>
          </div>

          <div><Label>Leverandør</Label><Input value={supplier} onChange={e => setSupplier(e.target.value)} className="mt-1.5" /></div>

          {/* ── Foto (krav 3: forklaret frøkort-automatik) ── */}
          <div className="space-y-3">
            {harFroekort && froekort && (
              <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={froekort.src} alt="" className="h-24 w-[4.3rem] shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-foreground">Potalots foto af sorten</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Vi har fundet et officielt frøbankfoto til denne sort. Du kan bruge det
                    eller vælge dit eget billede som primært foto.
                  </p>
                </div>
              </div>
            )}
            <MultiImageUpload value={images} primary={primaryImage}
              onChange={(imgs, p) => { setImages(imgs); setPrimaryImage(p) }}
              folder="froebank" label="Tag eller vælg eget foto" />
            {images.length > 0 && (
              <p className="text-[11px] text-muted-foreground">Det primære foto vises på kortet i Frøbanken.</p>
            )}
            {harFroekort && primaryImage && (
              <p className="text-sm text-muted-foreground">
                Dit billede bruges nu som primært foto. Du kan stadig skifte tilbage til Potalots foto.{' '}
                <button type="button" onClick={() => setPrimaryImage(null)} className="font-medium text-primary underline underline-offset-2">
                  Brug Potalots foto i stedet
                </button>
              </p>
            )}
          </div>

          {/* ── Fold: øvrige stamdata (trin 1 holdes LET) ── */}
          <button
            type="button"
            onClick={() => setVisFlereOplysninger(v => !v)}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', visFlereOplysninger && 'rotate-180')} />
            Flere oplysninger om frøposen
          </button>

          {visFlereOplysninger && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Underkategori</Label>
                  <select value={subcat} onChange={e => setSubcat(e.target.value)}
                    className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
                    <option value="">Ingen</option>
                    {tilgaengeligeSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div><Label>Latinsk navn</Label><Input value={latinName} onChange={e => setLatinName(e.target.value)} className="mt-1.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isFroe ? 'Antal frø' : 'Antal'}</Label>
                  <Input type="number" value={isFroe ? seedCount : quantity}
                    onChange={e => isFroe ? setSeedCount(e.target.value) : setQuantity(e.target.value)}
                    className="mt-1.5" />
                  <p className="text-[11px] text-muted-foreground mt-1">Et omtrentligt antal er fint.</p>
                </div>
                <div>
                  <Label>Købsår</Label>
                  <Input type="number" value={purchaseYear} onChange={e => setPurchaseYear(e.target.value)} className="mt-1.5" />
                  <p className="text-[11px] text-muted-foreground mt-1">Hjælper dig med at bruge de ældste frø først.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Udløb</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Købt her</Label><Input type="url" value={purchaseUrl} onChange={e => setPurchaseUrl(e.target.value)} className="mt-1.5" /></div>
              </div>
              <div><Label>Noter</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1.5" /></div>
            </div>
          )}

          <Button type="button" onClick={gaaTilDyrkning} disabled={!name.trim()} className="w-full">
            Videre til dyrkning
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ════════════════ TRIN 2 · Dyrkning ════════════════
  const visValgkort = !artSkift && autofill !== null && prefillValg === 'ubesvaret'
  const visHjaelpetekst = !artSkift && autofill === null
  const badges: Partial<Record<keyof DyrkningsfaktaState, KildeType>> =
    prefillValg === 'potalot' ? fieldState : Object.fromEntries(Object.entries(fieldState).filter(([, v]) => v === 'egen'))

  return (
    <Card>
      <CardContent className="py-5 space-y-4">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon" aria-label="Tilbage til trin 1" onClick={() => setTrin('identitet')} className="-ml-2 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Trin 2 af 2</p>
            <h2 className="font-serif text-xl text-foreground">Dyrkning</h2>
          </div>
        </div>

        {/* ── Art-skifte-bekræftelse (kanttilfælde: egne felter + ny art) ── */}
        {artSkift && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 space-y-3">
            <p className="text-sm text-foreground">
              Du har ændret planten fra {artSkift.fra.toLowerCase()} til {artSkift.til.toLowerCase()}.
              Vil du beholde dine egne dyrkningsoplysninger?
            </p>
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={() => besvarArtSkift(true)}>Behold mine oplysninger</Button>
              <Button type="button" variant="outline" onClick={() => besvarArtSkift(false)}>Start dyrkningsfelterne forfra</Button>
            </div>
          </div>
        )}

        {/* ── Valgkort: fund → brugeren bestemmer (krav 6) ── */}
        {visValgkort && autofill && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                Vi har fundet oplysninger om denne {autofill.source === 'sort' ? 'sort' : 'plante'}. Du kan bruge dem
                som udgangspunkt eller udfylde alt selv.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" onClick={() => vaelgPrefill('potalot')}>Udfyld med Potalots forslag</Button>
              <Button type="button" variant="outline" onClick={() => vaelgPrefill('selv')}>Jeg udfylder selv</Button>
            </div>
          </div>
        )}

        {/* ── Intet fund → kategori som UI-hjælp (ALDRIG datakilde) ── */}
        {visHjaelpetekst && (
          <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4">
            <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Vi har endnu ingen dyrkningsdata for denne plante. Du kan stadig oprette den,
              og senere tilføje oplysningerne selv.
            </p>
          </div>
        )}

        {/* ── Kilde-linje (proveniens, krav 5) ── */}
        {prefillValg === 'potalot' && autofill && !artSkift && (
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            <p>{autofill.sourceLabel}</p>
            {autofill.sourceDetail && (
              <p className="mt-0.5 normal-case tracking-normal font-normal text-muted-foreground">{autofill.sourceDetail}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <DyrkningsfaktaFields
            value={dyrkning}
            onChange={handleDyrkningChange}
            fieldBadges={badges}
            autofillPlaceholders={prefillValg === 'potalot'}
            groupAdvanced
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending || !!artSkift} className="w-full">
            <Plus className="h-4 w-4" />
            {pending ? 'Opretter…' : 'Opret'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
