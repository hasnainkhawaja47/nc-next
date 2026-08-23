import { createClient } from '@/lib/supabase/server'
import { getLedger } from './actions'
import LedgerFilter from './LedgerFilter'
import Link from 'next/link'
import DeleteEntryButton from './DeleteEntryButton'
import EditPaymentDialog from '@/app/payments/EditPaymentDialog'

export default async function LedgerPage({ params, searchParams }) {
  const { id } = await params
  const sp = await searchParams
  const from = sp.from || '2024-01-01'
  const to = sp.to || ''

  const supabase = await createClient()
  const { data: firm } = await supabase.from('firms').select('name').eq('id', id).single()
  const ledger = await getLedger(id, from, to)

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">{firm?.name || 'Ledger'}</h1>

      <LedgerFilter firmId={id} defaultFrom={from} defaultTo={to} />

      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="border rounded-md p-3">
          <div className="text-xs text-gray-500">Total billed</div>
          <div className="text-lg font-semibold">Rs {ledger.totalBilled.toLocaleString()}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs text-gray-500">Total paid</div>
          <div className="text-lg font-semibold text-green-600">Rs {ledger.totalPaid.toLocaleString()}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs text-gray-500">Balance due</div>
          <div className={`text-lg font-semibold ${ledger.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            Rs {ledger.balance.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="border rounded-md overflow-auto max-h-[60vh]">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="text-left border-b">
              <th className="py-2 px-3 bg-gray-50">Date</th>
              <th className="py-2 px-3 bg-gray-50">Description</th>
              <th className="py-2 px-3 bg-gray-50 text-right">Credit</th>
              <th className="py-2 px-3 bg-gray-50 text-right">Debit</th>
              <th className="py-2 px-3 bg-gray-50 text-right">Balance</th>
              <th className="py-2 px-3 bg-gray-50"></th>
            </tr>
          </thead>
          <tbody>
            {ledger.entries.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-gray-400">No entries found for this date range.</td></tr>
            ) : (
              ledger.entries.map((e, i) => (
                <tr key={i} className={`border-b ${e.type === 'opening' ? 'bg-gray-50 italic text-gray-500' : ''}`}>
                  <td className="py-2 px-3 whitespace-nowrap text-xs text-gray-500">{e.date}</td>
                  <td className="py-2 px-3">
                    {e.type === 'opening' ? e.description : (
                      <>
                        {e.description}
                        {!e.isActive && <span className="ml-2 text-[10px] text-gray-400">archive</span>}
                      </>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-500">{e.type === 'opening' ? '—' : e.credit > 0 ? e.credit.toLocaleString() : '—'}</td>
                  <td className="py-2 px-3 text-right text-gray-500">{e.type === 'opening' ? '—' : e.debit > 0 ? e.debit.toLocaleString() : '—'}</td>
                  <td className={`py-2 px-3 text-right font-medium ${e.type === 'opening' ? (e.openingBalance > 0 ? 'text-red-600' : 'text-green-600') : (e.balance > 0 ? 'text-red-600' : e.balance < 0 ? 'text-green-600' : '')}`}>
                    {(e.type === 'opening' ? e.openingBalance : e.balance).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {e.type !== 'opening' && e.isActive && (
                      <div className="flex gap-2">
                        {e.type !== 'opening' && e.isActive && (
                          <div className="flex gap-2">
                            {e.type === 'bill' ? (
                              <Link href={`/new-bill?edit=${e.id}`} className="text-blue-600 text-xs">Edit</Link>
                            ) : (
                              <EditPaymentDialog paymentId={e.id} trigger={<span className="text-blue-600 text-xs cursor-pointer">Edit</span>} />
                            )}
                          </div>
                        )}
                        <DeleteEntryButton type={e.type} id={e.id} />
                      </div>
                    )}
                    {e.type !== 'opening' && !e.isActive && (
                      <span className="text-[10px] text-gray-400">archive</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}