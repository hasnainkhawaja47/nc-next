'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function dismissAnomaly(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase
    .from('anomalies')
    .update({ dismissed: true })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}
function monthBounds(offset = 0) {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const next = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  return { start: first.toISOString().split('T')[0], end: next.toISOString().split('T')[0], label: first }
}

export async function getTopProductsForMonth(offset = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { products: [], monthLabel: '' }
  const { start, end, label } = monthBounds(offset)
  
  const { data: billIdRows } = await supabase
    .from('bills')
    .select('id')
    .gte('bill_date', start)
    .lt('bill_date', end)

  const billIds = (billIdRows || []).map((b) => b.id)
  if (billIds.length === 0) {
    return { products: [], monthLabel: label.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
  }

  const { data: items } = await supabase
    .from('bill_items')
    .select('product_name, quantity')
    .in('bill_id', billIds)

  const totals = {}
    ; (items || []).forEach((it) => {
      totals[it.product_name] = (totals[it.product_name] || 0) + (it.quantity || 0)
    })

  const products = Object.entries(totals)
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)

  return { products, monthLabel: label.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
}