'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LedgerFilter({ firmId, defaultFrom, defaultTo }) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const router = useRouter()

  function applyFilter() {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    router.push(`/clients/${firmId}/ledger?${params.toString()}`)
  }

  function clearFilter() {
    setFrom('2024-01-01')
    setTo('')
    router.push(`/clients/${firmId}/ledger?from=2024-01-01`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label className="text-xs text-gray-600">From</label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-gray-600">To</label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <Button onClick={applyFilter}>Filter</Button>
      <Button variant="outline" onClick={clearFilter}>Clear</Button>
    </div>
  )
}