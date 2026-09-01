'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addClient(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('firms').insert({
    name: formData.get('name'),
    address: formData.get('address') || null,
    phone: formData.get('phone') || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function updateClient(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { error } = await supabase.from('firms').update({
    name: formData.get('name'),
    address: formData.get('address') || null,
    phone: formData.get('phone') || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function getBillDetails(billId, isArchive) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { bill: null, items: [] }
  const billTable = isArchive ? "archive_bills" : "bills";
  
  const [{ data: bill }, { data: items }] = await Promise.all([
    supabase.from(billTable).select("*").eq("id", billId).single(),
    supabase.from(itemsTable).select("*").eq("bill_id", billId),
  ]);

  return { bill, items: items ?? [] };
}

export async function deleteClient(id) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
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