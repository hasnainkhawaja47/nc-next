'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPayment(formData) {
  const supabase = await createClient()

  const firm_id = Number(formData.get('firm_id'))
  const payment_date = formData.get('payment_date')
  const amount = Number(formData.get('amount'))
  const method = formData.get('method') || 'Cash'
  const cheque_number = formData.get('cheque_number') || ''
  const bank_name = formData.get('bank_name') || ''
  const memo = formData.get('memo') || ''

  if (!firm_id) return { error: 'Please select a client.' }

  const { data: balanceRows } = await supabase.rpc('get_firm_balance', { p_firm_id: firm_id })
  const row = (balanceRows && balanceRows[0]) || {}
  const currentBalance = (row.billed || 0) - (row.paid || 0)

  let anomaly = null
  if (amount > currentBalance && currentBalance > 0) {
    anomaly = {
      type: 'Overpayment',
      firm_id,
      details: `Payment of Rs ${amount.toLocaleString()} exceeds balance of Rs ${currentBalance.toLocaleString()}`,
      reference_type: 'payment',
    }
  }

  const { data: newPmt, error } = await supabase
    .from('payments')
    .insert({ firm_id, payment_date, amount, method, cheque_number, bank_name, memo })
    .select()
    .single()

  if (error) return { error: error.message }

  if (anomaly) {
    const { data: firm } = await supabase.from('firms').select('name').eq('id', firm_id).single()
    await supabase.from('anomalies').insert({ ...anomaly, firm_name: firm?.name, reference_id: newPmt.id })
  }

  revalidatePath('/payments')
  return { success: true, anomaly }
}

export async function deletePayment(id) {
  const supabase = await createClient()
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/payments')
  return { success: true }
}