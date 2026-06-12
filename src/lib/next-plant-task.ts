/**
 * Estimering af "næste opgave" for en plante.
 *
 * Bruges på plantekortet (NÆSTE-feltet) for at give brugeren et
 * estimat af hvad det næste skridt på vækst-rejsen er — uden at
 * brugeren behøver manuelt at have tilføjet en opgave.
 *
 * Logikken kombinerer plantens nuværende vækststadie (status) med
 * dens alder i dage. Når plant.guideId fremover knyttes til faktisk
 * Guide-data (med GuideCalendarRule-tidslinje), kan denne funktion
 * udvides til at vælge den næste regel relativt til plantens dato-
 * begivenheder (sowingDate / plantingOutDate).
 */
import type { Plant } from './types'
import { dageSiden } from './datetime'

export interface NextTaskEstimate {
  /** Kort handling i imperativ form, fx "Prik ud", "Vand let", "Høst". */
  label: string
}

export function estimateNextTask(plant: Plant): NextTaskEstimate {
  const status = plant.status
  const startDate = plant.sowDate ?? plant.plantingOutDate ?? null
  const age = startDate ? dageSiden(startDate) : null
  return nextTaskFromStatus(status, age)
}

/**
 * Status-baseret estimering. Hvert stadie har en typisk næste opgave;
 * alder forfiner valget hvor det giver mening (fx prikning ca. 2 uger
 * efter spirring; hærdning efter 5 uger i vækst).
 */
function nextTaskFromStatus(
  status: Plant['status'],
  age: number | null,
): NextTaskEstimate {
  switch (status) {
    case 'planlagt':
      // Endnu kun en idé — næste handling er at starte
      return { label: 'Sæt i jord' }
    case 'saaet':
      // Lige sået — venter på spirring, hold fugtigt
      return { label: 'Vand let' }
    case 'spirer':
      // Spiret — prikning kommer typisk 10–21 dage efter såning
      if (age != null && age > 14) return { label: 'Prikl ud' }
      return { label: 'Hold fugtigt' }
    case 'i_vaekst':
      // I aktiv vækst — knibning tidligt, hærdning når den nærmer sig
      // udplantnings-vinduet
      if (age != null && age > 35) return { label: 'Hærd af' }
      return { label: 'Knib top' }
    case 'klar_til_udplantning':
      return { label: 'Plant ud' }
    case 'udplantet':
      // Plantet ud — løbende pleje
      return { label: 'Vand & gød' }
    case 'hoestklar':
      return { label: 'Høst' }
    case 'afsluttet':
      return { label: 'Færdig' }
  }
}
