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

  // Hvis guide allerede tilknyttet — vis info + skift/fjern
  if (currentGuide) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 py-4">
          <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">
              {currentGuide.plantName}{currentGuide.variety ? ` — ${currentGuide.variety}` : ''}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">{currentGuide.summary}</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/guides/${currentGuide.id}?returnTo=${encodeURIComponent(`/froebank/${item.id}`)}`}>
                Åbn <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">Skift</Button>
              </DialogTrigger>
              <DialogContent>{renderDialogBody()}</DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ingen guide — vis CTA
  return (
    <Card className="bg-secondary/20 border-secondary">
      <CardContent className="flex items-start gap-3 py-4">
        <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-foreground">Ingen guide tilknyttet</p>
          <p className="text-sm text-muted-foreground">
            Tilknyt en eksisterende guide eller generér en ny med AI.
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">Tilknyt guide</Button>
          </DialogTrigger>
          <DialogContent>{renderDialogBody()}</DialogContent>
        </Dialog>
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
