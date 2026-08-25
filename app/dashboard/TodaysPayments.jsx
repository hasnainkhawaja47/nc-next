import { createClient } from '@/lib/supabase/server'
import DeletePaymentButton from '../payments/DeletePaymentButton'
import EditPaymentDialog from '../payments/EditPaymentDialog'
import { Wallet } from 'lucide-react'

function fmt(n) {
  return 'Rs ' + Math.round(n || 0).toLocaleString('en-PK')
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default async function TodaysPayments() {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('*, firms(name)')
    .eq('payment_date', today())
    .order('created_at', { ascending: false })

  const rows = payments || []

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3 [animation-duration:500ms] [animation-fill-mode:forwards]">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-neutral-400" />
        <h2 className="text-sm font-medium text-neutral-900">Today's Payments</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
            <th className="pb-2 font-medium">Client</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Method</th>
            <th className="pb-2 font-medium">Bank / Ref</th>
            <th className="pb-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-neutral-400">
                No payments recorded today
              </td>
            </tr>
          )}
          {rows.map((p) => (
            <tr
              key={p.id}
              className="border-b border-neutral-50 last:border-0 transition-colors duration-150 hover:bg-neutral-50"
            >
              <td className="py-2 text-neutral-700">{p.firms?.name || '—'}</td>
              <td className="py-2 tabular-nums text-neutral-900">{fmt(p.amount)}</td>
              <td className="py-2 text-neutral-700">{p.method || '—'}</td>
              <td className="py-2 text-neutral-700">{p.bank_name || '—'}</td>
              <td className="py-2">
                <div className="flex justify-end gap-1">
                  <EditPaymentDialog paymentId={p.id} />
                  <DeletePaymentButton id={p.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}