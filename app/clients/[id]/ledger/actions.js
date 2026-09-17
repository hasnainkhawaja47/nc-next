'use server'

import { createClient } from '@/lib/supabase/server'
import { ToWords } from 'to-words'

const toWords = new ToWords({
  localeCode: 'en-IN',
  converterOptions: { currency: true, ignoreDecimal: true },
})

// Balance strictly before a given bill, using the same tie-break order
// (date, then created_at, then id) as getLedger's running balance.
async function getBalanceAsOf(supabase, firmId, bill) {
  const opening = await getOpeningBalance(supabase, firmId, bill.bill_date)

  const [sameDayBills, sameDayPmts, sameDayArchBills, sameDayArchPmts] = await Promise.all([
    supabase.from('bills').select('id, total_amount, created_at').eq('firm_id', firmId).eq('bill_date', bill.bill_date),
    supabase.from('payments').select('id, amount, created_at').eq('firm_id', firmId).eq('payment_date', bill.bill_date),
    supabase.from('archive_bills').select('id, total_amount').eq('firm_id', firmId).eq('bill_date', bill.bill_date),
    supabase.from('archive_payments').select('id, amount').eq('firm_id', firmId).eq('payment_date', bill.bill_date),
  ])

  const sameDay = [
    ...(sameDayBills.data || []).map((b) => ({ id: b.id, amount: b.total_amount, createdAt: b.created_at, isCredit: true })),
    ...(sameDayArchBills.data || []).map((b) => ({ id: b.id, amount: b.total_amount, createdAt: null, isCredit: true })),
    ...(sameDayPmts.data || []).map((p) => ({ id: p.id, amount: p.amount, createdAt: p.created_at, isCredit: false })),
    ...(sameDayArchPmts.data || []).map((p) => ({ id: p.id, amount: p.amount, createdAt: null, isCredit: false })),
  ]

  sameDay.sort((a, b) => {
    if (a.createdAt && b.createdAt) return a.createdAt.localeCompare(b.createdAt)
    if (a.createdAt) return -1
    if (b.createdAt) return 1
    return (a.id || 0) - (b.id || 0)
  })

  let sum = 0
  for (const entry of sameDay) {
    if (entry.isCredit && entry.id === bill.id) break // stop once we hit the target bill itself
    sum += entry.isCredit ? entry.amount : -entry.amount
  }

  return opening + sum
}

// Bulk print for the ledger's selection checkboxes. Only ever called with
// live (non-archive) bill ids — archived bills are excluded from selection
// in the UI, so there's no isArchive branch here.
export async function getBillsForPrint(billIds) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  if (!billIds || billIds.length === 0) return []

  const { data: bills } = await supabase
    .from('bills')
    .select('id, firm_id, bill_date, bilty_no, do_no, is_credit, bilty_charges, packaging_charges, total_amount, created_at')
    .in('id', billIds)

  if (!bills || bills.length === 0) return []

  const firmIds = [...new Set(bills.map((b) => b.firm_id))]
  const { data: firms } = await supabase.from('firms').select('id, name').in('id', firmIds)
  const firmNameMap = {}
    ; (firms || []).forEach((f) => { firmNameMap[f.id] = f.name })

  const { data: allItems } = await supabase
    .from('bill_items')
    .select('id, bill_id, product_name, colour, size, quantity, price, total')
    .in('bill_id', billIds)
  const itemsByBill = {}
    ; (allItems || []).forEach((it) => {
      if (!itemsByBill[it.bill_id]) itemsByBill[it.bill_id] = []
      itemsByBill[it.bill_id].push(it)
    })

  const entries = await Promise.all(
    bills.map(async (bill) => ({
      billId: bill.id,
      bill,
      firmName: firmNameMap[bill.firm_id] || '',
      items: itemsByBill[bill.id] || [],
      amountWords: toWords.convert(bill.total_amount || 0),
      prevBalance: await getBalanceAsOf(supabase, bill.firm_id, bill),
    }))
  )

  const order = new Map(billIds.map((id, i) => [id, i]))
  entries.sort((a, b) => order.get(a.billId) - order.get(b.billId))

  return entries
}

async function getRows(supabase, table, columns, firmId, from, to, dateCol) {
  let allRows = []
  let start = 0
  const pageSize = 1000
  while (true) {
    let q = supabase.from(table).select(columns).eq('firm_id', firmId)
    if (from) q = q.gte(dateCol, from)
    if (to) q = q.lte(dateCol, to)
    q = q.order(dateCol, { ascending: true }).order('id', { ascending: true })
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { entries: [], totalBilled: 0, totalPaid: 0, balance: 0, openingBalance: 0 }
  const fromDate = from || null
  const toDate = to || null

  const [activeBills, activePmts, archiveBills, archivePmts] = await Promise.all([
    getRows(supabase, 'bills', 'id, bill_date, total_amount, bilty_no, do_no, is_credit, created_at', firmId, fromDate, toDate, 'bill_date'),
    getRows(supabase, 'payments', 'id, payment_date, amount, method, bank_name, cheque_number, memo, created_at', firmId, fromDate, toDate, 'payment_date'),
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
      createdAt: b.created_at,
    })
  })

  const activePmtIds = new Set(activePmts.map((p) => p.id))
  allPmts.forEach((p) => {
    const bankPart = p.bank_name ? ` — ${p.bank_name}${p.cheque_number ? ' · Ref: ' + p.cheque_number : ''}` : ''
    const memoPart = p.memo ? ` (Memo: ${p.memo})` : ''
    entries.push({
      date: p.payment_date,
      type: 'payment',
      id: p.id,
      isActive: activePmtIds.has(p.id),
      description: `${p.method}${bankPart}${memoPart}`,
      credit: 0,
      debit: p.amount || 0,
      createdAt: p.created_at,
    })
  })

  entries.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if (a.type === 'opening') return -1
    if (b.type === 'opening') return 1
    if (a.createdAt && b.createdAt) return a.createdAt.localeCompare(b.createdAt)
    if (a.createdAt) return -1
    if (b.createdAt) return 1
    return (a.id || 0) - (b.id || 0)
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

export async function getBillDetails(billId, isArchive) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { bill: null, items: [] }
  const billTable = isArchive ? 'archive_bills' : 'bills'
  const itemsTable = isArchive ? 'archive_bill_items' : 'bill_items'

  // archive_bill_items uses `archive_bill_id` as its foreign key, not
  // `bill_id` like the live bill_items table does.
  const itemsFkColumn = isArchive ? 'archive_bill_id' : 'bill_id'

  const [{ data: bill }, { data: items }] = await Promise.all([
    supabase
      .from(billTable)
      .select('bill_date, bilty_no, do_no, is_credit, bilty_charges, packaging_charges, total_amount')
      .eq('id', billId)
      .single(),
    supabase
      .from(itemsTable)
      .select('id, product_name, colour, size, quantity, price, total')
      .eq(itemsFkColumn, billId),
  ])

  return { bill, items: items ?? [] }
}