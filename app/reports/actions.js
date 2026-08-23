import { createClient } from '@/lib/supabase/server'

export async function searchBills({ mode, from, to, billNo, doNo }) {
  const supabase = await createClient()
  let query = supabase.from('bills').select('*, firms(name)').order('id', { ascending: false })

  if (mode === 'bill' && billNo) {
    const id = parseInt(billNo, 10)
    if (isNaN(id)) return []
    query = query.eq('id', id)
  } else if (mode === 'do' && doNo) {
    query = query.eq('do_no', doNo)
  } else if (mode === 'date') {
    if (from) query = query.gte('bill_date', from)
    if (to) query = query.lte('bill_date', to)
  } else {
    return []
  }

  const { data, error } = await query.limit(500)
  if (error) return []
  return data || []
}