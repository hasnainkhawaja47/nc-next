'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { addPayment, getFirmBalance } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function PaymentsForm({ firms }) {
  const [query, setQuery] = useState('')
  const [selectedFirm, setSelectedFirm] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [method, setMethod] = useState('Cash')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState(null)
  const [error, setError] = useState(null)
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

    const formData = new FormData(e.target)
    formData.set('firm_id', selectedFirm.id)
    formData.set('payment_date', format(date, 'yyyy-MM-dd'))


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

  const numericAmount = Number(amount) || 0
  const newBalance = balance != null ? balance - numericAmount : null

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
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type to search..."
            autoComplete="off"
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-20 bg-background border rounded-lg shadow-md w-full mt-1 max-h-48 overflow-auto animate-in fade-in slide-in-from-top-1">
              {filtered.map((f) => (
                <div
                  key={f.id}
                  onClick={() => selectFirm(f)}
                  className="px-3 py-2 text-sm hover:bg-muted cursor-pointer transition-colors"
                >
                  {f.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" className="w-full h-10 rounded-lg justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PP') : 'Pick a date'}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label>Amount (Rs)</Label>
          <Input
            className="h-10 rounded-lg"
            name="amount"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Payment method</Label>
          <RadioGroup
            name="method"
            value={method}
            onValueChange={setMethod}
            className="grid grid-cols-2 gap-2"
          >
            {['Cash', 'Cheque', 'Bank Transfer', 'Draft'].map((option) => (
              <label
                key={option}
                htmlFor={option}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${method === option ? 'border-primary bg-muted/50' : 'hover:bg-muted/30'
                  }`}
              >
                <RadioGroupItem value={option} id={option} />
                {option}
              </label>
            ))}
          </RadioGroup>
        </div>

        {method !== 'Cash' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
            <div className="space-y-1.5">
              <Label>Bank name</Label>
              <Input className="h-10 rounded-lg" name="bank_name" />
            </div>
            <div className="space-y-1.5">
              <Label>Cheque / Reference #</Label>
              <Input className="h-10 rounded-lg" name="cheque_number" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Memo</Label>
          <Input className="h-10 rounded-lg" name="memo" placeholder="Optional note" />
        </div>

        {error && <p className="text-red-600 text-xs animate-in fade-in slide-in-from-top-1">{error}</p>}

        {selectedFirm && balance != null && (
          <div className="rounded-xl bg-muted/50 border p-4 space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current balance</span>
              <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                Rs {balance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment amount</span>
              <span>- Rs {numericAmount.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-semibold">
              <span>New balance</span>
              <span className={newBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                Rs {newBalance.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-lg h-10"
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
          <Button type="submit" className="flex-1 rounded-lg h-10">
            Save payment
          </Button>
        </div>
      </form>
    </div>
  )
}