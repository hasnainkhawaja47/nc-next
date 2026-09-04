'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

// Shared date/amount/method/bank/cheque/memo fields + balance preview,
// used by both PaymentsForm (new payment) and EditPaymentDialog (edit
// existing payment). Client picking and submit handling stay in each
// parent, since those differ (search-and-pick vs. fetched-on-open).
export default function PaymentFields({
  date,
  setDate,
  amount,
  setAmount,
  method,
  setMethod,
  bankNameDefault = '',
  chequeNumberDefault = '',
  memoDefault = '',
  balance = null,
  disabled = false,
}) {
  const numericAmount = Number(amount) || 0
  const newBalance = balance != null ? balance - numericAmount : null

  return (
    <>
      <input type="hidden" name="payment_date" value={date ? format(date, 'yyyy-MM-dd') : ''} required />

      <div className="space-y-1.5">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 rounded-lg justify-start font-normal"
                disabled={disabled}
              >
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
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Payment method</Label>
        <RadioGroup
          name="method"
          value={method}
          onValueChange={setMethod}
          className="grid grid-cols-2 gap-2"
          disabled={disabled}
        >
          {['Cash', 'Cheque', 'Bank Transfer', 'Return'].map((option) => (
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

      {(method === 'Cheque' || method === 'Bank Transfer') && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="space-y-1.5">
            <Label>Bank name</Label>
            <Input className="h-10 rounded-lg" name="bank_name" defaultValue={bankNameDefault} disabled={disabled} />
          </div>
          <div className="space-y-1.5">
            <Label>Cheque / Reference #</Label>
            <Input className="h-10 rounded-lg" name="cheque_number" defaultValue={chequeNumberDefault} disabled={disabled} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Memo</Label>
        <Input
          className="h-10 rounded-lg"
          name="memo"
          placeholder={method === 'Return' ? 'Which items were returned...' : 'Optional note'}
          defaultValue={memoDefault}
          disabled={disabled}
        />
      </div>

      {balance != null && (
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
    </>
  )
}