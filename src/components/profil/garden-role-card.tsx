import { Card, CardContent } from '@/components/ui/card'
import { Emblem } from '@/components/ui/emblem'
import { GARDEN_ROLES, ROLE_ORDER, type RoleProgress } from '@/lib/garden-roles'
import { BADGE_CATEGORY_LABELS } from '@/lib/badges-shared'
import { cn } from '@/lib/utils'
import { Check, Sprout, Leaf, TreePine, Package, Shield, Crown } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

const ROLE_ICON_MAP: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Sprout, Leaf, TreePine, Package, Shield, Crown,
}

/**
 * Stor præsentations-card til /profil der viser brugerens nuværende
 * haverolle, samt en lille progression-stige mod næste rolle.
 *
 * Tonen: rolig diplom-følelse, ikke level-up-banner.
 */
export function GardenRoleCard({ progress }: { progress: RoleProgress }) {
  const current = GARDEN_ROLES[progress.currentRole]
  const next = progress.nextRole ? GARDEN_ROLES[progress.nextRole] : null
  const missing = progress.missingForNext

  return (
    <Card className="bg-gradient-to-br from-secondary/30 to-card border-secondary/50 overflow-hidden relative">
      <div className="absolute inset-0 bg-pattern-botanical opacity-25 pointer-events-none" />
      <CardContent className="relative py-5">
        <div className="flex items-start gap-4">
          <Emblem
            icon={current.icon}
            category="dyrkning"
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Din haverolle
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground mt-0.5">
              {current.label}
            </h2>
            <p className="text-sm text-foreground/80 mt-1 italic max-w-md leading-relaxed">
              {current.description}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              {progress.totalBadges === 1
                ? '1 optjent badge'
                : `${progress.totalBadges} optjente badges`}
            </p>
          </div>
        </div>

        {/* Progression-stige med rolle-ikoner i stedet for tal */}
        <div className="mt-5 pt-4 border-t border-border/60">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Din udviklingsstige
          </p>
          <div className="flex items-center justify-between gap-2 overflow-x-auto -mx-1 px-1">
            {ROLE_ORDER.map((roleId, i) => {
              const role = GARDEN_ROLES[roleId]
              const currentIdx = ROLE_ORDER.indexOf(progress.currentRole)
              const passed = i < currentIdx
              const isCurrent = i === currentIdx
              const isNext = next && roleId === next.id
              const RoleIcon = ROLE_ICON_MAP[role.icon] ?? Sprout
              return (
                <div key={roleId} className="flex flex-col items-center gap-1 min-w-[52px] shrink-0">
                  <div
                    className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center border-2 transition-colors',
                      // Rolle-stige bruger amber/gylden palette — "diplom"-følelse,
                      // skiller den visuelt fra plante-stadie-stigen som er grøn (vækst)
                      passed && 'bg-amber-700 border-amber-700 text-amber-50',
                      isCurrent && 'bg-amber-100 border-amber-700 text-amber-900 ring-2 ring-amber-300 ring-offset-2 ring-offset-card',
                      !passed && !isCurrent && isNext && 'bg-amber-50/70 border-amber-400 text-amber-700',
                      !passed && !isCurrent && !isNext && 'bg-muted border-border text-muted-foreground/70',
                    )}
                    title={role.description}
                  >
                    {passed ? <Check className="h-3.5 w-3.5" /> : <RoleIcon className="h-3.5 w-3.5" />}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] text-center whitespace-nowrap',
                      isCurrent && 'font-semibold text-foreground',
                      !isCurrent && 'text-muted-foreground',
                    )}
                  >
                    {role.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hvad mangler du til næste rolle */}
        {next && missing && (
          <div className="mt-3 rounded-lg bg-card/60 border border-border/60 p-3">
            <p className="text-xs text-foreground">
              Næste rolle: <strong className="font-serif text-base">{next.label}</strong>
            </p>
            <p className="text-xs text-muted-foreground italic mt-0.5">{next.description}</p>
            {/* Hele sætninger pr. tilstand — aldrig fragment-sammensætning
                (Anna NAV-0334). Alt opfyldt → ingen "mangler"-tekst. */}
            {(() => {
              const katListe = Object.entries(missing.categoryMissing).map(
                ([cat, n]) =>
                  `${n} fra ${BADGE_CATEGORY_LABELS[cat as keyof typeof BADGE_CATEGORY_LABELS]}`,
              )
              const kat = katListe.join(', ')
              const tekst =
                missing.badgesNeeded > 0 && katListe.length > 0
                  ? `Du mangler ${missing.badgesNeeded} ${missing.badgesNeeded === 1 ? 'badge' : 'badges'}, heraf ${kat}.`
                  : missing.badgesNeeded > 0
                    ? `Du mangler ${missing.badgesNeeded} ${missing.badgesNeeded === 1 ? 'badge' : 'badges'} for at nå næste rolle.`
                    : katListe.length > 0
                      ? `Du har badges nok. Du mangler ${kat}.`
                      : null
              return tekst ? (
                <p className="text-[11px] text-muted-foreground mt-2">{tekst}</p>
              ) : null
            })()}
          </div>
        )}

        {!next && (
          <p className="text-xs text-muted-foreground italic mt-3 text-center">
            Du har nået toppen af stigen. Mere et erfaringspunkt end en milepæl.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
