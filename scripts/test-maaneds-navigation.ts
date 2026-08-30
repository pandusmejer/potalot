/**
 * Månedsskift — måned OG år. Året er input til en SKRIVNING (KAL-0114:
 * opgaveDatoForGoeremaal dater nye opgaver i den viste måned og det viste
 * år), så et forkert årsskifte skriver opgaver i det forkerte år.
 */

import { skiftTilMaaned, naesteMaaned, forrigeMaaned } from '@/lib/kalender/maaneds-navigation'

let bestaaet = 0, fejlet = 0
function tjek(navn: string, faktisk: unknown, forventet: unknown) {
  const ok = JSON.stringify(faktisk) === JSON.stringify(forventet)
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}\n      forventet: ${JSON.stringify(forventet)}\n      faktisk:   ${JSON.stringify(faktisk)}`) }
}

console.log('\n[Nytår begge veje]')
tjek('december 2026 → januar = 2027', skiftTilMaaned({ month: 12, year: 2026 }, 1), { month: 1, year: 2027 })
tjek('januar 2026 → december = 2025', skiftTilMaaned({ month: 1, year: 2026 }, 12), { month: 12, year: 2025 })

console.log('\n[Almindelige skift — året står stille]')
tjek('august → september', skiftTilMaaned({ month: 8, year: 2026 }, 9), { month: 9, year: 2026 })
tjek('september → august', skiftTilMaaned({ month: 9, year: 2026 }, 8), { month: 8, year: 2026 })
tjek('januar → februar', skiftTilMaaned({ month: 1, year: 2026 }, 2), { month: 2, year: 2026 })
tjek('december → november', skiftTilMaaned({ month: 12, year: 2026 }, 11), { month: 11, year: 2026 })

console.log('\n[Rundtur: 12 skridt frem lander samme måned, ét år senere]')
let v = { month: 8, year: 2026 }
for (let i = 0; i < 12; i++) v = skiftTilMaaned(v, naesteMaaned(v.month))
tjek('august 2026 + 12 skridt = august 2027', v, { month: 8, year: 2027 })

console.log('\n[Rundtur baglæns: tilbage til udgangspunktet]')
for (let i = 0; i < 12; i++) v = skiftTilMaaned(v, forrigeMaaned(v.month))
tjek('og 12 skridt tilbage = august 2026', v, { month: 8, year: 2026 })

console.log('\n[Nabo-hjælperne]')
tjek('naesteMaaned(12) = 1', naesteMaaned(12), 1)
tjek('forrigeMaaned(1) = 12', forrigeMaaned(1), 12)
tjek('naesteMaaned(8) = 9', naesteMaaned(8), 9)
tjek('forrigeMaaned(8) = 7', forrigeMaaned(8), 7)

console.log(`\n${fejlet === 0 ? '✅' : '❌'}  månedsnavigation: ${bestaaet} bestået, ${fejlet} fejlet`)
if (fejlet > 0) process.exit(1)
