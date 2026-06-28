'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Sparkles, Search, Plus, Loader2, X, ArrowRight, ShieldCheck, GitFork, User } from 'lucide-react'
import type { Guide, InventoryItem } from '@/lib/types'
import { attachGuideToInventory, generateGuideWithAI } from '@/actions/guides'

interface Props {
  item: InventoryItem
  currentGuide: Guide | null
  allGuides: Guide[]
}

export function GuideLink({ item, currentGuide, allGuides }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'choose' | 'pick' | 'generating' | 'generated'>('choose')
  const [search, setSearch] = useState('')
  const [generatedId, setGeneratedId] = useState<string | null>(null)

  function reset() {
    setStep('choose'); setSearch(''); setError(null); setGeneratedId(null)
  }

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) reset()
  }

  function handleAttach(guideId: string) {
    setError(null)
    startTransition(async () => {
      const res = await attachGuideToInventory(item.id, guideId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  function handleDetach() {
    setError(null)
    startTransition(async () => {
      const res = await attachGuideToInventory(item.id, null)
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  function handleGenerate() {
    setError(null)
    setStep('generating')
    startTransition(async () => {
      const res = await generateGuideWithAI({
        plantName: item.name,
        latinName: item.latinName ?? undefined,
        variety: item.variety ?? undefined,
        primaryCategoryId: item.primaryCategoryId,
      })
      if ('error' in res) {
        setError(res.error)
        setStep('choose')
        return
      }
      // Auto-tilknyt den nye guide
      const attach = await attachGuideToInventory(item.id, res.id)
      if ('error' in attach) {
        setError(attach.error)
        setStep('choose')
        return
      }
      setGeneratedId(res.id)
      setStep('generated')
      router.refresh()
    })
  }

  // Dedup: hvis brugeren har en privat kopi af samme plant_name+variety
  // som en master, foretrækker vi den private (brugerens egen tilpasning).
  // Match case-insensitivt og trimmet, præcis som i guide-listen.
  const dedupKey = (g: Guide) =>
    `${g.plantName.toLowerCase().trim()}|${(g.variety ?? '').toLowerCase().trim()}`
  const privateKeys = new Set(
    allGuides.filter(g => g.visibility === 'private').map(dedupKey)
  )
  const dedupedGuides = allGuides.filter(
    g => !(g.visibility === 'public' && privateKeys.has(dedupKey(g)))
  )

  const filtered = search
    ? dedupedGuides.filter(g =>
        g.plantName.toLowerCase().includes(search.toLowerCase()) ||
        g.variety?.toLowerCase().includes(search.toLowerCase()) ||
        g.latinName?.toLowerCase().includes(search.toLowerCase())
      )
    : dedupedGuides

  // Master-keys bruges til at vise "Tilpasset master"-mærke på private kopier
  const masterKeys = new Set(
    allGuides.filter(g => g.visibility === 'public').map(dedupKey)
  )

  // Hvis guide allerede tilknyttet — vis info + skift/fjern.
  // Sekundær callout: flex-layout med fast min-height, wrapper, intet klip.
  if (currentGuide) {
    // Titel = guidens identitet (plantName + sort); beskrivelse = summary.
    // INGEN opfundne trin/læsetid — kun ægte data, ellers neutral fallback.
    const guideTitle = `${currentGuide.plantName}${currentGuide.variety ? ` — ${currentGuide.variety}` : ''}`
    const guideDesc = currentGuide.summary || 'Åbn guiden og følg dyrkningen trin for trin.'
    return (
      <Card
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 100%), #EEF0DF',
          border: '1px solid rgba(83,111,54,0.14)',
          borderRadius: 24,
          boxShadow: '0 7px 16px rgba(64,58,42,0.055), inset 0 1px 0 rgba(255,255,255,0.34)',
          overflow: 'visible',
        }}
      >
        <CardContent className="flex items-start" style={{ gap: 16, padding: '18px 20px', minHeight: 88 }}>
          <span style={{ flex: '0 0 auto', width: 30, height: 30, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: 2, color: '#68745A' }}>
            <BookOpen className="h-[26px] w-[26px]" strokeWidth={1.9} />
          </span>
          {/* Content-kolonne: tekst + CTA wrapper sammen, så CTA'en aligner
              med tekstens venstrekant når den wrapper ned (mobil). */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ fontSize: 11, lineHeight: 1, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(38,51,33,0.58)', margin: 0 }}>
                Guide tilknyttet
              </p>
              <p style={{ marginTop: 6, fontSize: 20, lineHeight: 1.1, fontWeight: 750, color: '#263321' }}>{guideTitle}</p>
              <p className="line-clamp-2" style={{ marginTop: 5, fontSize: 15, lineHeight: 1.3, fontWeight: 400, color: 'rgba(38,51,33,0.68)' }}>
                {guideDesc}
              </p>
            </div>
            <div className="flex flex-col items-start" style={{ flex: '0 0 auto', gap: 6 }}>
              <Button asChild className="h-auto" style={{ height: 42, paddingInline: 18, borderRadius: 999, fontSize: 15, fontWeight: 650, background: '#536F36', color: '#FFFDF4' }}>
                <Link href={`/guides/${currentGuide.id}?returnTo=${encodeURIComponent(`/froebank/${item.id}`)}`}>
                  Åbn guide <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {/* Sekundær: skift/fjern guide — diskret, så "Åbn guide" er den klare handling. */}
              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto px-2 py-1" style={{ fontSize: 13, color: 'rgba(38,51,33,0.55)' }}>Skift</Button>
                </DialogTrigger>
                <DialogContent>{renderDialogBody()}</DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ingen guide — vis CTA. Sekundær callout (blød grøn flade, rolig, uklemt).
  return (
    <Card
      style={{
        background: '#EEF0DF',
        border: '1px solid rgba(83,111,54,0.12)',
        borderRadius: 24,
        boxShadow: '0 7px 16px rgba(64,58,42,0.055), inset 0 1px 0 rgba(255,255,255,0.34)',
        overflow: 'visible',
      }}
    >
      <CardContent className="flex items-start" style={{ gap: 16, padding: '18px 20px', minHeight: 88 }}>
        <span style={{ flex: '0 0 auto', width: 28, height: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: 2, color: '#68745A' }}>
          <BookOpen className="h-6 w-6" strokeWidth={1.9} />
        </span>
        {/* Content-kolonne: tekst + CTA wrapper sammen, så CTA'en aligner
            med tekstens venstrekant når den wrapper ned (mobil). */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <p style={{ fontSize: 20, lineHeight: 1.1, fontWeight: 700, color: '#263321', margin: 0 }}>Ingen guide tilknyttet</p>
            <p style={{ marginTop: 5, fontSize: 16, lineHeight: 1.3, fontWeight: 400, color: 'rgba(38,51,33,0.68)' }}>
              Tilknyt en eksisterende guide eller generér en ny med AI.
            </p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                className="h-auto"
                style={{ flex: '0 0 auto', height: 42, paddingInline: 18, borderRadius: 999, fontSize: 15, fontWeight: 650, background: '#536F36', color: '#FFFDF4' }}
              >
                Tilknyt guide
              </Button>
            </DialogTrigger>
            <DialogContent>{renderDialogBody()}</DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )

  function renderDialogBody() {
    if (step === 'generating') {
      return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
          <div>
            <p className="font-serif text-lg text-foreground">Genererer guide…</p>
            <p className="text-sm text-muted-foreground mt-1">
              AI laver dyrkningsguide for {item.name}{item.variety ? ` (${item.variety})` : ''}.
              Tager 5-15 sekunder.
            </p>
          </div>
        </div>
      )
    }

    if (step === 'generated' && generatedId) {
      return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-serif text-xl text-foreground">Guide oprettet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tilknyttet til {item.name}.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/guides/${generatedId}`}>Se guide</Link>
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Luk</Button>
          </div>
        </div>
      )
    }

    if (step === 'pick') {
      return (
        <>
          <DialogTitle>Vælg eksisterende guide</DialogTitle>
          <DialogDescription>Søg efter dansk eller latinsk navn.</DialogDescription>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Søg…"
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Ingen guides fundet.</p>
              ) : (
                filtered.map(g => {
                  const isMaster = g.visibility === 'public'
                  const isTilpasning = !isMaster && masterKeys.has(dedupKey(g))
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleAttach(g.id)}
                      disabled={pending}
                      className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">
                            {g.plantName}{g.variety ? ` — ${g.variety}` : ''}
                          </p>
                          {isMaster ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-700 text-white text-[10px] font-semibold px-1.5 py-0.5 shrink-0">
                              <ShieldCheck className="h-2.5 w-2.5" />
                              Master
                            </span>
                          ) : isTilpasning ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full border border-green-300 bg-green-50 text-green-900 text-[10px] font-medium px-1.5 py-0.5 shrink-0">
                              <GitFork className="h-2.5 w-2.5" />
                              Tilpasset
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 shrink-0">
                              <User className="h-2.5 w-2.5" />
                              Min
                            </span>
                          )}
                        </div>
                        {g.latinName && <p className="text-xs italic text-muted-foreground truncate">{g.latinName}</p>}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStep('choose')}>Tilbage</Button>
          </DialogFooter>
        </>
      )
    }

    // step === 'choose'
    return (
      <>
        <DialogTitle>{currentGuide ? 'Skift guide' : 'Tilknyt guide'}</DialogTitle>
        <DialogDescription>
          Vælg en eksisterende guide eller lad AI generere en ny.
        </DialogDescription>

        <div className="grid gap-2 py-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/40 hover:border-primary/50 transition-all text-left"
          >
            <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium text-foreground">Generér med AI</p>
              <p className="text-xs text-muted-foreground">
                Skræddersyet guide for {item.name}{item.variety ? ` (${item.variety})` : ''} — varer 5-15 sek.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStep('pick')}
            disabled={pending}
            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/40 hover:border-primary/50 transition-all text-left"
          >
            <span className="h-10 w-10 rounded-lg bg-secondary/40 text-foreground flex items-center justify-center shrink-0">
              <Search className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium text-foreground">Vælg eksisterende</p>
              <p className="text-xs text-muted-foreground">
                Fra dine egne {allGuides.length} guides.
              </p>
            </div>
          </button>

          {currentGuide && (
            <button
              type="button"
              onClick={handleDetach}
              disabled={pending}
              className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:border-destructive/40 transition-all text-left"
            >
              <span className="h-10 w-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <X className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-foreground">Fjern guide-tilknytning</p>
                <p className="text-xs text-muted-foreground">Frøposen er ikke længere knyttet til en guide.</p>
              </div>
            </button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </>
    )
  }
}
