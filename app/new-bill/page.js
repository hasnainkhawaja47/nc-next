import { createClient } from '@/lib/supabase/server'
import { getBillForEdit } from './actions'
import NewBillForm from './NewBillForm'

export default async function NewBillPage({ searchParams }) {
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: firms }, { data: products }] = await Promise.all([
    supabase.from('firms').select('id, name').order('name'),
    supabase.from('products').select('id, code, name, standard_price').order('code'),
  ])

  let initialBill = null
  if (sp.edit) {
    initialBill = await getBillForEdit(sp.edit)
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">{initialBill ? `Edit Bill #${sp.edit}` : 'New Bill'}</h1>
      <NewBillForm
        key={sp.edit || 'new'}
        firms={firms || []}
        products={products || []}
        initialBill={initialBill}
      />
    </div>
  )
}