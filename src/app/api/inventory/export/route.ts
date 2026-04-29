import * as XLSX from 'xlsx'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const supabase = await createClient()
  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  const { data: counts } = await supabase
    .from('inventory_seed_counts')
    .select('inventory_item_id, seeds_sown, seeds_remaining')
    .eq('user_id', user.id)

  const countMap = new Map(
    (counts ?? []).map((c: { inventory_item_id: string; seeds_sown: number; seeds_remaining: number }) =>
      [c.inventory_item_id, c]
    )
  )

  const rows = (items ?? []).map(i => {
    const c = countMap.get(i.id as string)
    return {
      'Dansk navn': i.name ?? '',
      'Latinsk navn': i.latin_name ?? '',
      'Sort': i.variety ?? '',
      'Antal frø': i.seed_count ?? '',
      'Antal sået': c?.seeds_sown ?? '',
      'Antal tilbage': c?.seeds_remaining ?? '',
      'Købsår': i.purchase_year ?? '',
      'Udløb': i.expiry_date ?? '',
      'Mærke / leverandør': i.supplier ?? '',
      'Købt her': i.purchase_url ?? '',
      'Egne noter': i.notes ?? '',
      'Oprettet': i.created_at?.split('T')[0] ?? '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{
    'Dansk navn': '',
    'Latinsk navn': '',
    'Sort': '',
    'Antal frø': '',
    'Antal sået': '',
    'Antal tilbage': '',
    'Købsår': '',
    'Udløb': '',
    'Mærke / leverandør': '',
    'Købt her': '',
    'Egne noter': '',
    'Oprettet': '',
  }])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Frøbank')

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  const today = new Date().toISOString().split('T')[0]

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="potalot-froebank-${today}.xlsx"`,
    },
  })
}
