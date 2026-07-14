'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EgenPlanteDialog } from '@/components/mine-planter/egen-plante-dialog'
import { HaveTekstFlow } from '@/components/onboarding/have-tekst-flow'
import { updateProfile } from '@/actions/profil'
import { Sprout, Camera, FileSpreadsheet, MessageSquareText, ArrowRight, Leaf, Loader2 } from 'lucide-react'
import type { GardenLocation } from '@/lib/types'

interface Props {
  gardenLocations: GardenLocation[]
  /** Navne der allerede findes (planter + frø) → dublet-markering i tekst-flow. */
  existingNames: string[]
  /** Server-talte udgangstal (opdateres ved retur fra scan/excel). */
  plantCount: number
  seedCount: number
  /**
   * true = genbesøg fra en ALLEREDE onboardet bruger ("Få din have ind" fra
   * Profil/tom-tilstande, F2). Så sætter vi ikke onboarded igen, og bund-copy
   * er "tilbage til min have" frem for begynd/spring-over.
   */
  isRevisit?: boolean
}

/**
 * Onboarding-shell (V1B) — ren ORKESTRERING af eksisterende flows.
 * Fem indgange for midt-sæson-brugeren: tilføj det du allerede dyrker, scan en
 * frøpose, importér en fil, fortæl om haven med tekst, eller spring over og
 * begynd enkelt. Intet nyt motor-lag — hver indgang fører ind i et eksisterende,
 * gennemtestet flow, og alt gemmes først efter brugerens godkendelse.
 *
 * Fremskridt bevares: alt oprettet ligger allerede i databasen, så et retur til
 * /onboarding (onboarded sættes først ved "færdig") viser haven indtil videre.
 */
export function OnboardingShell({ gardenLocations, existingNames, plantCount, seedCount, isRevisit = false }: Props) {
  const router = useRouter()
  const [tekstOpen, setTekstOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  // Vis altid de RIGTIGE server-tal (opdateres via router.refresh efter hver
  // tilføjelse). Ingen session-delta: den dobbelttalte OG talte tekst-oprettede
  // frø med som planter → "4 planter" der pludselig blev "6 frø, 0 planter".
  const iAlt = plantCount + seedCount

  // Onboarding: markér onboarded + gå til haven. Genbesøg (F2): bare tilbage.
  function afslut() {
    if (isRevisit) { router.push('/'); router.refresh(); return }
    startTransition(async () => {
      await updateProfile({ onboarded: true })
      router.push('/')
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <div className="text-center space-y-1.5">
        <div className="flex justify-center">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-serif text-foreground">Start hvor du er</h1>
        <p className="text-sm text-muted-foreground px-2">
          Du behøver ikke have styr på det hele. Start med det, du har — en
          frøpose, et par noter, en liste eller bare én plante. Du kan blande
          metoderne og tilføje mere senere.
        </p>
      </div>

      {/* Status-chip: sande server-tal, ellers en blød nudge til nul-brugeren. */}
      <div className="rounded-xl bg-secondary/50 px-4 py-2.5 text-center text-sm text-secondary-foreground">
        {iAlt > 0 ? (
          <>
            Din have indtil videre:{' '}
            <span className="font-medium">
              {seedCount > 0 && `${seedCount} frø`}
              {seedCount > 0 && plantCount > 0 && ' · '}
              {plantCount > 0 && `${plantCount} plante${plantCount === 1 ? '' : 'r'}`}
            </span>
          </>
        ) : (
          'Du kan begynde med lidt. Resten kan komme senere.'
        )}
      </div>

      {/* Kombinér-frit + genåbnelighed i én rolig linje. */}
      <p className="text-center text-xs text-muted-foreground -mt-2">
        Brug én metode nu, og kom tilbage til de andre senere.
      </p>

      <div className="space-y-2.5">
        {/* 1 — allerede dyrker */}
        <EgenPlanteDialog
          gardenLocations={gardenLocations}
          onCreated={() => router.refresh()}
        >
          <button className="w-full text-left">
            <MetodeKort
              icon={<Sprout className="h-5 w-5" />}
              title="Tilføj det, du dyrker"
              desc="Skriv én plante eller hele bedet — du bestemmer, hvor meget du udfylder."
            />
          </button>
        </EgenPlanteDialog>

        {/* 2 — scan frøpose */}
        <Link href="/froebank/tilfoej?mode=camera&from=onboarding" className="block">
          <MetodeKort
            icon={<Camera className="h-5 w-5" />}
            title="Scan en frøpose"
            desc="Tag et billede af en pose — Potalot henter det, den kan læse."
          />
        </Link>

        {/* 3 — import */}
        <Link href="/froebank/tilfoej?mode=excel&from=onboarding" className="block">
          <MetodeKort
            icon={<FileSpreadsheet className="h-5 w-5" />}
            title="Importér en liste"
            desc="Upload Excel eller CSV — også selvom listen ikke er perfekt."
          />
        </Link>

        {/* 4 — fortæl med tekst */}
        <button className="w-full text-left" onClick={() => setTekstOpen(true)}>
          <MetodeKort
            icon={<MessageSquareText className="h-5 w-5" />}
            title="Skriv frit om haven"
            desc="Skriv løst: noter, sorter, steder eller det du husker. Potalot foreslår, og du godkender."
          />
        </button>
      </div>

      {/* Bund — afhænger af data-tilstand (Anna 14/7). Genbesøg = bare tilbage. */}
      <div className="pt-1 space-y-2 text-center">
        {isRevisit ? (
          <Button className="w-full" onClick={afslut} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Tilbage til min have <ArrowRight className="h-4 w-4 ml-1" /></>}
          </Button>
        ) : iAlt > 0 ? (
          <>
            <Button className="w-full" onClick={afslut} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Vis min have <ArrowRight className="h-4 w-4 ml-1" /></>}
            </Button>
            <button type="button" onClick={afslut} disabled={pending} className="text-sm text-muted-foreground hover:underline">
              Tilføj mere senere
            </button>
          </>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={afslut} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Begynd uden at tilføje noget <ArrowRight className="h-4 w-4 ml-1" /></>}
          </Button>
        )}
      </div>

      {/* Tekst-flow i dialog */}
      <Dialog open={tekstOpen} onOpenChange={setTekstOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" /> Fortæl om haven
          </DialogTitle>
          <DialogDescription>
            Beskriv løst hvad du dyrker. Jeg foreslår planter og frø — du godkender,
            før noget gemmes.
          </DialogDescription>
          <HaveTekstFlow
            existingNames={existingNames}
            onCommitted={() => router.refresh()}
            onBack={() => setTekstOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetodeKort({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-input bg-card px-4 py-3.5 hover:border-primary/40 hover:bg-accent/40 transition-colors">
      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-foreground leading-tight">{title}</p>
        <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  )
}
