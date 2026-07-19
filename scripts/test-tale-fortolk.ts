/**
 * Permanent test af tale-fortolkerens rene logik — de låste v1-beslutninger
 * (Docs/product/diktafon-v1-implementering.md, 2.1–2.5). Køres af `npm test`.
 *
 * Tester den I/O-frie kerne (`fortolkRåSvar`) med håndlavede "modelsvar" +
 * `byggForslag`s tom-transskription-genvej. Ingen netværk/auth/mikrofon.
 * Reglerne er for kritiske til kun at være verificeret én gang i en scratch-fil.
 */
import { fortolkRåSvar, byggForslag, type FortolkPlante } from '@/lib/tale-fortolk'

const plants: FortolkPlante[] = [
  { id: 'p1', name: 'Tomat', variety: 'San Marzano' },
  { id: 'p2', name: 'Agurk', variety: null },
]

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
const J = (o: unknown) => JSON.stringify(o)

async function main() {
  console.log('\n[2.5] Zod-validering · tom vs. malformet')
  {
    const tom = fortolkRåSvar(J({ forslag: [] }), plants)
    tjek('tom forslag-liste → ok:true, items:[]', tom.ok === true && tom.forslag.length === 0)

    // byggForslag-genvej: tom transskription → ok:[] UDEN modelkald (ingen netværk).
    const tomTranscript = await byggForslag({ transcript: '   ', plants, ankerDato: '2026-07-18' })
    tjek('byggForslag(tom transskription) → ok:true, items:[]', tomTranscript.ok === true && tomTranscript.ok && tomTranscript.forslag.length === 0)

    const skrald = fortolkRåSvar('det her er ikke json', plants)
    tjek('ikke-JSON → ok:false (trigger for INTERPRETATION_INVALID)', skrald.ok === false)

    const manglerFelt = fortolkRåSvar(J({ forslag: [{ type: 'observation', text: 'x' }] }), plants)
    tjek('manglende sourceText → ok:false', manglerFelt.ok === false)

    const tomText = fortolkRåSvar(J({ forslag: [{ type: 'note', text: '', sourceText: 'y', plantId: null, dato: null }] }), plants)
    tjek('tom text-streng → ok:false', tomText.ok === false)

    const ugyldigType = fortolkRåSvar(J({ forslag: [{ type: 'gibberish', text: 'a', sourceText: 'b', plantId: null, dato: null }] }), plants)
    tjek('ukendt type-enum afvises → ok:false', ugyldigType.ok === false)

    const forMange = fortolkRåSvar(J({ forslag: Array.from({ length: 4 }, () => ({ type: 'note', text: 'a', sourceText: 'b', plantId: null, dato: null })) }), plants)
    tjek('>3 forslag → ok:false (max 3)', forMange.ok === false)
  }

  console.log('\n[2.1] text = ryddet visning · sourceText = ordret')
  {
    const r = fortolkRåSvar(J({ forslag: [{ type: 'opgave', text: 'Så mere salat næste tirsdag', sourceText: 'og så skal jeg altså også lige huske at så noget mere salat næste tirsdag', plantId: null, dato: '2026-07-21' }] }), plants)
    const f = r.ok ? r.forslag[0] : null
    tjek('text bevaret som visningsform', !!f && f.text === 'Så mere salat næste tirsdag')
    tjek('evidence.sourceText bevaret ordret', !!f && f.evidence.sourceText === 'og så skal jeg altså også lige huske at så noget mere salat næste tirsdag')
  }

  console.log('\n[null-frem-for-gæt] ingen plante/sygdom opfindes')
  {
    const ukendt = fortolkRåSvar(J({ forslag: [{ type: 'observation', text: 'ser træt ud', sourceText: 'den ser træt ud', plantId: 'pX', dato: null }] }), plants)
    const f1 = ukendt.ok ? ukendt.forslag[0] : null
    tjek('ukendt plantId → null (opfinder ikke plante)', !!f1 && f1.plantId === null && f1.plantNavn === null)

    // Guardrail: et "problem" (sygdom) med opdigtet plante må ikke knyttes til en plante.
    const opfundetSygdom = fortolkRåSvar(J({ forslag: [{ type: 'problem', text: 'meldug', sourceText: 'der er meldug', plantId: 'p99', dato: null }] }), plants)
    const f2 = opfundetSygdom.ok ? opfundetSygdom.forslag[0] : null
    tjek('problem m. opdigtet plante → plantId null (opfinder ikke kobling)', !!f2 && f2.plantId === null)

    const kendt = fortolkRåSvar(J({ forslag: [{ type: 'observation', text: 'ser træt ud', sourceText: 'tomaterne ser trætte ud', plantId: 'p1', dato: null }] }), plants)
    const f3 = kendt.ok ? kendt.forslag[0] : null
    tjek('kendt plantId → bevaret + plantNavn sat', !!f3 && f3.plantId === 'p1' && f3.plantNavn === 'Tomat San Marzano')
  }

  console.log('\n[2.5] ISO-datoer, aldrig relative strenge')
  {
    const relativ = fortolkRåSvar(J({ forslag: [{ type: 'opgave', text: 'vand', sourceText: 'vand næste uge', plantId: null, dato: 'næste uge' }] }), plants)
    const f1 = relativ.ok ? relativ.forslag[0] : null
    tjek('relativ streng "næste uge" → null (aldrig gemt råt)', !!f1 && f1.dato === null)

    const iso = fortolkRåSvar(J({ forslag: [{ type: 'opgave', text: 'vand', sourceText: 'vand på tirsdag', plantId: null, dato: '2026-07-21' }] }), plants)
    const f2 = iso.ok ? iso.forslag[0] : null
    tjek('gyldig ISO-dato på opgave → bevaret', !!f2 && f2.dato === '2026-07-21')

    const nonTask = fortolkRåSvar(J({ forslag: [{ type: 'observation', text: 'blomstrer', sourceText: 'den blomstrer', plantId: 'p1', dato: '2026-07-21' }] }), plants)
    const f3 = nonTask.ok ? nonTask.forslag[0] : null
    tjek('dato på ikke-opgave type → null (kun opgaver har dato)', !!f3 && f3.dato === null)
  }

  console.log('\n[2.2] 7 typer · escape-hatch note smider intet væk')
  {
    let alleOk = true
    const typer = ['observation', 'opgave', 'hoest', 'problem', 'minde', 'naeste_saeson', 'note']
    for (const t of typer) {
      const rr = fortolkRåSvar(J({ forslag: [{ type: t, text: 't', sourceText: 's', plantId: null, dato: null }] }), plants)
      if (!(rr.ok && rr.forslag[0].type === t)) { alleOk = false; console.log(`     (type ${t} fejlede)`) }
    }
    tjek('alle 7 typer accepteres', alleOk)

    // "Meningsfuldt segment må ikke smides væk": et note-segment bevares som forslag.
    const blandet = fortolkRåSvar(J({ forslag: [
      { type: 'hoest', text: 'Første agurk', sourceText: 'første agurk plukket', plantId: 'p2', dato: null },
      { type: 'note', text: 'Sikke en dejlig dag i haven', sourceText: 'sikke en dejlig dag i haven i dag', plantId: null, dato: null },
    ] }), plants)
    const noteBevaret = blandet.ok && blandet.forslag.length === 2 && blandet.forslag.some(f => f.type === 'note' && f.text === 'Sikke en dejlig dag i haven')
    tjek('ukategoriserbart segment bevares som note (droppes ikke stille)', noteBevaret)
  }

  console.log('\n[2.5] én kontrolleret reparationsrunde (byggForslag m. injiceret modelkald)')
  {
    const godtSvar = J({ forslag: [{ type: 'note', text: 'x', sourceText: 'x', plantId: null, dato: null }] })

    // Reparation lykkes: 1. svar malformet, 2. svar gyldigt → ok, præcis 2 kald.
    let n1 = 0
    const r1 = await byggForslag({
      transcript: 'noget', plants, ankerDato: '2026-07-18',
      _kald: async () => { n1++; return n1 === 1 ? 'ikke json' : godtSvar },
    })
    tjek('malformet→reparation→gyldigt: ok:true', r1.ok === true && r1.ok && r1.forslag.length === 1)
    tjek('reparationen kalder modellen præcis 2 gange', n1 === 2)

    // Begge malformede → INTERPRETATION_INVALID, og KUN én reparation (2 kald i alt).
    let n2 = 0
    const r2 = await byggForslag({
      transcript: 'noget', plants, ankerDato: '2026-07-18',
      _kald: async () => { n2++; return 'stadig ikke json' },
    })
    tjek('2× malformet → INTERPRETATION_INVALID', !r2.ok && r2.code === 'INTERPRETATION_INVALID')
    tjek('kun ÉN reparation: 2 kald i alt, ikke flere', n2 === 2)

    // Gyldigt 1. forsøg → ingen unødig reparation (1 kald).
    let n3 = 0
    const r3 = await byggForslag({
      transcript: 'noget', plants, ankerDato: '2026-07-18',
      _kald: async () => { n3++; return godtSvar },
    })
    tjek('gyldigt 1. forsøg → 1 kald (ingen unødig reparation)', r3.ok === true && n3 === 1)
  }

  console.log(`\n${fejlet === 0 ? '✅' : '❌'}  tale-fortolk: ${bestået} bestået, ${fejlet} fejlet\n`)
  if (fejlet > 0) process.exit(1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
