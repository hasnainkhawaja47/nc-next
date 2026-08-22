import { createClient } from '@/lib/supabase/server'
import PaymentsForm from './PaymentsForm'
import DataTable from '@/components/DataTable'
import DeletePaymentButton from './DeletePaymentButton'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const [{ data: firms }, { data: payments }] = await Promise.all([
    supabase.from('firms').select('id, name').order('name'),
    supabase
      .from('payments')
      .select('*, firms(name)')
      .order('payment_date', { ascending: false })
      .limit(50),
  ])

  const columns = [
    { key: 'payment_date', header: 'Date' },
    { key: 'firm', header: 'Client', render: (p) => p.firms?.name || '—' },
    { key: 'amount', header: 'Amount', render: (p) => `Rs ${p.amount?.toLocaleString()}` },
    { key: 'method', header: 'Method' },
    { key: 'bank_name', header: 'Bank / Ref' },
  ]

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">Payments</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentsForm firms={firms || []} />

        <div>
          <h2 className="text-sm font-medium text-gray-600 mb-2">Recent payments</h2>
          <DataTable
            columns={columns}
            data={payments || []}
            renderActions={(p) => <DeletePaymentButton id={p.id} />}
          />
        </div>
      </div>
    </div>
  )
}