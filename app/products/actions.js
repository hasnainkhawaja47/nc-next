'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProduct(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { error } = await supabase.from('products').insert({
    code: formData.get('code'),
    name: formData.get('name'),
    standard_price: Number(formData.get('standard_price')),
    cost_price: Number(formData.get('cost_price')),
  })
  if (error) return { error: error.message }
  revalidatePath('/products')
  return { success: true }
}

export async function updateProduct(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { error } = await supabase.from('products').update({
    code: formData.get('code'),
    name: formData.get('name'),
    standard_price: Number(formData.get('standard_price')),
    cost_price: Number(formData.get('cost_price')),
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/products')
  return { success: true }
}

export async function deleteProduct(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: used } = await supabase
    .from('bill_items')
    .select('id')
    .eq('product_id', id)
    .limit(1)

  if (used && used.length > 0) {
    return { error: 'Cannot delete: product has been used in bills.' }
  }

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/products')
  return { success: true }
}