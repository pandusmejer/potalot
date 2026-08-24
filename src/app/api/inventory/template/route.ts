import * as XLSX from 'xlsx'

export async function GET() {
  const headers = [
    'Dansk navn',
    'Latinsk navn',
    'Sort',
    'Antal frø',
    'Købsår',
    'Bedst før',
    'Mærke / leverandør',
    'Købt her',
    'Egne noter',
  ]
  const example = [
    'Tomat',
    'Solanum lycopersicum',
    'Black Cherry',
    50,
    2026,
    '31.12.2028',
    'Nelson Garden',
    'https://example.com',
    'God spiring sidste år',
  ]

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
