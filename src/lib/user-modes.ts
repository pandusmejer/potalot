/**
 * Brugertype-modes (relaunch spec).
 *
 * Styrer:
 * - Antal notifikationer
 * - Antal motor-forslag per dag
 * - Kompleksitet i UI (fremtidig)
 */

export type UserMode = 'maalrettet' | 'afslappet' | 'minimal'

export interface ModeIndstillinger {
  label: string
  beskrivelse: string
  maxMotorForslag: number        // Max motor-forslag vist per dag
  notifikationer: boolean        // Push-notifikationer tilladt
  dagligOpsummering: boolean     // Dagligt resumé
  badgeTællere: boolean          // Vis antal-badges (fx "3 opgaver")
}

export const MODES: Record<UserMode, ModeIndstillinger> = {
  maalrettet: {
    label: 'Målrettet',
    beskrivelse: 'For dig der vil have alt. Påmindelser, forslag, overblik.',
    maxMotorForslag: 10,
    notifikationer: true,
    dagligOpsummering: true,
    badgeTællere: true,
  },
  afslappet: {
    label: 'Afslappet',
    beskrivelse: 'Balanceret — roligt tempo, forslag uden pres.',
    maxMotorForslag: 5,
    notifikationer: true,
    dagligOpsummering: true,
    badgeTællere: false,
  },
  minimal: {
    label: 'Minimal',
    beskrivelse: 'Ingen notifikationer. Kun hvis du selv spørger.',
    maxMotorForslag: 0,
    notifikationer: false,
    dagligOpsummering: false,
    badgeTællere: false,
  },
}

/**
 * Hent aktuel modes-indstillinger for en profil.
 * Defaulter til 'afslappet' hvis ingen mode er sat.
 */
export function hentModeIndstillinger(mode?: string | null): ModeIndstillinger {
  const m = (mode as UserMode) ?? 'afslappet'
  return MODES[m] ?? MODES.afslappet
}
