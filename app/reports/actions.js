'use server'
import { createClient } from '@/lib/supabase/server'
import { ToWords } from 'to-words'
const toWords = new ToWords({ localeCode: 'en-IN' })

export async function getBillDetails(billId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { bill: null, items: [] }
  const [{ data: bill }, { data: items }] = await Promise.all([
    supabase.from('bills').select('*').eq('id', billId).single(),
    supabase.from('bill_items').select('*').eq('bill_id', billId),
  ])
  return { bill, items: items ?? [] }
}

export async function searchBills({ mode, from, to, billNo, doNo }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
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
export async function getBillsForPrint(billIds) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data: bills } = await supabase
    .from('bills')
    .select('*, firms(id, name)')
    .in('id', billIds)

  if (!bills || bills.length === 0) return []

  const { data: items } = await supabase
    .from('bill_items')
    .select('*')
    .in('bill_id', billIds)

  const entries = await Promise.all(
    bills.map(async (bill) => {
      const { data: balanceRows } = await supabase.rpc('get_firm_balance', { p_firm_id: bill.firm_id })
      const row = (balanceRows && balanceRows[0]) || {}
      const currentBalance = (row.billed || 0) - (row.paid || 0)

      return {
        billId: bill.id,
        firmId: bill.firm_id,
        firmName: bill.firms?.name || '',
        amount: bill.total_amount,
        date: bill.bill_date,
        bill,
        items: (items || []).filter((i) => i.bill_id === bill.id),
        amountWords: toWords.convert(bill.total_amount, { currency: true }),
        prevBalance: currentBalance - bill.total_amount,
      }
    })
  )

  // preserve the order the caller asked for
  return billIds.map((id) => entries.find((e) => e.billId === id)).filter(Boolean)
}