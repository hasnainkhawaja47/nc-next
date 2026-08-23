'use client'

import { useState, useRef } from 'react'
import { addPayment } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function PaymentsForm({ firms }) {
  const [query, setQuery] = useState('')
  const [selectedFirm, setSelectedFirm] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [method, setMethod] = useState('Cash')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const formRef = useRef(null)

  const filtered =
    query.length > 0
      ? firms.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : []

  function selectFirm(firm) {
    setSelectedFirm(firm)
    setQuery(firm.name)
    setShowDropdown(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedFirm) {
      setError('Please select a client from the list.')
      return
    }

    const formData = new FormData(e.target)
    formData.set('firm_id', selectedFirm.id)

    const result = await addPayment(formData)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(
      result.anomaly
        ? 'Payment saved — note: this exceeds the client\'s current balance.'
        : 'Payment saved.'
    )
    formRef.current.reset()
    setSelectedFirm(null)
    setQuery('')
    setMethod('Cash')
  }

  return (
    <div className="border rounded-lg p-4 max-w-md animate-in fade-in duration-300">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div className="relative space-y-1.5">
          <Label>Client name</Label>
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedFirm(null)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type to search..."
            autoComplete="off"
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-20 bg-background border rounded-md shadow-md w-full mt-1 max-h-48 overflow-auto animate-in fade-in slide-in-from-top-1">
              {filtered.map((f) => (
                <div
                  key={f.id}
                  onClick={() => selectFirm(f)}
                  className="px-3 py-1.5 text-sm hover:bg-muted cursor-pointer transition-colors"
                >
                  {f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input name="payment_date" type="date" required />
        </div>

        <div className="space-y-1.5">
          <Label>Amount (Rs)</Label>
          <Input name="amount" type="number" min="0" required />
        </div>

        <div className="space-y-1.5">
          <Label>Payment method</Label>
          <select
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full h-9 border rounded-md px-3 text-sm bg-background"
          >
            <option>Cash</option>
            <option>Cheque</option>
            <option>Bank Transfer</option>
            <option>Draft</option>
          </select>
        </div>

        {method !== 'Cash' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
            <div className="space-y-1.5">
              <Label>Bank name</Label>
              <Input name="bank_name" />
            </div>
            <div className="space-y-1.5">
              <Label>Cheque / Reference #</Label>
              <Input name="cheque_number" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Memo</Label>
          <Input name="memo" placeholder="Optional note" />
        </div>

        {error && <p className="text-red-600 text-xs animate-in fade-in slide-in-from-top-1">{error}</p>}
        {success && <p className="text-green-600 text-xs animate-in fade-in slide-in-from-top-1">{success}</p>}

        <Button type="submit" className="w-full">
          Save payment
        </Button>
      </form>
    </div>
  )
}