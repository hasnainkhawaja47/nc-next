import { createClient } from '@/lib/supabase/server'

async function getRows(supabase, table, columns, firmId, from, to, dateCol) {
  let allRows = []
  let start = 0
  const pageSize = 1000
  while (true) {
    let q = supabase.from(table).select(columns).eq('firm_id', firmId)
    if (from) q = q.gte(dateCol, from)
    if (to) q = q.lte(dateCol, to)
    const { data, error } = await q.range(start, start + pageSize - 1)
    if (error || !data || data.length === 0) break
    allRows = allRows.concat(data)
    if (data.length < pageSize) break
    start += pageSize
  }
  return allRows
}

async function getOpeningBalance(supabase, firmId, fromDate) {
  const [billsSum, pmtsSum, archBillsSum, archPmtsSum] = await Promise.all([
    supabase.from('bills').select('total_amount').eq('firm_id', firmId).lt('bill_date', fromDate),
    supabase.from('payments').select('amount').eq('firm_id', firmId).lt('payment_date', fromDate),
    supabase.from('archive_bills').select('total_amount').eq('firm_id', firmId).lt('bill_date', fromDate),
    supabase.from('archive_payments').select('amount').eq('firm_id', firmId).lt('payment_date', fromDate),
  ])

  const billTotal = (billsSum.data || []).reduce((s, b) => s + (b.total_amount || 0), 0)
  const pmtTotal = (pmtsSum.data || []).reduce((s, p) => s + (p.amount || 0), 0)
  const archBillTotal = (archBillsSum.data || []).reduce((s, b) => s + (b.total_amount || 0), 0)
  const archPmtTotal = (archPmtsSum.data || []).reduce((s, p) => s + (p.amount || 0), 0)

  return (billTotal + archBillTotal) - (pmtTotal + archPmtTotal)
}

export async function getLedger(firmId, from, to) {
  const supabase = await createClient()
  const fromDate = from || null
  const toDate = to || null

  const [activeBills, activePmts, archiveBills, archivePmts] = await Promise.all([
    getRows(supabase, 'bills', 'id, bill_date, total_amount, bilty_no, do_no, is_credit', firmId, fromDate, toDate, 'bill_date'),
    getRows(supabase, 'payments', 'id, payment_date, amount, method, bank_name, cheque_number, memo', firmId, fromDate, toDate, 'payment_date'),
    getRows(supabase, 'archive_bills', 'id, bill_date, total_amount, bilty_no, do_no, is_credit', firmId, fromDate, toDate, 'bill_date'),
    getRows(supabase, 'archive_payments', 'id, payment_date, amount, method, bank_name, cheque_number, memo', firmId, fromDate, toDate, 'payment_date'),
  ])

  let openingBalance = 0
  if (fromDate) {
    openingBalance = await getOpeningBalance(supabase, firmId, fromDate)
  }

  const entries = []

  if (fromDate && openingBalance !== 0) {
    entries.push({
      date: fromDate,
      type: 'opening',
      id: null,
      description: 'Opening balance brought forward',
      credit: 0,
      debit: 0,
      openingBalance,
    })
  }

  const allBills = [...activeBills, ...archiveBills]
  const allPmts = [...activePmts, ...archivePmts]
  const activeIds = new Set(activeBills.map((b) => b.id))

  allBills.forEach((b) => {
    entries.push({
      date: b.bill_date,
      type: 'bill',
      id: b.id,
      isActive: activeIds.has(b.id),
      description: `Bill # ${b.id}${b.bilty_no ? ' · Bilty: ' + b.bilty_no : ''}`,
      credit: b.total_amount || 0,
      debit: 0,
    })
  })

  const activePmtIds = new Set(activePmts.map((p) => p.id))
  allPmts.forEach((p) => {
    const bankPart = p.bank_name ? ` — ${p.bank_name}${p.cheque_number ? ' · Ref: ' + p.cheque_number : ''}` : ''
    entries.push({
      date: p.payment_date,
      type: 'payment',
      id: p.id,
      isActive: activePmtIds.has(p.id),
      description: `${p.method}${bankPart}`,
      credit: 0,
      debit: p.amount || 0,
    })
  })

  entries.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if (a.type === 'opening') return -1
    if (b.type === 'opening') return 1
    if (a.type === 'bill' && b.type !== 'bill') return -1
    if (b.type === 'bill' && a.type !== 'bill') return 1
    return 0
  })

  let running = fromDate ? openingBalance : 0
  entries.forEach((e) => {
    if (e.type !== 'opening') {
      running += e.credit - e.debit
    }
    e.balance = running
  })

  const totalBilled = allBills.reduce((s, b) => s + (b.total_amount || 0), 0)
  const totalPaid = allPmts.reduce((s, p) => s + (p.amount || 0), 0)

  return { entries, totalBilled, totalPaid, balance: running, openingBalance }
}