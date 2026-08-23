'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ReportsSearchForm({ defaultMode, defaults }) {
  const [mode, setMode] = useState(defaultMode)
  const [from, setFrom] = useState(defaults.from || '')
  const [to, setTo] = useState(defaults.to || '')
  const [billNo, setBillNo] = useState(defaults.bill_no || '')
  const [doNo, setDoNo] = useState(defaults.do_no || '')
  const router = useRouter()

  function handleSearch() {
    const params = new URLSearchParams()
    params.set('mode', mode)
    if (mode === 'date') {
      if (from) params.set('from', from)
      if (to) params.set('to', to)
    } else if (mode === 'bill') {
      if (billNo) params.set('bill_no', billNo)
    } else if (mode === 'do') {
      if (doNo) params.set('do_no', doNo)
    }
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'date' ? 'default' : 'outline'} onClick={() => setMode('date')}>Date range</Button>
        <Button type="button" variant={mode === 'bill' ? 'default' : 'outline'} onClick={() => setMode('bill')}>Bill #</Button>
        <Button type="button" variant={mode === 'do' ? 'default' : 'outline'} onClick={() => setMode('do')}>D/O #</Button>
      </div>

      {mode === 'date' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-600">From date</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-600">To date</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      )}

      {mode === 'bill' && (
        <div className="max-w-xs space-y-1.5">
          <label className="text-xs text-gray-600">Bill number</label>
          <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="e.g. 13472" />
        </div>
      )}

      {mode === 'do' && (
        <div className="max-w-xs space-y-1.5">
          <label className="text-xs text-gray-600">D/O number</label>
          <Input value={doNo} onChange={(e) => setDoNo(e.target.value)} placeholder="e.g. 436" />
        </div>
      )}

      <Button onClick={handleSearch}>Search</Button>
    </div>
  )
}