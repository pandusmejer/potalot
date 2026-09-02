/**
 * Permanent test af frøposernes afledte status — udløb, brugsrækkefølge
 * og samlet beholdning (opgave 5). Køres af `npm test`.
 *
 * Reglerne er rådgivning, ikke tilstand: intet af det her gemmes i
 * databasen, og Potalot må hellere tie end anbefale noget den ikke har
 * fagligt grundlag for. Derfor testes tavsheden lige så hårdt som
 * anbefalingerne.
 */
import {
  poseStatusForSort,
  erUdloebet,
  erBedstFoerNaer,
  froeTilbageIPose,
  grupperEfterSort,
  beholdningForKort,
  beholdningForPoser,
  beholdningProcent,
  poseInfoForViste,
} from '@/lib/froebank-grupper'
import type { InventoryItem } from '@/lib/types'
import { readFileSync } from 'node:fs'

let bestået = 0
let fejlet = 0
function tjek(navn: string, ok: boolean, detalje?: string) {
  if (ok) {
    bestået++
    console.log(`  ✓ ${navn}`)
  } else {
    fejlet++
    console.log(`  ✗ ${navn}${detalje ? ` — ${detalje}` : ''}`)
  }
}

/** Fast "i dag" så testen ikke skifter resultat over årsskiftet. */
const IDAG = new Date(2026, 7, 24) // 24. august 2026, lokal tid

let n = 0
function pose(p: Partial<InventoryItem> = {}): InventoryItem {
  n++
  return {
    id: p.id ?? `pose-${n}`,
    userId: 'u1',
    name: 'Ært',
    variety: 'Norli',
    primaryCategoryId: 'fro',
    sowingMonths: [],
    plantingOutMonths: [],
    harvestMonths: [],
    growingLocations: [],
    status: 'paa_lager',
    isFavorite: false,
    isPinned: false,
    imageIds: [],
    linkedPlantIds: [],
    sowingDepthMm: null,
    createdAt: `2026-01-${String((n % 27) + 1).padStart(2, '0')}T00:00:00Z`,
    ...p,
  } as InventoryItem
}

/** Hvilken pose fik "Brug denne først"? null når ingen gjorde. */
function brugFoerst(poser: InventoryItem[]): string | null {
  const s = poseStatusForSort(poser, IDAG)
  const valgte = poser.filter((p) => s.get(p.id)!.brugFoerst)
  if (valgte.length > 1) return `FLERE(${valgte.map((v) => v.id).join(',')})`
  return valgte[0]?.id ?? null
}

function main() {
  console.log('\n[Udløb] bedst før-datoen er en kalenderdato')
  {
    tjek('expiry i fortiden → udløbet', erUdloebet('2025-12-31', IDAG))
    tjek('expiry i fremtiden → ikke udløbet', !erUdloebet('2028-12-31', IDAG))
    tjek('expiry = i dag → IKKE udløbet endnu', !erUdloebet('2026-08-24', IDAG))
    tjek('expiry = i går → udløbet', erUdloebet('2026-08-23', IDAG))
    tjek('ingen expiry → ikke udløbet (ukendt ≠ udløbet)', !erUdloebet(null, IDAG))
    // Midnats-fælden: en DATE må ikke blive et UTC-tidspunkt der ryger
    // en dag tilbage i dansk tid.
    const sentPaaDagen = new Date(2026, 7, 24, 23, 59)
    tjek('sent på dagen: expiry = i dag stadig ikke udløbet', !erUdloebet('2026-08-24', sentPaaDagen))
  }

  console.log('\n[Bedst før nærmer sig] filtret bruger datoen, ikke købsåret')
  {
    tjek('bedst før om 3 måneder → nærmer sig', erBedstFoerNaer('2026-11-30', IDAG))
    tjek('bedst før om 11 måneder → nærmer sig', erBedstFoerNaer('2027-07-01', IDAG))
    tjek('bedst før om 2 år → nærmer sig IKKE', !erBedstFoerNaer('2028-08-24', IDAG))
    tjek('allerede udløbet → tæller også med', erBedstFoerNaer('2024-01-01', IDAG))
    // Kernen i 5B: en gammel pose med lang holdbarhed udløber ikke snart,
    // og en pose uden dato gættes der aldrig på.
    tjek('ingen bedst før-dato → matcher aldrig (intet gæt ud fra årgang)',
      !erBedstFoerNaer(null, IDAG) && !erBedstFoerNaer(undefined, IDAG))
    tjek('grænsedagen præcis 12 mdr frem er med', erBedstFoerNaer('2027-08-24', IDAG))
    tjek('dagen efter grænsen er ude', !erBedstFoerNaer('2027-08-25', IDAG))
  }

  console.log('\n[Case 1] to poser, forskellig bedst før')
  {
    const a = pose({ id: 'a', expiryDate: '2026-12-31', seedCount: 10 })
    const b = pose({ id: 'b', expiryDate: '2028-12-31', seedCount: 10 })
    tjek('tidligste udløb bruges først', brugFoerst([a, b]) === 'a')
    tjek('rækkefølgen i input ændrer intet', brugFoerst([b, a]) === 'a')
  }

  console.log('\n[Case 2] én udløbet, én gyldig')
  {
    const a = pose({ id: 'a', expiryDate: '2025-12-31', seedCount: 8 })
    const b = pose({ id: 'b', expiryDate: '2028-12-31', seedCount: 35 })
    const s = poseStatusForSort([a, b], IDAG)
    tjek('den udløbne er markeret udløbet', s.get('a')!.udloebet)
    tjek('den gyldige er ikke markeret udløbet', !s.get('b')!.udloebet)
    tjek('den udløbne får også Brug denne først', s.get('a')!.brugFoerst)
    tjek('den gyldige får det ikke', !s.get('b')!.brugFoerst)
  }

  console.log('\n[Case 3] samme udløb, forskellige årgange')
  {
    const a = pose({ id: 'a', expiryDate: '2027-12-31', purchaseYear: 2023, seedCount: 10 })
    const b = pose({ id: 'b', expiryDate: '2027-12-31', purchaseYear: 2025, seedCount: 10 })
    tjek('ældste årgang afgør', brugFoerst([b, a]) === 'a')
  }

  console.log('\n[Case 4] ingen udløb, forskellige årgange')
  {
    const a = pose({ id: 'a', purchaseYear: 2023, seedCount: 10 })
    const b = pose({ id: 'b', purchaseYear: 2025, seedCount: 10 })
    tjek('ældste årgang bruges først', brugFoerst([b, a]) === 'a')

    // purchase_date er en gyldig kilde til årgang når purchase_year mangler.
    const c = pose({ id: 'c', purchaseDate: '2022-03-14', seedCount: 10 })
    tjek('år fra purchase_date tæller som årgang', brugFoerst([a, c]) === 'c')
  }

  console.log('\n[Case 5] ingen udløb og ingen årgang → tavshed')
  {
    const a = pose({ id: 'a', seedCount: 10 })
    const b = pose({ id: 'b', seedCount: 10 })
    tjek('ingen anbefaling uden fagligt grundlag', brugFoerst([a, b]) === null)

    // Delvist kendt er ikke godt nok: en pose uden årgang kan være
    // ældre end den kendte. Så tier vi hellere.
    const c = pose({ id: 'c', purchaseYear: 2024, seedCount: 10 })
    tjek('kun ÉN pose har årgang → stadig ingen anbefaling', brugFoerst([a, c]) === null)

    // Blandet: kun én pose har udløb, men BEGGE har årgang → årgangen
    // er det kriterium alle poser deler, så den afgør.
    const e = pose({ id: 'e', purchaseYear: 2020, seedCount: 10 })
    const f = pose({ id: 'f', purchaseYear: 2019, expiryDate: '2029-01-01', seedCount: 5 })
    tjek('kun én har udløb, men begge har årgang → ældste årgang vinder',
      brugFoerst([f, e]) === 'f' && brugFoerst([e, f]) === 'f')

    // Kun én har udløb OG kun én har årgang → intet fælles kriterium.
    const d = pose({ id: 'd', expiryDate: '2027-01-01', seedCount: 10 })
    tjek('intet fælles kriterium → tavshed', brugFoerst([d, a]) === null)
  }

  console.log('\n[Case 6] tre poser → præcis én anbefaling')
  {
    const a = pose({ id: 'a', expiryDate: '2027-06-01', seedCount: 10 })
    const b = pose({ id: 'b', expiryDate: '2026-06-01', seedCount: 10 })
    const c = pose({ id: 'c', expiryDate: '2029-06-01', seedCount: 10 })
    const s = poseStatusForSort([a, b, c], IDAG)
    const antal = [a, b, c].filter((p) => s.get(p.id)!.brugFoerst).length
    tjek('præcis én pose får mærkatet', antal === 1)
    tjek('og det er den med tidligste udløb', s.get('b')!.brugFoerst)
  }

  console.log('\n[Case 7] tom pose kan ikke bruges først')
  {
    const tom = pose({ id: 'tom', expiryDate: '2025-01-01', seedCount: 0 })
    const fuld = pose({ id: 'fuld', expiryDate: '2028-01-01', seedCount: 30 })
    const s = poseStatusForSort([tom, fuld], IDAG)
    tjek('den tomme springes over trods tidligste udløb', !s.get('tom')!.brugFoerst)
    tjek('næste brugbare pose anbefales i stedet', s.get('fuld')!.brugFoerst)
    tjek('den tomme er stadig markeret udløbet (den skjules ikke)', s.get('tom')!.udloebet)

    // Anna-data: Ært · Hurst Green Shaft — 0 frø uden årgang + 30 frø fra 2024.
    const annaTom = pose({ id: 'anna-tom', supplier: 'Frøspiren', seedCount: 0 })
    const annaFuld = pose({ id: 'anna-fuld', supplier: 'Frøsnapperen', purchaseYear: 2024, seedCount: 30 })
    tjek('ægte data: den fyldte pose anbefales', brugFoerst([annaTom, annaFuld]) === 'anna-fuld')

    // Alle poser tomme → ingen at anbefale.
    const tom2 = pose({ id: 'tom2', purchaseYear: 2024, seedCount: 0 })
    const tom3 = pose({ id: 'tom3', purchaseYear: 2025, seedCount: 0 })
    tjek('alle poser tomme → ingen anbefaling', brugFoerst([tom2, tom3]) === null)
  }

  console.log('\n[Case 8] én pose → aldrig Brug denne først')
  {
    const a = pose({ id: 'a', expiryDate: '2025-01-01', seedCount: 10 })
    const s = poseStatusForSort([a], IDAG)
    tjek('ingen anbefaling når der kun er én pose', !s.get('a')!.brugFoerst)
    tjek('men Udløbet vises stadig', s.get('a')!.udloebet)
  }

  console.log('\n[Case 9] sortens samlede beholdning')
  {
    const a = pose({ id: 'a', seedCount: 7, purchaseYear: 2024 })
    const b = pose({ id: 'b', seedCount: 24, purchaseYear: 2025 })
    const g = grupperEfterSort([a, b])
    tjek('én gruppe', g.length === 1)
    tjek('7 + 24 = 31 frø', g[0].froeTilbage === 31)
    tjek('2 poser', g[0].antalPoser === 2)

    // Sået fra den ene pose trækker fra på sortens total.
    const c = pose({ id: 'c', seedCount: 10, seedsSown: 4, seedsRemaining: 6 })
    const d = pose({ id: 'd', seedCount: 5 })
    tjek('sået trækkes fra: 6 + 5 = 11', grupperEfterSort([c, d])[0].froeTilbage === 11)
  }

  console.log('\n[Case 11] udløbet ≠ tom')
  {
    const a = pose({ id: 'a', expiryDate: '2024-01-01', seedCount: 8 })
    const b = pose({ id: 'b', expiryDate: '2028-01-01', seedCount: 35 })
    const g = grupperEfterSort([a, b])
    tjek('udløbne frø tæller stadig med: 8 + 35 = 43', g[0].froeTilbage === 43)
    tjek('den udløbne poses eget antal er uændret 8', froeTilbageIPose(a) === 8)
  }

  console.log('\n[Case 12] ukendt beholdning er ikke nul')
  {
    const ukendt = pose({ id: 'ukendt' })
    const tom = pose({ id: 'tom', seedCount: 0 })
    tjek('seed_count = null → null (ukendt)', froeTilbageIPose(ukendt) === null)
    tjek('seed_count = 0 → 0 (tom)', froeTilbageIPose(tom) === 0)

    const kendt = pose({ id: 'kendt', seedCount: 12 })
    tjek('gruppens total springer ukendt over: 12', grupperEfterSort([ukendt, kendt])[0].froeTilbage === 12)
    tjek('kun ukendte poser → gruppens total er null, ikke 0',
      grupperEfterSort([ukendt, pose({ id: 'ukendt2' })])[0].froeTilbage === null)

    // Ukendt antal betyder ikke tom: posen må gerne anbefales.
    const u = pose({ id: 'u', purchaseYear: 2020 })
    const k = pose({ id: 'k', purchaseYear: 2025, seedCount: 40 })
    tjek('pose med ukendt antal kan stadig anbefales først', brugFoerst([u, k]) === 'u')
  }

  console.log('\n[Cirkel-tæller] tal og grafik læser samme regnestykke')
  {
    // Regressionen: ringen brugte `total > 0` som betingelse, så en TOM
    // pose (0 frø) faldt i "ukendt oprindeligt antal"-grenen og blev
    // tegnet 65 % fuld under tallet 0.
    const tom = pose({ id: 'tom', seedCount: 0 })
    tjek('0 frø → ringen er tom (0 %), ikke den neutrale 65 %',
      beholdningProcent(beholdningForKort(tom)) === 0)

    // Ukendt oprindeligt antal er det ENESTE grundlag for en neutral ring.
    const ukendt = pose({ id: 'ukendt' })
    tjek('ukendt antal → intet grundlag (null)',
      beholdningProcent(beholdningForKort(ukendt)) === null)

    // Sået trækkes fra i BÅDE tallet og ringens grundlag.
    const saaet = pose({ id: 'saaet', seedCount: 8, seedsSown: 2, seedsRemaining: 6 })
    const b = beholdningForKort(saaet)
    tjek('6 tilbage af 8', b.tilbage === 6 && b.iAlt === 8)
    tjek('ringen fyldes 75 %', beholdningProcent(b) === 75)

    // Kortet har ingen egen matematik: samme funktion for 1 og for mange poser.
    tjek('kortets beholdning = beholdningForPoser for én pose',
      JSON.stringify(beholdningForKort(saaet)) === JSON.stringify(beholdningForPoser([saaet])))

    // Ringen kan aldrig sige noget andet end tallet.
    for (const [tilbage, iAlt, forventet] of [[0, 0, 0], [0, 30, 0], [18, 20, 90], [30, 30, 100]] as const) {
      tjek(`${tilbage} af ${iAlt} → ${forventet} %`,
        beholdningProcent({ tilbage, iAlt }) === forventet)
    }
  }

  console.log('\n[Cirkel-tæller] flere poser af samme sort')
  {
    // Produktionsdata: Squash Eight Ball ligger i tre poser — 10 frø,
    // 8 med 2 sået, og 2. Sorten har 18 frø tilbage af oprindeligt 20.
    // 'Eight Ball' og 'Eight Ball F1' er samme sort (kanonisk alias).
    const p1 = pose({ id: 'p1', name: 'Squash', variety: 'Eight Ball', seedCount: 10 })
    const p2 = pose({ id: 'p2', name: 'Squash', variety: 'Eight Ball F1', seedCount: 8, seedsSown: 2, seedsRemaining: 6 })
    const p3 = pose({ id: 'p3', name: 'Squash', variety: 'Eight Ball F1', seedCount: 2 })
    const alle = [p1, p2, p3]
    const kanoniske = grupperEfterSort(alle)
    tjek('tre poser = én sort', kanoniske.length === 1 && kanoniske[0].antalPoser === 3)

    const info = poseInfoForViste(kanoniske, [p1])
    const kort = beholdningForKort(p1, info.get('p1'))
    tjek('kortet viser sortens 18 frø, ikke posens 10', kort.tilbage === 18)
    tjek('ringens maksimum er sortens 20, ikke posens 10', kort.iAlt === 20)
    tjek('ringen fyldes 90 %', beholdningProcent(kort) === 90)

    // Regressionen: grupperingen skete på den FILTREREDE liste, så et
    // filter der skjulte to af poserne fik kortet til at vise 10 frø og
    // tabe "3 poser". Filtre må skjule mapper — ikke ændre antallet.
    const filtreret = [p3] // fx "mangler billede" rammer kun én pose
    const efterFilter = poseInfoForViste(kanoniske, filtreret)
    const kortEfterFilter = beholdningForKort(p3, efterFilter.get('p3'))
    tjek('filtreret visning viser stadig sortens 18 frø', kortEfterFilter.tilbage === 18)
    tjek('filtreret visning viser stadig "3 poser"', efterFilter.get('p3')!.antalPoser === 3)
    tjek('grupperet på den filtrerede liste ville have vist 2 frø',
      grupperEfterSort(filtreret)[0].froeTilbage === 2)

    // Ukendt antal i én pose gør ikke sorten ukendt — og tælles ikke som 0.
    const p4 = pose({ id: 'p4', name: 'Squash', variety: 'Eight Ball' })
    const medUkendt = grupperEfterSort([...alle, p4])
    tjek('pose uden antal springes over: stadig 18 af 20',
      medUkendt[0].froeTilbage === 18 && medUkendt[0].froeIAlt === 20)

    // Én pose pr. sort → ingen poseoplysninger, kortet er uændret.
    tjek('sort med én pose får ingen PoseInfo',
      poseInfoForViste(grupperEfterSort([p1]), [p1]).size === 0)
  }

  console.log('\n[Detaljeside] sort med flere poser — to niveauer, to tal')
  {
    // Samme Squash Eight Ball. Oversigtskortet viser SORTENS 18; åbner man
    // et kort, lander man på ÉN pose (kortet linker til gruppens hoved), og
    // heroen viser den poses eget tal. Begge er rigtige — derfor skal
    // niveauet stå i UI'et, ikke gættes af brugeren.
    const p1 = pose({ id: 'p1', name: 'Squash', variety: 'Eight Ball', seedCount: 10 })
    const p2 = pose({ id: 'p2', name: 'Squash', variety: 'Eight Ball F1', seedCount: 8, seedsSown: 2, seedsRemaining: 6 })
    const p3 = pose({ id: 'p3', name: 'Squash', variety: 'Eight Ball F1', seedCount: 2 })
    const froeposer = [p1, p2, p3]

    // Heroens tal = den ÅBNEDE poses rest, hentet af froeTilbageIPose —
    // ikke af et håndskrevet seedsRemaining ?? seedCount.
    tjek('heroen på pose 1 viser posens 10', froeTilbageIPose(p1) === 10)
    tjek('heroen på pose 2 viser 6 (8 minus 2 sået)', froeTilbageIPose(p2) === 6)

    // Sortens sum på detaljesiden er PRÆCIS kortets — samme funktion.
    const sortens = beholdningForPoser(froeposer)
    tjek('detaljesidens sortssum er kortets 18 af 20',
      sortens.tilbage === 18 && sortens.iAlt === 20)
    tjek('samme ring-procent som kortet: 90 %', beholdningProcent(sortens) === 90)

    // Selve tvetydigheden: posens tal ER et andet end sortens. Så længe det
    // er tilfældet, SKAL heroen sige hvilket niveau den taler om.
    tjek('posens tal ≠ sortens tal → niveauet skal stå i UI\'et',
      froeTilbageIPose(p1) !== sortens.tilbage)

    // Én pose: de to niveauer falder sammen, og siden er uændret.
    const enPose = beholdningForPoser([p1])
    tjek('sort med én pose: pose = sort, ingen niveaumarkør nødvendig',
      enPose.tilbage === froeTilbageIPose(p1))

    // Ukendt ≠ 0, og 0 ≠ ukendt — på begge niveauer.
    const uden = pose({ id: 'p9', name: 'Squash', variety: 'Eight Ball' })
    tjek('pose uden antal: heroen viser ingenting (null), ikke 0',
      froeTilbageIPose(uden) === null)
    const tom = pose({ id: 'p0', name: 'Squash', variety: 'Eight Ball', seedCount: 4, seedsSown: 4, seedsRemaining: 0 })
    tjek('tom pose: heroen viser 0', froeTilbageIPose(tom) === 0)
    tjek('tom sort giver tom ring, ikke neutral',
      beholdningProcent(beholdningForPoser([tom])) === 0)
    tjek('sort uden tal giver null (neutral ring), ikke 0',
      beholdningProcent(beholdningForPoser([uden])) === null)
  }

  console.log('\n[Detaljeside] kilden bruger den fælles beregning')
  {
    // Vagt mod at regnestykket bliver skrevet i hånden igen: det var netop
    // et inline `seedsRemaining ?? seedCount` i heroen, der kunne sige noget
    // andet end frøkortets ring.
    const kilde = readFileSync('src/app/(app)/froebank/[id]/page.tsx', 'utf-8')
    tjek('detaljesiden har ingen egen beholdnings-matematik',
      !/seedsRemaining\s*\?\?\s*item\.seedCount/.test(kilde))
    tjek('detaljesiden bruger froeTilbageIPose', kilde.includes('froeTilbageIPose(item)'))
    tjek('sortens sum kommer fra beholdningForPoser',
      kilde.includes('beholdningForPoser(froeposer)'))
    tjek('heroen mærker niveauet, når sorten har flere poser',
      kilde.includes('Tilbage i denne pose'))
  }

  console.log('\n[Stabilitet] samme input → samme svar')
  {
    const a = pose({ id: 'a', expiryDate: '2027-01-01', purchaseYear: 2024, seedCount: 10, createdAt: '2026-01-01T00:00:00Z' })
    const b = pose({ id: 'b', expiryDate: '2027-01-01', purchaseYear: 2024, seedCount: 10, createdAt: '2026-02-01T00:00:00Z' })
    tjek('alt ens → ældst oprettede vinder, uanset rækkefølge',
      brugFoerst([a, b]) === 'a' && brugFoerst([b, a]) === 'a')
  }

  console.log(`\n${fejlet === 0 ? '✅' : '❌'}  frøposer: ${bestået} bestået, ${fejlet} fejlet\n`)
  if (fejlet > 0) process.exit(1)
}

main()
