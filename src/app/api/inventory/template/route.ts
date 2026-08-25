import * as XLSX from 'xlsx'
import type { TemplateColumn } from '@/lib/inventory-import-merge'

// Skabelonen er samtidig dokumentationen: hver kolonne her er en kolonne
// importen faktisk læser, og eksempelrækken viser det format der forstås.
// Alt efter "Egne noter" er dyrkningsfakta — udfyld dem kun hvis du selv
// ved bedre end Potalots guide; lader du dem stå tomme, fylder guiden op.
// Kolonner Potalot ikke kender bliver ikke smidt væk i stilhed: de listes
// som "Kolonner uden match" i reviewet, før noget oprettes.
export const COLUMNS: TemplateColumn[] = [
  ['Dansk navn',          'Tomat'],
  ['Latinsk navn',        'Solanum lycopersicum'],
  ['Sort',                'Black Cherry'],
  ['Antal frø',           50],
  ['Købsår',              2026],
  ['Bedst før',           '31.12.2028'],
  ['Mærke / leverandør',  'Nelson Garden'],
  ['Købt her',            'https://example.com'],
  ['Egne noter',          'God spiring sidste år'],
  ['Sås',                 'mar-apr'],
  ['Sådybde',             '5 mm'],
  ['Forkultivering',      'Ja'],
  ['Plant ud',            'maj-jun'],
  ['Høst',                'jul, aug, sep'],
  ['Lys',                 'Fuld sol'],
  ['Vand',                'Regelmæssig'],
  ['Jord',                'Næringsrig, veldrænet'],
  ['Spiretid',            '7-14 dage'],
  ['Spiretemperatur',     '18-22 °C'],
  ['Planteafstand',       '50 cm'],
  ['Rækkeafstand',        '70 cm'],
]

export async function GET() {
  const headers = COLUMNS.map(c => c[0])
  const example = COLUMNS.map(c => c[1])

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 16) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Frøbank')

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="potalot-froebank-skabelon.xlsx"',
    },
  })
}
