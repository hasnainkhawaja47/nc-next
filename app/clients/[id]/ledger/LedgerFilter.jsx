'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import dynamic from 'next/dynamic'
const LedgerPDFDownloadButton = dynamic(
  () => import('@/components/LedgerPDF').then((mod) => mod.LedgerPDFDownloadButton),
  { ssr: false }
)
const EnvelopePDFDownloadButton = dynamic(
  () => import('@/components/EnvelopePDF').then((mod) => mod.EnvelopePDFDownloadButton),
  { ssr: false }
)

function toISODate(date) {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd')
}

function fromISODate(str) {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function LedgerFilter({ firmId, defaultFrom, defaultTo, entries, firm, totals }) {
  const [from, setFrom] = useState(fromISODate(defaultFrom))
  const [to, setTo] = useState(fromISODate(defaultTo))
  const router = useRouter()

  function applyFilter() {
    const params = new URLSearchParams()
    if (from) params.set('from', toISODate(from))
    if (to) params.set('to', toISODate(to))
    router.push(`/clients/${firmId}/ledger?${params.toString()}`)
  }

  function clearFilter() {
    setFrom(fromISODate('2024-01-01'))
    setTo(undefined)
    router.push(`/clients/${firmId}/ledger?from=2024-01-01`)
  }

  return (
    <div className="flex flex-wrap items-end justify-center gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground leading-none">From</label>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="w-[180px] justify-start font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {from ? format(from, 'PP') : 'Pick a date'}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={from} onSelect={setFrom} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground leading-none">To</label>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className="w-[180px] justify-start font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {to ? format(to, 'PP') : 'Pick a date'}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={to} onSelect={setTo} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={applyFilter}>
          <Search className="w-4 h-4 mr-1.5" />
          Filter
        </Button>
        <Button variant="outline" onClick={clearFilter}>
          <X className="w-4 h-4 mr-1.5" />
          Clear
        </Button>
        <LedgerPDFDownloadButton
          entries={entries}
          firm={firm}
          dateRange={{ from: defaultFrom, to: defaultTo }}
          totals={totals}
        />
        <EnvelopePDFDownloadButton firm={firm} />
      </div>
    </div>
  )
}