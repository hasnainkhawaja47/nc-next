'use client'

import { useState, useRef } from 'react'
import { addPayment } from './actions'

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
    <div className="border rounded-lg p-4 max-w-md">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <label className="text-xs text-gray-600">Client name</label>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedFirm(null)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type to search..."
            autoComplete="off"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-20 bg-white border rounded shadow-md w-full mt-1 max-h-48 overflow-auto">
              {filtered.map((f) => (
                <div
                  key={f.id}
                  onClick={() => selectFirm(f)}
                  className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  {f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-600">Date</label>
          <input name="payment_date" type="date" required className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        <div>
          <label className="text-xs text-gray-600">Amount (Rs)</label>
          <input name="amount" type="number" min="0" required className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        <div>
          <label className="text-xs text-gray-600">Payment method</label>
          <select
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            <option>Cash</option>
            <option>Cheque</option>
            <option>Bank Transfer</option>
            <option>Draft</option>
          </select>
        </div>

        {method !== 'Cash' && (
          <>
            <div>
              <label className="text-xs text-gray-600">Bank name</label>
              <input name="bank_name" className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Cheque / Reference #</label>
              <input name="cheque_number" className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-gray-600">Memo</label>
          <input name="memo" placeholder="Optional note" className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        {error && <p className="text-red-600 text-xs">{error}</p>}
        {success && <p className="text-green-600 text-xs">{success}</p>}

        <button type="submit" className="bg-[#1a1a2e] text-white px-4 py-2 rounded text-sm w-full">
          Save payment
        </button>
      </form>
    </div>
  )
}