import { createClient } from '@/lib/supabase/server'
import PaymentsForm from './PaymentsForm'
import DataTable from '@/components/DataTable'
import DeletePaymentButton from './DeletePaymentButton'
import EditPaymentDialog from './EditPaymentDialog'
import { Wallet } from 'lucide-react'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const [{ data: firms }, { data: payments }] = await Promise.all([
    supabase.from('firms').select('id, name').order('name'),
    supabase
      .from('payments')
      .select('*, firms(name)')
      .order('payment_date', { ascending: false })
      .limit(50),
  ])

  const columns = [
    {
      key: 'payment_date',
      header: 'Date',
      render: (p) =>
        new Date(p.payment_date)
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
          .replace(/ /g, '-'),
    },
    {
      key: 'firm',
      header: 'Client',
      render: (p) => (
        <span className="block max-w-[120px] whitespace-normal break-words">
          {p.firms?.name || '—'}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount', render: (p) => `Rs ${p.amount?.toLocaleString()}` },
    { key: 'method', header: 'Method' },
    {
      key: 'bank_name',
      header: 'Bank / Ref',
      render: (p) => (
        <span className="block max-w-[140px] whitespace-normal break-words">
          {p.bank_name || '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-muted-foreground" />
        Payments
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
        <PaymentsForm firms={firms || []} />

        <div className="min-w-0">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Recent payments</h2>
          <DataTable
            columns={columns}
            data={payments || []}
            renderActions={(p) => (
              <div className="flex gap-1">
                <EditPaymentDialog paymentId={p.id} />
                <DeletePaymentButton id={p.id} />
              </div>
            )}
          />
        </div>
      </div>
    </div>
  )
}