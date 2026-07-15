'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, ArrowLeft, ArrowRight, Check, MapPin, Loader2, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OnboardingForm } from '@/components/auth/onboarding-form'
import { OnboardingShell } from '@/components/onboarding/onboarding-shell'
import { saveOnboardingPreferences, type GrowerProfile, type SeasonStatus } from '@/actions/profil'
import { lookupPostnummer } from '@/actions/weather'
import type { GardenLocation } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  email: string
  /** 'have' hvis profilen (brugernavn) allerede er udfyldt (fortsæt-retur). */
  startPhase: 'profil' | 'have'
  gardenLocations: GardenLocation[]
  existingNames: string[]
  plantCount: number
  seedCount: number
}

type Step =
  | 'identitet' | 'velkommen' | 'havetype' | 'lokation'
  | 'omraader' | 'profil' | 'saeson' | 'import' | 'klar'

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

const PROFILER: { id: GrowerProfile; emoji: string; title: string; tagline: string; desc: string }[] = [
  { id: 'mindful', emoji: '🌿', title: 'Mindful', tagline: 'Jeg vil dyrke have, ikke administrere den.', desc: 'Kun det vigtigste. Få påmindelser, ingen unødig støj.' },
  { id: 'hjaelper', emoji: '🌱', title: 'Hjælperen', tagline: 'Jeg vil gerne have lidt hjælp.', desc: 'Balanceret. Relevante påmindelser og vejrbaserede råd undervejs.' },
  { id: 'entusiast', emoji: '🌾', title: 'Haveentusiasten', tagline: 'Jeg elsker detaljer og vil lære mest muligt.', desc: 'Mere indsigt, flere forslag og mere statistik.' },
  { id: 'froesamler', emoji: '🌻', title: 'Frøsamleren', tagline: 'Jeg dyrker næsten lige så meget frø som planter.', desc: 'Frøbanken i centrum: sortshistorik og frøhøst.' },
]

// Rækkefølge for progress-tælleren (de fem preference-trin; bookends tælles ikke).
const PREF_STEPS: Step[] = ['havetype', 'lokation', 'omraader', 'profil', 'saeson']

/**
 * Onboarding V2 — fuld preference-onboarding (spec: Docs/product/onboarding-v2-spec.md).
 *
 * Samler de tre ting Potalot skal vide fra dag ét: hvor / hvordan / hvor meget
 * forstyrres. Ingen draft-persistens (launch-scope): alt holdes i client-state
 * og gemmes samlet — dog gemmes preferencerne FØR import-grenen, fordi dens
 * indgange navigerer væk. `onboarded` sættes først til allersidst.
 */
export function OnboardingWizard({
  email, startPhase, gardenLocations, existingNames, plantCount, seedCount,
}: Props) {
  const router = useRouter()
  // Har brugeren allerede brugernavn (retur), springes identitet over.
  const [step, setStep] = useState<Step>(startPhase === 'have' ? 'velkommen' : 'identitet')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Preference-state (client-side indtil samlet gem).
  const [gardenType, setGardenType] = useState<string | null>(null)
  const [growingAreas, setGrowingAreas] = useState<string[]>([])
  const [growerProfile, setGrowerProfile] = useState<GrowerProfile | null>(null)
  const [seasonStatus, setSeasonStatus] = useState<SeasonStatus>('starter')
  const [loc, setLoc] = useState<{ latitude: number; longitude: number; locationName: string | null } | null>(null)

  // Lokations-input
  const [postnr, setPostnr] = useState('')
  const [locStatus, setLocStatus] = useState<'idle' | 'looking' | 'error'>('idle')

  function prefsPayload(seasonStatus: SeasonStatus, onboarded: boolean) {
    return {
      gardenType,
      growingAreas,
      growerProfile,
      seasonStatus,
      latitude: loc?.latitude ?? null,
      longitude: loc?.longitude ?? null,
      locationName: loc?.locationName ?? null,
      onboarded,
    }
  }

  // Endelig afslutning (fra Klar-skærmen): gem alt + onboarded, gå til haven.
  function afslutFinal() {
    setError(null)
    startTransition(async () => {
      const res = await saveOnboardingPreferences(prefsPayload(seasonStatus, true))
      if ('error' in res) { setError(res.error); return }
      router.push('/')
      router.refresh()
    })
  }

  // "Godt i gang": gem preferences (uden onboarded) FØR import-shellen, hvis
  // indgange navigerer væk. Shellen sætter selv onboarded ved sin afslutning.
  function tilImport() {
    setError(null)
    startTransition(async () => {
      const res = await saveOnboardingPreferences(prefsPayload('igang', false))
      if ('error' in res) { setError(res.error); return }
      setStep('import')
    })
  }

  function brugPlacering() {
    if (!('geolocation' in navigator)) { setLocStatus('error'); return }
    setLocStatus('looking')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, locationName: null })
        setLocStatus('idle')
        setStep('omraader')
      },
      () => setLocStatus('error'),
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  function slaaPostnrOp() {
    if (!/^\d{4}$/.test(postnr.trim())) { setLocStatus('error'); return }
    setLocStatus('looking')
    startTransition(async () => {
      const hit = await lookupPostnummer(postnr.trim())
      if (!hit) { setLocStatus('error'); return }
      setLoc({ latitude: hit.latitude, longitude: hit.longitude, locationName: hit.name })
      setLocStatus('idle')
      setStep('omraader')
    })
  }

  function toggleArea(id: string) {
    setGrowingAreas(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const prefIndex = PREF_STEPS.indexOf(step)
  const showProgress = prefIndex >= 0

  // ── Trin: identitet (brugernavn) ──
  if (step === 'identitet') {
    return (
      <div className="w-full max-w-md space-y-6">
        <Header title="Velkommen" sub="Potalot hjælper dig med at bruge mindre tid på appen og mere tid i haven. Start med et par valg, så tilpasser vi oplevelsen." />
        <OnboardingForm email={email} onComplete={() => setStep('havetype')} />
      </div>
    )
  }

  // ── Trin: velkommen (kun ved retur uden preference-data) ──
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
        <div className="space-y-3">
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
            <span className="text-xs text-muted-foreground tabular-nums">{prefIndex + 1}/5</span>
          </div>
        </div>
      )}

      {/* 2 — HAVETYPE */}
      {step === 'havetype' && (
        <StepBody title="Hvor dyrker du?" sub="Så kan vi tilpasse anbefalinger, guides og senere fællesskab.">
          <div className="grid grid-cols-2 gap-2.5">
            {HAVETYPER.map(h => (
              <OptionCard key={h.id} label={h.label} selected={gardenType === h.id}
                onClick={() => { setGardenType(h.id); setStep('lokation') }} />
            ))}
          </div>
        </StepBody>
      )}

      {/* 3 — LOKATION */}
      {step === 'lokation' && (
        <StepBody title="Hvor er haven?" sub="Bruges til vejr, frostvarsler og lokale dyrkningsforhold i kalenderen. Kun postnummer-niveau — aldrig din adresse.">
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
                <Input inputMode="numeric" maxLength={4} placeholder="F.eks. 8000" value={postnr}
                  onChange={e => { setPostnr(e.target.value.replace(/\D/g, '')); setLocStatus('idle') }} />
                <Button onClick={slaaPostnrOp} disabled={pending || postnr.trim().length !== 4}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
                </Button>
              </div>
            </div>

            {locStatus === 'error' && (
              <p className="text-sm text-destructive">Kunne ikke finde placeringen. Prøv et postnummer, eller spring over.</p>
            )}

            <button type="button" onClick={() => setStep('omraader')} className="w-full text-sm text-muted-foreground hover:text-foreground py-1">
              Spring over — jeg tilføjer det senere
            </button>
          </div>
        </StepBody>
      )}

      {/* 4 — DYRKNINGSOMRÅDER */}
      {step === 'omraader' && (
        <StepBody title="Hvad dyrker du mest?" sub="Vælg gerne flere. Det hjælper Potalot med at foreslå det rigtige.">
          <div className="flex flex-wrap gap-2">
            {OMRAADER.map(o => (
              <OptionPill key={o.id} label={o.label} selected={growingAreas.includes(o.id)} onClick={() => toggleArea(o.id)} />
            ))}
          </div>
          <Button className="w-full mt-5" onClick={() => setStep('profil')}>
            Fortsæt <ArrowRight className="h-4 w-4" />
          </Button>
        </StepBody>
      )}

      {/* 5 — DYRKERPROFIL */}
      {step === 'profil' && (
        <StepBody title="Din dyrkerprofil" sub="Den styrer bl.a. hvor mange påmindelser du får. Du kan altid skifte den senere.">
          <div className="space-y-2.5">
            {PROFILER.map(p => (
              <button key={p.id} type="button"
                onClick={() => { setGrowerProfile(p.id); setStep('saeson') }}
                className={cn('w-full flex items-start gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors',
                  growerProfile === p.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50')}>
                <span className="text-2xl leading-none mt-0.5" aria-hidden>{p.emoji}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">{p.title}</p>
                  <p className="text-xs italic text-muted-foreground mt-0.5">“{p.tagline}”</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </StepBody>
      )}

      {/* 6 — MIDT I SÆSONEN */}
      {step === 'saeson' && (
        <StepBody title="Hvor langt er du?" sub="Så møder Potalot dig, hvor du er lige nu.">
          <div className="space-y-2.5">
            <OptionRow label="Jeg starter nu" desc="Blank tavle — vi bygger haven op sammen." onClick={() => { setSeasonStatus('starter'); setStep('klar') }} disabled={pending} />
            <OptionRow label="Jeg er godt i gang" desc="Jeg har allerede planter, frø eller noter — hjælp mig med at få dem ind." onClick={() => { setSeasonStatus('igang'); tilImport() }} disabled={pending} />
            <OptionRow label="Jeg er flere måneder inde" desc="Haven kører — jeg vil bare have overblik fremover." onClick={() => { setSeasonStatus('flere_maaneder'); setStep('klar') }} disabled={pending} />
          </div>
          {pending && <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Gemmer dine valg…</p>}
        </StepBody>
      )}

      {/* 6b — IMPORT (V1B-shell). Sætter selv onboarded ved sin afslutning. */}
      {step === 'import' && (
        <div className="-mt-2">
          <OnboardingShell
            gardenLocations={gardenLocations}
            existingNames={existingNames}
            plantCount={plantCount}
            seedCount={seedCount}
          />
        </div>
      )}

      {/* 7 — KLAR */}
      {step === 'klar' && (
        <div className="text-center space-y-5">
          <div className="flex justify-center"><Sprout className="h-10 w-10 text-primary" /></div>
          <h1 className="text-2xl font-serif text-foreground">Så er du klar</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Jo mere du dyrker, observerer og høster, desto mere vokser Potalot med dig.
            Nyt indhold og nye funktioner dukker op undervejs, når de bliver relevante for din have.
          </p>
          <Button className="w-full" onClick={afslutFinal} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gå til min have'}
          </Button>
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
