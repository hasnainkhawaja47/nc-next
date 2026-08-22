import { createClient } from '@/lib/supabase/server'
import NewBillForm from './NewBillForm'

export default async function NewBillPage() {
  const supabase = await createClient()

  const [{ data: firms }, { data: products }] = await Promise.all([
    supabase.from('firms').select('id, name').order('name'),
    supabase.from('products').select('id, code, name, standard_price').order('code'),
  ])

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">New Bill</h1>
      <NewBillForm firms={firms || []} products={products || []} />
    </div>
  )
}