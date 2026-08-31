'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, CalendarRange, Hash, Truck, Loader2, SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODES = [
  { key: 'date', label: 'Date range', icon: CalendarRange },
  { key: 'bill', label: 'Bill #', icon: Hash },
  { key: 'do', label: 'D/O #', icon: Truck },
]

function toISODate(date) {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd')
}

function fromISODate(str) {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function ReportsSearchForm({ defaultMode, defaults }) {
  const [mode, setMode] = useState(defaultMode)
  const [from, setFrom] = useState(fromISODate(defaults.from))
  const [to, setTo] = useState(fromISODate(defaults.to))
  const [billNo, setBillNo] = useState(defaults.bill_no || '')
  const [doNo, setDoNo] = useState(defaults.do_no || '')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSearch() {
    const params = new URLSearchParams()
    params.set('mode', mode)
    if (mode === 'date') {
      if (from) params.set('from', toISODate(from))
      if (to) params.set('to', toISODate(to))
    } else if (mode === 'bill') {
      if (billNo) params.set('bill_no', billNo)
    } else if (mode === 'do') {
      if (doNo) params.set('do_no', doNo)
    }
    startTransition(() => router.push(`/reports?${params.toString()}`))
  }

  return (
    <div className="rounded-xl border p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {MODES.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={mode === key ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => setMode(key)}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </div>

      {mode === 'date' && (
        <div className="flex flex-wrap items-end gap-3">
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
        </div>
      )}

      {mode === 'bill' && (
        <div className="max-w-xs space-y-1.5">
          <label className="text-xs text-muted-foreground">Bill number</label>
          <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="e.g. 13472" />
        </div>
      )}

      {mode === 'do' && (
        <div className="max-w-xs space-y-1.5">
          <label className="text-xs text-muted-foreground">D/O number</label>
          <Input value={doNo} onChange={(e) => setDoNo(e.target.value)} placeholder="e.g. 436" />
        </div>
      )}

      <Button onClick={handleSearch} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <SearchIcon className="size-4" />}
        Search
      </Button>
    </div>
  )
}