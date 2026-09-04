'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveBill(data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { firm_id, bill_date, bilty_no, do_no, bilty_charges, packaging_charges, is_credit, items } = data

  const itemsTotal = items.reduce((s, i) => s + i.quantity * i.price, 0)
  const total_amount = itemsTotal + (bilty_charges || 0) + (packaging_charges || 0)

  const billRecord = {
    firm_id,
    bill_date,
    bilty_no: bilty_no || '',
    do_no: do_no || '',
    bilty_charges: bilty_charges || 0,
    packaging_charges: packaging_charges || 0,
    total_amount,
    is_credit,
  }

  const { data: newBill, error } = await supabase.from('bills').insert(billRecord).select().single()
  if (error) return { error: error.message }

  const billItems = items.map((item) => ({
    bill_id: newBill.id,
    product_id: item.product_id || null,
    product_name: item.product_name,
    colour: item.colour || '',
    size: item.size || '',
    quantity: item.quantity,
    price: item.price,
    total: item.quantity * item.price,
  }))

  const { error: itemsError } = await supabase.from('bill_items').insert(billItems)
  if (itemsError) console.error('Bill items error:', itemsError.message)

  // Anomaly checks
  const { data: recentBills } = await supabase
    .from('bills')
    .select('id, total_amount, bill_date')
    .eq('firm_id', firm_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const bills = recentBills || []
  const anomalies = []

  const dupes = bills.filter(
    (b) => b.id !== newBill.id && b.total_amount === total_amount && b.bill_date === bill_date
  )
  if (dupes.length > 0) {
    anomalies.push({
      type: 'Duplicate',
      firm_id,
      details: `Rs ${total_amount.toLocaleString()} entered again on ${bill_date}`,
      reference_type: 'bill',
    })
  }

  if (bills.length >= 5) {
    const avg = bills.reduce((s, b) => s + b.total_amount, 0) / bills.length
    if (avg > 0 && total_amount > avg * 3) {
      anomalies.push({
        type: 'Large Bill',
        firm_id,
        details: `Rs ${total_amount.toLocaleString()} is ${Math.round(total_amount / avg)}x the average of last ${bills.length} bills`,
        reference_type: 'bill',
      })
    }
  }

  if (anomalies.length > 0) {
    const { data: firm } = await supabase.from('firms').select('name').eq('id', firm_id).single()
    const anomalyRows = anomalies.map((a) => ({ ...a, firm_name: firm?.name, reference_id: newBill.id }))
    await supabase.from('anomalies').insert(anomalyRows)
  }

  revalidatePath('/new-bill')
  return { success: true, bill: { ...newBill, total_amount }, items: billItems, anomalies }
}
export async function getBalanceAsOf(firmId, beforeDate, beforeId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const billCutoff = `bill_date.lt.${beforeDate},and(bill_date.eq.${beforeDate},id.lt.${beforeId})`

  const [billsSum, pmtsSum, archBillsSum, archPmtsSum] = await Promise.all([
    supabase.from('bills').select('total_amount').eq('firm_id', firmId).eq('is_credit', true).or(billCutoff),
    supabase.from('payments').select('amount').eq('firm_id', firmId).lte('payment_date', beforeDate),
    supabase.from('archive_bills').select('total_amount').eq('firm_id', firmId).eq('is_credit', true).or(billCutoff),
    supabase.from('archive_payments').select('amount').eq('firm_id', firmId).lte('payment_date', beforeDate),
  ])
  const billTotal = (billsSum.data || []).reduce((s, b) => s + (b.total_amount || 0), 0)
  const pmtTotal = (pmtsSum.data || []).reduce((s, p) => s + (p.amount || 0), 0)
  const archBillTotal = (archBillsSum.data || []).reduce((s, b) => s + (b.total_amount || 0), 0)
  const archPmtTotal = (archPmtsSum.data || []).reduce((s, p) => s + (p.amount || 0), 0)

  return (billTotal + archBillTotal) - (pmtTotal + archPmtTotal)
}
export async function getPreviousBalance(firmId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const { data: balanceRows } = await supabase.rpc('get_firm_balance', { p_firm_id: firmId })
  const row = (balanceRows && balanceRows[0]) || {}
  return (row.billed || 0) - (row.paid || 0)
}

export async function getBillForEdit(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { bill: null, items: [] }
  const { data: bill } = await supabase
    .from('bills')
    .select('id, firm_id, bill_date, bilty_no, do_no, bilty_charges, packaging_charges, is_credit, total_amount')
    .eq('id', id)
    .single()
  const { data: items } = await supabase
    .from('bill_items')
    .select('product_name, colour, size, quantity, price, product_id')
    .eq('bill_id', id)
  return { bill, items: items || [] }
}

export async function updateBill(id, data) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { firm_id, bill_date, bilty_no, do_no, bilty_charges, packaging_charges, is_credit, items } = data
  const itemsTotal = items.reduce((s, i) => s + i.quantity * i.price, 0)
  const total_amount = itemsTotal + (bilty_charges || 0) + (packaging_charges || 0)

  const { data: updated, error } = await supabase
    .from('bills')
    .update({
      firm_id,
      bill_date,
      bilty_no: bilty_no || '',
      do_no: do_no || '',
      bilty_charges: bilty_charges || 0,
      packaging_charges: packaging_charges || 0,
      total_amount,
      is_credit,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('bill_items').delete().eq('bill_id', id)

  const billItems = items.map((item) => ({
    bill_id: id,
    product_id: item.product_id || null,
    product_name: item.product_name,
    colour: item.colour || '',
    size: item.size || '',
    quantity: item.quantity,
    price: item.price,
    total: item.quantity * item.price,
  }))
  await supabase.from('bill_items').insert(billItems)

  revalidatePath('/new-bill')
  return { success: true, bill: { ...updated, total_amount }, items: billItems }
}

export async function deleteBill(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { error } = await supabase.from('bills').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/new-bill')
  return { success: true }
}