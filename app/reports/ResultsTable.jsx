'use client'

import { useState, useMemo, useTransition } from 'react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Eye, Printer, SearchX, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BillDetailsDialog } from '@/components/BillDetailsDialog'
import BillDocument, { BillsDocument } from '@/components/BillDocument'
import { getBillsForPrint, getBillDetails } from './actions'

const COLUMNS = [
  { key: 'id', label: 'Bill #', type: 'number' },
  { key: 'firm_name', label: 'Client', type: 'string' },
  { key: 'bill_date', label: 'Date', type: 'string' },
  { key: 'do_no', label: 'D/O #', type: 'string' },
  { key: 'total_amount', label: 'Amount', type: 'number', align: 'right' },
]

function getSortValue(bill, key) {
  if (key === 'firm_name') return bill.firms?.name || ''
  return bill[key]
}

function SortableHead({ column, sort, onSort, className }) {
  const active = sort.column === column.key
  const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'} ${column.align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {column.label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  )
}

export default function ResultsTable({ results }) {
  const [selected, setSelected] = useState(new Set())
  const [printingId, setPrintingId] = useState(null)
  const [bulkPrinting, startBulkPrint] = useTransition()
  const [viewingId, setViewingId] = useState(null)
  const [sort, setSort] = useState({ column: 'id', direction: 'desc' })

  const sortedResults = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sort.column)
    if (!col) return results
    const copy = [...results]
    copy.sort((a, b) => {
      const av = getSortValue(a, col.key)
      const bv = getSortValue(b, col.key)
      let cmp
      if (col.type === 'number') {
        cmp = (Number(av) || 0) - (Number(bv) || 0)
      } else {
        cmp = String(av || '').localeCompare(String(bv || ''))
      }
      return sort.direction === 'asc' ? cmp : -cmp
    })
    return copy
  }, [results, sort])

  function handleSort(key) {
    setSort((prev) =>
      prev.column === key
        ? { column: key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column: key, direction: 'asc' }
    )
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border py-16 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
        <SearchX className="size-8 mb-2" />
        <p className="text-sm">No bills found.</p>
      </div>
    )
  }

  const allSelected = selected.size === sortedResults.length
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(sortedResults.map((b) => b.id)))
  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  async function printOne(billId) {
    setPrintingId(billId)
    try {
      const [entry] = await getBillsForPrint([billId])
      if (!entry) throw new Error('Bill not found')
      const doc = (
        <BillDocument
          bill={entry.bill}
          firmName={entry.firmName}
          items={entry.items}
          amountWords={entry.amountWords}
          prevBalance={entry.prevBalance}
        />
      )
      const blob = await pdf(doc).toBlob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setPrintingId(null)
    }
  }

  function printSelected() {
    startBulkPrint(async () => {
      try {
        const entries = await getBillsForPrint([...selected])
        const blob = await pdf(<BillsDocument entries={entries} />).toBlob()
        window.open(URL.createObjectURL(blob), '_blank')
        setSelected(new Set())
      } catch {
        toast.error('Failed to generate PDF')
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {results.length} bill{results.length !== 1 ? 's' : ''} found
        </p>
        {selected.size > 0 && (
          <Button size="sm" variant="outline" onClick={printSelected} disabled={bulkPrinting} className="animate-in fade-in">
            {bulkPrinting ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            Print {selected.size} selected
          </Button>
        )}
      </div>

      <div className="rounded-xl border overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-8">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              {COLUMNS.map((col) => (
                <SortableHead
                  key={col.key}
                  column={col}
                  sort={sort}
                  onSort={handleSort}
                  className={col.align === 'right' ? 'text-right' : ''}
                />
              ))}
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResults.map((b, i) => (
              <TableRow
                key={b.id}
                className="animate-in fade-in slide-in-from-bottom-1"
                style={{ animationDelay: `${Math.min(i, 10) * 30}ms`, animationFillMode: 'backwards' }}
              >
                <TableCell>
                  <Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggleOne(b.id)} />
                </TableCell>
                <TableCell className="font-medium">{b.id}</TableCell>
                <TableCell>{b.firms?.name || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{b.bill_date}</TableCell>
                <TableCell>{b.do_no || '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{b.total_amount?.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            onClick={() => setViewingId(b.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye className="size-4" />
                          </button>
                        }
                      />
                      <TooltipContent>View bill</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            onClick={() => printOne(b.id)}
                            disabled={printingId === b.id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                          >
                            {printingId === b.id ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
                          </button>
                        }
                      />
                      <TooltipContent>Print bill</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BillDetailsDialog
        billId={viewingId}
        isArchive={false}
        open={viewingId != null}
        onOpenChange={(v) => !v && setViewingId(null)}
        fetchDetails={getBillDetails}
      />
    </div>
  )
}