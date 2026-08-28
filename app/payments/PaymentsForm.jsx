'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { addPayment, getFirmBalance } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import PaymentFields from './PaymentFields'

export default function PaymentsForm({ firms }) {
  const [query, setQuery] = useState('')
  const [selectedFirm, setSelectedFirm] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedFirm, setHighlightedFirm] = useState(-1)
  const [method, setMethod] = useState('Cash')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const formRef = useRef(null)
  const [date, setDate] = useState(new Date())

  const filtered =
    query.length > 0
      ? firms.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : []

  async function selectFirm(firm) {
    setSelectedFirm(firm)
    setQuery(firm.name)
    setShowDropdown(false)
    setBalance(null)
    const bal = await getFirmBalance(firm.id)
    setBalance(bal)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!selectedFirm) {
      setError('Please select a client from the list.')
      return
    }

    setLoading(true)

    const formData = new FormData(e.target)
    formData.set('firm_id', selectedFirm.id)

    const result = await addPayment(formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast.success(
      result.anomaly
        ? 'Payment saved — exceeds current balance'
        : 'Payment saved'
    )
    formRef.current.reset()
    setSelectedFirm(null)
    setQuery('')
    setMethod('Cash')
    setAmount('')
    setBalance(null)
    setDate(new Date())
  }

  return (
    <div className="border rounded-xl p-6 max-w-md animate-in fade-in duration-300 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Record payment</h2>
        <p className="text-sm text-muted-foreground">Log a payment received from a client</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="relative space-y-1.5">
          <Label>Client name</Label>
          <Input
            className="h-10 rounded-lg"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedFirm(null)
              setBalance(null)
              setShowDropdown(true)
              setHighlightedFirm(-1)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onKeyDown={(e) => {
              if (!showDropdown || filtered.length === 0) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setHighlightedFirm((i) => (i + 1) % filtered.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlightedFirm((i) => (i <= 0 ? filtered.length - 1 : i - 1))
              } else if (e.key === 'Tab' && highlightedFirm >= 0) {
                selectFirm(filtered[highlightedFirm])
              } else if (e.key === 'Enter' && highlightedFirm >= 0) {
                e.preventDefault()
                selectFirm(filtered[highlightedFirm])
              } else if (e.key === 'Escape') {
                setShowDropdown(false)
              }
            }}
            placeholder="Type to search..."
            autoComplete="off"
            disabled={loading}
          />
          {showDropdown && !loading && filtered.length > 0 && (
            <div className="absolute z-20 bg-background border rounded-lg shadow-md w-full mt-1 max-h-48 overflow-auto animate-in fade-in slide-in-from-top-1">
              {filtered.map((f, i) => (
                <div
                  key={f.id}
                  onMouseDown={(e) => { e.preventDefault(); selectFirm(f) }}
                  onMouseEnter={() => setHighlightedFirm(i)}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    i === highlightedFirm ? 'bg-muted' : 'hover:bg-muted'
                  }`}
                >
                  {f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <PaymentFields
          date={date}
          setDate={setDate}
          amount={amount}
          setAmount={setAmount}
          method={method}
          setMethod={setMethod}
          balance={selectedFirm ? balance : null}
          disabled={loading}
        />

        {error && <p className="text-red-600 text-xs animate-in fade-in slide-in-from-top-1">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-lg h-10"
            disabled={loading}
            onClick={() => {
              formRef.current.reset()
              setSelectedFirm(null)
              setQuery('')
              setMethod('Cash')
              setAmount('')
              setBalance(null)
              setDate(new Date())
              setError(null)
            }}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1 rounded-lg h-10" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save payment'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}