'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, ArrowLeft, ArrowRight, Check, MapPin, Loader2, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OnboardingForm } from '@/components/auth/onboarding-form'
import { OnboardingShell } from '@/components/onboarding/onboarding-shell'
import {
  saveOnboardingPreferences,
  type GrowerProfile, type NotificationProfile, type SeasonStatus,
} from '@/actions/profil'
import { lookupPostnummer } from '@/actions/weather'
import type { GardenLocation } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  email: string
  /** 'have' hvis brugernavn allerede er udfyldt (fortsæt-retur). */
  startPhase: 'profil' | 'have'
  /** Sat af page.tsx når preferencer allerede er gemt (season='igang') men
   *  onboarding ikke er afsluttet → genoptag på import-trinnet. */
  resumeImport?: boolean
  gardenLocations: GardenLocation[]
  existingNames: string[]
  plantCount: number
  seedCount: number
}

type Step =
  | 'identitet' | 'velkommen' | 'havetype' | 'lokation'
  | 'omraader' | 'grower' | 'notifikation' | 'saeson' | 'import'

const HAVETYPER = [
  { id: 'parcelhus', label: 'Parcelhushave' },
  { id: 'raekkehus', label: 'Rækkehus' },
  { id: 'kolonihave', label: 'Kolonihave' },
  { id: 'byhave', label: 'Byhave' },
  { id: 'altan', label: 'Altan' },
  { id: 'sommerhus', label: 'Sommerhus' },
  { id: 'landsted', label: 'Landsted' },
  { id: 'andet', label: 'Noget andet' },
]

const OMRAADER = [
  { id: 'koekkenhave', label: 'Køkkenhave' },
  { id: 'drivhus', label: 'Drivhus' },
  { id: 'hoejbede', label: 'Højbede' },
  { id: 'krukker', label: 'Krukker' },
  { id: 'blomster', label: 'Blomster' },
  { id: 'frugt_baer', label: 'Frugt og bær' },
  { id: 'lidt_af_hvert', label: 'Lidt af det hele' },
]

// Dyrker-IDENTITET (interesse) — påvirker IKKE notifikations-mængden.
const GROWERS: { id: GrowerProfile; emoji: string; label: string }[] = [
  { id: 'ny', emoji: '🌱', label: 'Ny dyrker' },
  { id: 'koekkenhave', emoji: '🥕', label: 'Køkkenhavedyrker' },
  { id: 'blomster', emoji: '🌸', label: 'Blomsterdyrker' },
  { id: 'froesamler', emoji: '🌻', label: 'Frøsamler' },
  { id: 'selvforsyner', emoji: '🥗', label: 'Selvforsyner' },
  { id: 'drivhus', emoji: '🪴', label: 'Drivhusdyrker' },
]

// NOTIFIKATIONSPROFIL (forstyrrelse) — uafhængig af dyrker-identiteten.
const NOTIFS: { id: NotificationProfile; emoji: string; title: string; desc: string }[] = [
  { id: 'mindful', emoji: '🌿', title: 'Mindful', desc: 'Ingen påmindelser. Jeg åbner selv Potalot, når jeg har lyst.' },
  { id: 'rolig', emoji: '🍃', title: 'Rolig', desc: 'Kun det vigtigste — få påmindelser.' },
  { id: 'aktiv', emoji: '🔔', title: 'Aktiv', desc: 'Hold mig opdateret med relevante påmindelser undervejs.' },
]

// De trin progress-tælleren dækker (bookends tælles ikke).
const PREF_STEPS: Step[] = ['havetype', 'lokation', 'omraader', 'grower', 'notifikation', 'saeson']

/**
 * Onboarding V2 — fuld preference-onboarding (Docs/product/onboarding-v2-spec.md).
 *
 * Samler hvor / hvordan / hvor meget forstyrres. Dyrker-identitet
 * (grower_profile) og notifikations-mængde (notification_profile) er TO
 * uafhængige dimensioner. Ingen draft-persistens (launch-scope): client-state
 * gemmes samlet — dog gemmes preferencerne FØR import-grenen, fordi dens
 * indgange navigerer væk. Afsluttes altid på /onboarding/faerdig.
 */
export function OnboardingWizard({
  email, startPhase, resumeImport = false, gardenLocations, existingNames, plantCount, seedCount,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(
    resumeImport ? 'import' : startPhase === 'have' ? 'velkommen' : 'identitet',
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [gardenType, setGardenType] = useState<string | null>(null)
  const [growingAreas, setGrowingAreas] = useState<string[]>([])
  const [growerProfile, setGrowerProfile] = useState<GrowerProfile | null>(null)
  const [notificationProfile, setNotificationProfile] = useState<NotificationProfile | null>(null)
  const [seasonStatus, setSeasonStatus] = useState<SeasonStatus>('starter')
  const [loc, setLoc] = useState<{ latitude: number; longitude: number; locationName: string | null } | null>(null)

  const [postnr, setPostnr] = useState('')
  const [locStatus, setLocStatus] = useState<'idle' | 'looking'>('idle')
  const [locError, setLocError] = useState<string | null>(null)

  function prefsPayload(season: SeasonStatus, onboarded: boolean) {
    return {
      gardenType, growingAreas, growerProfile, notificationProfile,
      seasonStatus: season,
      latitude: loc?.latitude ?? null,
      longitude: loc?.longitude ?? null,
      locationName: loc?.locationName ?? null,
      onboarded,
    }
  }

  // "Starter nu" / "flere måneder": gem alt + onboarded → varm Klar-skærm.
  function afslutFinal() {
    setError(null)
    startTransition(async () => {
      const res = await saveOnboardingPreferences(prefsPayload(seasonStatus, true))
      if ('error' in res) { setError('Kunne ikke gemme dine valg. Prøv igen.'); return }
      router.push('/onboarding/faerdig')
      router.refresh()
    })
  }

  // "Godt i gang": gem preferences (uden onboarded) FØR import-shellen, fordi
  // dens indgange navigerer væk. Shellen fører selv videre til Klar-skærmen.
  function tilImport() {
    setError(null)
    startTransition(async () => {
      const res = await saveOnboardingPreferences(prefsPayload('igang', false))
      if ('error' in res) { setError('Kunne ikke gemme dine valg. Prøv igen.'); return }
      setStep('import')
    })
  }

  function brugPlacering() {
    setLocError(null)
    if (!('geolocation' in navigator)) { setLocError('Din browser understøtter ikke deling af placering. Brug et postnummer i stedet.'); return }
    setLocStatus('looking')
    navigator.geolocation.getCurrentPosition(
      pos => {
        // Kun grove koordinater til lokalt vejr — aldrig en adresse.
        setLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, locationName: null })
        setLocStatus('idle')
        setStep('omraader')
      },
      err => {
        setLocStatus('idle')
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? 'Placeringen blev ikke delt — helt fint. Brug et postnummer i stedet.'
            : err.code === err.TIMEOUT
              ? 'Det tog for lang tid at finde din placering. Prøv et postnummer.'
              : 'Kunne ikke finde din placering. Prøv et postnummer.',
        )
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    )
  }

  function slaaPostnrOp() {
    setLocError(null)
    if (!/^\d{4}$/.test(postnr.trim())) { setLocError('Indtast et gyldigt dansk postnummer (4 cifre).'); return }
    setLocStatus('looking')
    startTransition(async () => {
      const hit = await lookupPostnummer(postnr.trim())
      setLocStatus('idle')
      if (!hit) { setLocError('Kunne ikke finde det postnummer. Tjek det, eller spring over.'); return }
      setLoc({ latitude: hit.latitude, longitude: hit.longitude, locationName: hit.name })
      setStep('omraader')
    })
  }

  function toggleArea(id: string) {
    setGrowingAreas(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const prefIndex = PREF_STEPS.indexOf(step)
  const showProgress = prefIndex >= 0

  if (step === 'identitet') {
    return (
      <div className="w-full max-w-md space-y-6">
        <Header title="Velkommen" sub="Potalot hjælper dig med at bruge mindre tid på appen og mere tid i haven. Start med et par valg, så tilpasser vi oplevelsen." />
        <OnboardingForm email={email} onComplete={() => setStep('havetype')} />
      </div>
    )
  }

  if (step === 'velkommen') {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <Header title="Velkommen tilbage" sub="Lad os få de sidste par valg på plads, så Potalot kan tilpasse sig din have." />
        <Button className="w-full" onClick={() => setStep('havetype')}>Fortsæt <ArrowRight className="h-4 w-4" /></Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {showProgress && (
        <div className="flex items-center gap-2">
          {prefIndex > 0 && (
            <button type="button" onClick={() => setStep(PREF_STEPS[prefIndex - 1])} className="text-muted-foreground hover:text-foreground" aria-label="Tilbage">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 flex gap-1.5">
            {PREF_STEPS.map((s, i) => (
              <div key={s} className={cn('h-1 flex-1 rounded-full', i <= prefIndex ? 'bg-primary' : 'bg-muted')} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{prefIndex + 1}/{PREF_STEPS.length}</span>
        </div>
      )}

      {/* HAVETYPE */}
      {step === 'havetype' && (
        <StepBody title="Hvor dyrker du?" sub="Så kan Potalot tilpasse forslag og guides til din have.">
          <div className="grid grid-cols-2 gap-2.5">
            {HAVETYPER.map(h => (
              <OptionCard key={h.id} label={h.label} selected={gardenType === h.id}
                onClick={() => { setGardenType(h.id); setStep('lokation') }} />
            ))}
          </div>
        </StepBody>
      )}

      {/* LOKATION */}
      {step === 'lokation' && (
        <StepBody title="Hvor er haven?" sub="Bruges til vejr, frostvarsler og lokale dyrkningsforhold i kalenderen. Kun til lokalt vejr — vi gemmer aldrig din adresse, kun grove koordinater.">
          <div className="space-y-3">
            <button type="button" onClick={brugPlacering} disabled={locStatus === 'looking'}
              className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left hover:border-primary/50 transition-colors disabled:opacity-60">
              {locStatus === 'looking' ? <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" /> : <Navigation className="h-5 w-5 text-primary shrink-0" />}
              <div>
                <p className="font-medium text-sm text-foreground">Brug min placering</p>
                <p className="text-xs text-muted-foreground">Del din omtrentlige placering</p>
              </div>
            </button>

            <div className="rounded-xl border border-border bg-card px-4 py-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> <span className="font-medium">Indtast postnummer</span>
              </div>
              <div className="flex gap-2">
                <Input inputMode="numeric" maxLength={4} placeholder="fx 8000" value={postnr}
                  onChange={e => { setPostnr(e.target.value.replace(/\D/g, '')); setLocError(null) }} />
                <Button onClick={slaaPostnrOp} disabled={pending || postnr.trim().length !== 4}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
                </Button>
              </div>
            </div>

            {locError && <p className="text-sm text-destructive">{locError}</p>}

            <button type="button" onClick={() => setStep('omraader')} className="w-full text-sm text-muted-foreground hover:text-foreground py-1">
              Spring over — jeg tilføjer det senere
            </button>
          </div>
        </StepBody>
      )}

      {/* DYRKNINGSOMRÅDER */}
      {step === 'omraader' && (
        <StepBody title="Hvad dyrker du mest?" sub="Vælg gerne flere. Det hjælper Potalot med at vise mere relevante forslag.">
          <div className="flex flex-wrap gap-2">
            {OMRAADER.map(o => (
              <OptionPill key={o.id} label={o.label} selected={growingAreas.includes(o.id)} onClick={() => toggleArea(o.id)} />
            ))}
          </div>
          <Button className="w-full mt-5" onClick={() => setStep('grower')}>
            Fortsæt <ArrowRight className="h-4 w-4" />
          </Button>
        </StepBody>
      )}

      {/* DYRKER-IDENTITET */}
      {step === 'grower' && (
        <StepBody title="Hvilken slags dyrker er du?" sub="Bruges til at tilpasse indhold og forslag. Det ændrer ikke, hvor meget Potalot forstyrrer dig.">
          <div className="grid grid-cols-2 gap-2.5">
            {GROWERS.map(g => (
              <button key={g.id} type="button"
                onClick={() => { setGrowerProfile(g.id); setStep('notifikation') }}
                className={cn('flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-colors',
                  growerProfile === g.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50')}>
                <span className="text-2xl leading-none" aria-hidden>{g.emoji}</span>
                <span className="text-sm font-medium text-foreground">{g.label}</span>
              </button>
            ))}
          </div>
        </StepBody>
      )}

      {/* NOTIFIKATIONSPROFIL */}
      {step === 'notifikation' && (
        <StepBody title="Hvor meget må Potalot forstyrre?" sub="Det valg er uafhængigt af, hvad du dyrker. Du kan altid ændre det senere.">
          <div className="space-y-2.5">
            {NOTIFS.map(n => (
              <button key={n.id} type="button"
                onClick={() => { setNotificationProfile(n.id); setStep('saeson') }}
                className={cn('w-full flex items-start gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors',
                  notificationProfile === n.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50')}>
                <span className="text-2xl leading-none mt-0.5" aria-hidden>{n.emoji}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </StepBody>
      )}

      {/* MIDT I SÆSONEN */}
      {step === 'saeson' && (
        <StepBody title="Hvor langt er du med haven?" sub="Så møder Potalot dig, hvor du er lige nu.">
          <div className="space-y-2.5">
            <OptionRow label="Jeg starter nu" desc="Blank tavle — vi bygger haven op sammen." onClick={() => { setSeasonStatus('starter'); afslutFinal() }} disabled={pending} />
            <OptionRow label="Jeg er godt i gang" desc="Jeg har allerede planter, frø eller noter — hjælp mig med at få dem ind." onClick={() => { setSeasonStatus('igang'); tilImport() }} disabled={pending} />
            <OptionRow label="Jeg er flere måneder inde" desc="Haven kører — jeg vil bare have overblik fremover." onClick={() => { setSeasonStatus('flere_maaneder'); afslutFinal() }} disabled={pending} />
          </div>
          {pending && <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Gemmer dine valg…</p>}
        </StepBody>
      )}

      {/* IMPORT (V1B-shell). Fører videre til Klar-skærmen ved afslutning. */}
      {step === 'import' && (
        <div className="-mt-2">
          <OnboardingShell
            gardenLocations={gardenLocations}
            existingNames={existingNames}
            plantCount={plantCount}
            seedCount={seedCount}
            finishHref="/onboarding/faerdig"
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  )
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center space-y-2">
      <div className="flex justify-center"><Sprout className="h-10 w-10 text-primary" /></div>
      <h1 className="text-3xl font-serif text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">{sub}</p>
    </div>
  )
}

function StepBody({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-serif text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{sub}</p>
      </div>
      {children}
    </div>
  )
}

function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('rounded-xl border px-3 py-4 text-sm font-medium text-center transition-colors',
        selected ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-foreground hover:border-primary/50')}>
      {label}
    </button>
  )
}

function OptionPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
        selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/50')}>
      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
      {label}
    </button>
  )
}

function OptionRow({ label, desc, onClick, disabled }: { label: string; desc: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left hover:border-primary/50 transition-colors disabled:opacity-60">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  )
}
