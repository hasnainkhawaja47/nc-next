'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function dismissAnomaly(id) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('anomalies')
    .update({ dismissed: true })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}