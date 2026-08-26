import { createClient } from '@/lib/supabase/server'
import { getLedger } from './actions'
import LedgerFilter from './LedgerFilter'
import LedgerEntriesTable from './LedgerEntriesTable'
import { BookOpen } from 'lucide-react'

export default async function LedgerPage({ params, searchParams }) {
  const { id } = await params
  const sp = await searchParams
  const from = sp.from || '2024-01-01'
  const to = sp.to || ''
  const supabase = await createClient()
  const { data: firm } = await supabase.from('firms').select('name').eq('id', id).single()
  const ledger = await getLedger(id, from, to)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
        <BookOpen className="w-5 h-5 text-muted-foreground" />
        {firm?.name || 'Ledger'}
      </h1>

      <LedgerFilter
        firmId={id}
        defaultFrom={from}
        defaultTo={to}
        entries={ledger.entries}
        firm={firm}
        totals={{ totalBilled: ledger.totalBilled, totalPaid: ledger.totalPaid, balance: ledger.balance }}
      />

      <div className="grid grid-cols-3 gap-3 my-4 animate-in fade-in duration-300">
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground">Total billed</div>
          <div className="text-lg font-semibold">Rs {ledger.totalBilled.toLocaleString()}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground">Total paid</div>
          <div className="text-lg font-semibold text-green-600">Rs {ledger.totalPaid.toLocaleString()}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground">Balance due</div>
          <div className={`text-lg font-semibold ${ledger.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            Rs {ledger.balance.toLocaleString()}
          </div>
        </div>
      </div>

      <LedgerEntriesTable entries={ledger.entries} />
    </div>
  )
}