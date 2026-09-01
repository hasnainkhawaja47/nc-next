'use client'

import { useState } from 'react'
import Link from 'next/link'
import DeleteEntryButton from './DeleteEntryButton'
import EditPaymentDialog from '@/app/payments/EditPaymentDialog'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Pencil } from 'lucide-react'
import { BillDetailsDialog } from '@/components/BillDetailsDialog'
import { getBillDetails } from './actions'
export default function LedgerEntriesTable({ entries }) {
  const [selectedBill, setSelectedBill] = useState(null) // { id, isArchive }

  return (
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
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                No entries found for this date range.
              </TableCell>
            </TableRow>
          ) : (
            entries.map((e, i) => {
              const isBillRow = e.type === 'bill'
              return (
                <TableRow
                  key={i}
                  className={
                    e.type === 'opening'
                      ? 'bg-muted/40 italic text-muted-foreground'
                      : `transition-colors hover:bg-muted/50 ${isBillRow ? 'cursor-pointer' : ''}`
                  }
                  onClick={() => {
                    if (isBillRow) {
                      setSelectedBill({ id: e.id, isArchive: !e.isActive })
                    }
                  }}
                >
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-')}</TableCell>
                  <TableCell className="whitespace-normal break-words max-w-[160px] sm:max-w-none">
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
                  <TableCell className="whitespace-nowrap" onClick={(evt) => evt.stopPropagation()}>
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
              )
            })
          )}
        </TableBody>
      </Table>

      <BillDetailsDialog
        billId={selectedBill?.id}
        isArchive={selectedBill?.isArchive}
        open={selectedBill != null}
        onOpenChange={(v) => !v && setSelectedBill(null)}
        fetchDetails={getBillDetails}
      />
    </div>
  )
}