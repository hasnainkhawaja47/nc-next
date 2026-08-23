import { createClient } from '@/lib/supabase/server'
import { getLedger } from './actions'
import LedgerFilter from './LedgerFilter'
import Link from 'next/link'
import DeleteEntryButton from './DeleteEntryButton'
import EditPaymentDialog from '@/app/payments/EditPaymentDialog'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { BookOpen, Pencil } from 'lucide-react'

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
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-muted-foreground" />
        {firm?.name || 'Ledger'}
      </h1>

      <LedgerFilter firmId={id} defaultFrom={from} defaultTo={to} />

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

      <div className="border rounded-md overflow-auto max-h-[60vh] animate-in fade-in duration-300">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 z-10 bg-muted">Date</TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted">Description</TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted text-right">Credit</TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted text-right">Debit</TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted text-right">Balance</TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No entries found for this date range.
                </TableCell>
              </TableRow>
            ) : (
              ledger.entries.map((e, i) => (
                <TableRow key={i} className={e.type === 'opening' ? 'bg-muted/40 italic text-muted-foreground' : 'transition-colors hover:bg-muted/50'}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{e.date}</TableCell>
                  <TableCell>
                    {e.type === 'opening' ? e.description : (
                      <>
                        {e.description}
                        {!e.isActive && <span className="ml-2 text-[10px] text-muted-foreground">archive</span>}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {e.type === 'opening' ? '—' : e.credit > 0 ? e.credit.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {e.type === 'opening' ? '—' : e.debit > 0 ? e.debit.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${e.type === 'opening' ? (e.openingBalance > 0 ? 'text-red-600' : 'text-green-600') : (e.balance > 0 ? 'text-red-600' : e.balance < 0 ? 'text-green-600' : '')}`}>
                    {(e.type === 'opening' ? e.openingBalance : e.balance).toLocaleString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {e.type !== 'opening' && e.isActive && (
                      <div className="flex gap-1">
                        {e.type === 'bill' ? (
                          <Link
                            href={`/new-bill?edit=${e.id}`}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Link>
                        ) : (
                          <EditPaymentDialog paymentId={e.id} />
                        )}
                        <DeleteEntryButton type={e.type} id={e.id} />
                      </div>
                    )}
                    {e.type !== 'opening' && !e.isActive && (
                      <span className="text-[10px] text-muted-foreground">archive</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}