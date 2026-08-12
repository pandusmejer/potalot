'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PageHero } from '@/components/ui/page-hero'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { LocationSetting } from '@/components/profil/location-setting'
import { DeleteAccountSection } from '@/components/settings/delete-account'
import type { NotificationPreference } from '@/lib/types'
import { ChevronRight, User, Bell, Sprout, ShieldCheck, MessageCircle } from 'lucide-react'
import { KONTAKT_EMAIL } from '@/lib/contact'

const DEFAULT_PREFS: NotificationPreference = {
  userId: '',
  pushEnabled: true,
  dailyDigestEnabled: true,
  criticalOnly: false,
  quietHours: { start: '20:00', end: '08:00' },
}

export default function IndstillingerPage() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)

  function update<K extends keyof typeof prefs>(key: K, value: (typeof prefs)[K]) {
    setPrefs(p => ({ ...p, [key]: value }))
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHero
        kicker="Opsætning"
        title="Indstillinger"
        subtitle="Profil, notifikationer og brugertype."
      />

      {/* Genvej til profil */}
      <Card>
        <Link href="/profil" className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors rounded-2xl">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Min profil</p>
            <p className="text-xs text-muted-foreground">Navn, e-mail, brugertype</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </Card>

      {/* Få din have ind — genåbnelig import/tilføj (F2) */}
      <Card>
        <Link href="/onboarding/have" className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors rounded-2xl">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sprout className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Få din have ind</p>
            <p className="text-xs text-muted-foreground">Tilføj planter, scan frøposer eller importér en liste</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </Card>

      {/* Havens placering */}
      <LocationSetting />

      {/* Notifikationer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notifikationer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Push-notifikationer"
            description="Modtag påmindelser på din enhed."
            checked={prefs.pushEnabled}
            onChange={v => update('pushEnabled', v)}
          />
          <Toggle
            label="Dagligt resumé"
            description="Få en kort opsummering hver morgen."
            checked={prefs.dailyDigestEnabled}
            onChange={v => update('dailyDigestEnabled', v)}
          />
          <Toggle
            label="Kun kritiske opgaver"
            description="Få kun notifikationer ved sæsonkritiske handlinger (fx frostvarsel)."
            checked={prefs.criticalOnly}
            onChange={v => update('criticalOnly', v)}
          />

          {/* Quiet hours */}
          <div className="border-t border-border pt-3">
            <p className="text-sm font-medium text-foreground mb-2">Stille timer</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Fra</Label>
                <Input
                  type="time"
                  value={prefs.quietHours?.start ?? '20:00'}
                  onChange={e => update('quietHours', { ...prefs.quietHours!, start: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Til</Label>
                <Input
                  type="time"
                  value={prefs.quietHours?.end ?? '08:00'}
                  onChange={e => update('quietHours', { ...prefs.quietHours!, end: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic text-right">
            Dine valg gemmes kun på denne enhed indtil videre.
          </p>
        </CardContent>
      </Card>

      {/* Gartner-kortet ("AI gartner er ikke aktiveret endnu") + Roadmap-kortet
          er FJERNET (Anna NAV-0026-0030): Gartneren er live, og release-
          planlægning hører ikke hjemme mellem reelle indstillinger. */}

      {/* Hjælp og privatliv */}
      <Card>
        <Link href="/privatliv" className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors rounded-2xl">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Privatliv og data</p>
            <p className="text-xs text-muted-foreground">Hvad vi gemmer, brug af AI, og dine rettigheder</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <a
          href={`mailto:${KONTAKT_EMAIL}?subject=${encodeURIComponent('Feedback til Potalot')}`}
          className="flex items-center gap-3 p-4 border-t border-border hover:bg-accent/30 transition-colors rounded-2xl no-underline"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Send feedback eller rapportér en fejl</p>
            <p className="text-xs text-muted-foreground">Vi er tidligt i gang — al hjælp tæller</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </a>
      </Card>

      {/* Konto → Slet konto (F3, GDPR) */}
      <DeleteAccountSection />
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}
