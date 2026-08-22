'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addClient(formData) {
  const supabase = await createClient()
  const { error } = await supabase.from('firms').insert({
    name: formData.get('name'),
  })
  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function updateClient(id, formData) {
  const supabase = await createClient()
  const { error } = await supabase.from('firms').update({
    name: formData.get('name'),
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function deleteClient(id) {
  const supabase = await createClient()

  const [{ data: bills }, { data: pmts }] = await Promise.all([
    supabase.from('bills').select('id').eq('firm_id', id).limit(1),
    supabase.from('payments').select('id').eq('firm_id', id).limit(1),
  ])

  if ((bills && bills.length > 0) || (pmts && pmts.length > 0)) {
    return { error: 'Cannot delete: this client has bills or payments on record.' }
  }

  const { error } = await supabase.from('firms').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}