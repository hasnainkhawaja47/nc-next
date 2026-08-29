'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ToWords } from 'to-words'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { X } from 'lucide-react'
import { saveBill, updateBill, getPreviousBalance } from './actions'
import { useActivity } from '@/lib/activity-context'
import { forwardRef } from 'react'

const toWords = new ToWords({ localeCode: 'en-IN' })

const itemSchema = z.object({
  product_name: z.string(),
  colour: z.string().optional(),
  size: z.string().optional(),
  quantity: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  product_id: z.number().nullable().optional(),
})

const schema = z
  .object({
    firm_id: z
      .number({ invalid_type_error: 'Please select a client.' })
      .nullable()
      .refine((v) => v != null, 'Please select a client.'),
    bill_date: z.string().min(1, 'Date is required.'),
    bilty_no: z.string().optional(),
    do_no: z.string().optional(),
    bilty_charges: z.coerce.number().min(0).default(0),
    packaging_charges: z.coerce.number().min(0).default(0),
    is_credit: z.boolean().default(true),
    items: z.array(itemSchema),
  })
  .superRefine((data, ctx) => {
    const valid = data.items.filter((i) => i.product_name?.trim() && i.quantity > 0 && i.price > 0)
    if (valid.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items'],
        message: 'Add at least one item with a product, quantity, and price.',
      })
    }
  })

const emptyRow = {
  product_name: '',
  colour: '',
  size: '',
  quantity: 0,
  price: 0,
  product_id: null,
}

function isRowComplete(row) {
  return (
    Boolean(row?.product_name?.trim()) &&
    Boolean(row?.colour?.trim()) &&
    Boolean(row?.size?.trim()) &&
    Number(row?.quantity) > 0 &&
    Number(row?.price) > 0
  )
}

function ProductDropdown({ anchorRef, matches, onSelect, show }) {
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(rect.width, 220) })
    } else {
      setCoords(null)
    }
  }, [show, anchorRef])

  if (!show || !coords || matches.length === 0) return null

  return createPortal(
    <div
      style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 1000 }}
      className="bg-background border rounded-md shadow-md max-h-48 overflow-auto"
    >
      {matches.map((p) => (
        <div
          key={p.id}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(p)
          }}
          className="px-3 py-1.5 text-sm hover:bg-muted cursor-pointer flex justify-between transition-colors"
        >
          <span><strong>{p.code}</strong> — {p.name}</span>
          <span className="text-muted-foreground">Rs {p.standard_price}</span>
        </div>
      ))}
    </div>,
    document.body
  )
}

// Quiet, borderless-until-focus cell input for the line-items table
const Cell = forwardRef(function Cell({ className = '', numeric = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={`w-full bg-transparent border border-transparent rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted focus:outline-none focus:bg-background focus:border-ring ${numeric ? 'text-right tabular-nums font-mono' : ''
        } ${className}`}
    />
  )
})

function ItemRow({
  index,
  register,
  watch,
  setValue,
  products,
  onSelectProduct,
  onRemove,
  canRemove,
  isLastRow,
  append,
}) {
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  function handleCellChange(field, value) {
    const currentRow = watch(`items.${index}`)

    const nextRow = {
      ...currentRow,
      [field]: value,
    }

    setValue(`items.${index}.${field}`, value)

    if (isLastRow && isRowComplete(nextRow)) {
      append({ ...emptyRow }, { shouldFocus: false })
    }
  }
  const quantity = Number(watch(`items.${index}.quantity`)) || 0
  const price = Number(watch(`items.${index}.price`)) || 0
  const total = quantity * price

  const matches =
    query.length > 0
      ? products.filter((p) => p.code.toLowerCase().startsWith(query.toLowerCase()) || p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : []

  const { ref: rhfRef, onChange: rhfOnChange, ...rest } = register(`items.${index}.product_name`)

  return (
    <tr className="border-b last:border-b-0">
      <td className="w-9 text-center text-xs text-muted-foreground font-mono">{index + 1}</td>
      <td className="relative">
        <Cell
          {...rest}
          ref={(el) => { rhfRef(el); inputRef.current = el }}
          onChange={(e) => {
            rhfOnChange(e)
            setQuery(e.target.value)
            setShowDropdown(true)

            const currentRow = watch(`items.${index}`)

            const nextRow = {
              ...currentRow,
              product_name: e.target.value,
            }

            if (isLastRow && isRowComplete(nextRow)) {
              append({ ...emptyRow }, { shouldFocus: false })
            }
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Code or name..."
          autoComplete="off"
        />
        <ProductDropdown
          anchorRef={inputRef}
          matches={matches}
          show={showDropdown}
          onSelect={(p) => {
            onSelectProduct(index, p)
            setQuery('')
            setShowDropdown(false)
          }}
        />
      </td>
      <td className="w-24">
        <Cell
          {...register(`items.${index}.colour`)}
          onChange={(e) => handleCellChange('colour', e.target.value)}
        />
      </td>
      <td className="w-20">
        <Cell
          {...register(`items.${index}.size`)}
          onChange={(e) => handleCellChange('size', e.target.value)}
        />
      </td>
      <td className="w-20">
        <Cell
          numeric
          type="number"
          placeholder="0"
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          onChange={(e) => handleCellChange('quantity', e.target.value)}
        />
      </td>
      <td className="w-24">
        <Cell
          numeric
          type="number"
          placeholder="0"
          {...register(`items.${index}.price`, { valueAsNumber: true })}
          onChange={(e) => handleCellChange('price', e.target.value)}
        />
      </td>
      <td className="w-28 text-right pr-2.5">
        <span className={`text-sm font-mono tabular-nums ${total > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {total > 0 ? total.toLocaleString() : '—'}
        </span>
      </td>
      <td className="w-9 text-center">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </td>
    </tr>
  )
}

export default function NewBillForm({ firms, products, initialBill }) {
  const router = useRouter()
  const { addActivity, updateActivity } = useActivity()
  const editingBillId = initialBill?.bill?.id || null

  const [clientQuery, setClientQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [prevBalance, setPrevBalance] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const clientInputRef = useRef(null)

  function buildDefaults() {
    if (initialBill?.bill) {
      return {
        firm_id: initialBill.bill.firm_id,
        bill_date: initialBill.bill.bill_date,
        bilty_no: initialBill.bill.bilty_no || '',
        do_no: initialBill.bill.do_no || '',
        bilty_charges: initialBill.bill.bilty_charges || 0,
        packaging_charges: initialBill.bill.packaging_charges || 0,
        is_credit: initialBill.bill.is_credit,
        items: [
          ...initialBill.items.map((i) => ({
            product_name: i.product_name,
            colour: i.colour || '',
            size: i.size || '',
            quantity: i.quantity,
            price: i.price,
            product_id: i.product_id,
          })),
          emptyRow,
        ],
      }
    }
    return {
      firm_id: null,
      bill_date: new Date().toISOString().split('T')[0],
      bilty_no: '',
      do_no: '',
      bilty_charges: 0,
      packaging_charges: 0,
      is_credit: true,
      items: [{ ...emptyRow }],
    }
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: buildDefaults(),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedBilty = watch('bilty_charges') || 0
  const watchedPkg = watch('packaging_charges') || 0
  const watchedIsCredit = watch('is_credit')



  useEffect(() => {
    if (initialBill?.bill) {
      const firm = firms.find((f) => f.id === initialBill.bill.firm_id)
      if (firm) {
        setClientQuery(firm.name)
        getPreviousBalance(firm.id).then((bal) => {
          setPrevBalance(bal - initialBill.bill.total_amount)
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const itemsTotal = (watch('items') || []).reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0),
    0
  )
  const grandTotal = itemsTotal + Number(watchedBilty) + Number(watchedPkg)
  const amountWords = grandTotal > 0 ? toWords.convert(grandTotal, { currency: true }) : ''
  const newBalance = prevBalance != null ? prevBalance + grandTotal : null

  const filteredFirms =
    clientQuery.length > 0 ? firms.filter((f) => f.name.toLowerCase().includes(clientQuery.toLowerCase())).slice(0, 8) : []

  async function selectFirm(firm) {
    setValue('firm_id', firm.id, { shouldValidate: true })
    setClientQuery(firm.name)
    setShowClientDropdown(false)
    const bal = await getPreviousBalance(firm.id)
    setPrevBalance(bal)
  }

  function selectProduct(index, product) {
    setValue(`items.${index}.product_name`, product.name, { shouldValidate: true })
    setValue(`items.${index}.product_id`, product.id)

    const currentPrice = watch(`items.${index}.price`)

    if (!currentPrice) {
      setValue(`items.${index}.price`, product.standard_price)
    }
  }

  function startNewBill() {
    setSubmitted(false)
    reset({
      firm_id: null,
      bill_date: new Date().toISOString().split('T')[0],
      bilty_no: '',
      do_no: '',
      bilty_charges: 0,
      packaging_charges: 0,
      is_credit: true,
      items: [{ ...emptyRow }],
    })
    setClientQuery('')
    setPrevBalance(null)
  }

  async function onSubmit(data) {
    setSubmitted(true)
    const cleanItems = data.items
      .filter((i) => i.product_name?.trim() && i.quantity > 0 && i.price > 0)
      .map((i) => ({ ...i, quantity: Number(i.quantity), price: Number(i.price) }))

    const result = editingBillId
      ? await updateBill(editingBillId, { ...data, items: cleanItems })
      : await saveBill({ ...data, items: cleanItems })

    if (result.error) {
      toast.error(result.error)
      return
    }

    const firm = firms.find((f) => f.id === data.firm_id)

    if (editingBillId) {
      updateActivity(editingBillId, {
        firmId: data.firm_id,
        firmName: firm?.name || '',
        amount: result.bill.total_amount,
        date: result.bill.bill_date,
        bill: result.bill,
        items: result.items,
        amountWords: toWords.convert(result.bill.total_amount, { currency: true }),
        prevBalance: prevBalance || 0,
      })

      toast.success(`Bill #${result.bill.id} updated`)
      router.push('/new-bill')
      return
    }

    const hasAnomaly = result.anomalies && result.anomalies.length > 0
    toast.success(hasAnomaly ? `Bill #${result.bill.id} saved — ${result.anomalies[0].type} detected` : `Bill #${result.bill.id} saved`)

    addActivity({
      billId: result.bill.id,
      firmId: data.firm_id,
      firmName: firm?.name || '',
      amount: result.bill.total_amount,
      date: result.bill.bill_date,
      bill: result.bill,
      items: result.items,
      amountWords: toWords.convert(result.bill.total_amount, { currency: true }),
      prevBalance: prevBalance || 0,
    })
    startNewBill()
  }

  const onInvalid = () => setSubmitted(true)

  return (
    <div className="max-w-4xl">
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h1 className="text-xl font-semibold tracking-tight">
            {editingBillId ? 'Edit Bill' : 'New Bill'}
          </h1>
          {editingBillId ? (
            <Badge variant="secondary" className="font-mono">Bill #{editingBillId}</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">Unsaved</Badge>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <div className="relative space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client name</Label>
              <Input
                ref={clientInputRef}
                value={clientQuery}
                onChange={(e) => {
                  setClientQuery(e.target.value)
                  setShowClientDropdown(true)
                  setValue('firm_id', null, { shouldValidate: true })
                  setPrevBalance(null)
                }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => setTimeout(() => setShowClientDropdown(false), 150)}
                placeholder="Type to search..."
                autoComplete="off"
              />
              {showClientDropdown && filteredFirms.length > 0 && (
                <div className="absolute z-20 bg-background border rounded-md shadow-md w-full mt-1 max-h-48 overflow-auto animate-in fade-in slide-in-from-top-1">
                  {filteredFirms.map((f) => (
                    <div
                      key={f.id}
                      onMouseDown={(e) => { e.preventDefault(); selectFirm(f) }}
                      className="px-3 py-1.5 text-sm hover:bg-muted cursor-pointer transition-colors"
                    >
                      {f.name}
                    </div>
                  ))}
                </div>
              )}
              {submitted && errors.firm_id && <p className="text-red-600 text-xs">{errors.firm_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" {...register('bill_date')} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bilty #</Label>
              <Input {...register('bilty_no')} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">D/O #</Label>
              <Input {...register('do_no')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Payment</Label>
            <ToggleGroup
              type="single"
              value={[watchedIsCredit ? 'credit' : 'cash']}
              onValueChange={(val) => {
                if (val.length > 0) setValue('is_credit', val[0] === 'credit')
              }}
              className="inline-flex bg-muted rounded-lg p-1 gap-1 w-fit"
            >
              <ToggleGroupItem value="cash" className="rounded-md px-5 data-[pressed]:bg-background data-[pressed]:shadow-sm">
                Cash
              </ToggleGroupItem>
              <ToggleGroupItem value="credit" className="rounded-md px-5 data-[pressed]:bg-background data-[pressed]:shadow-sm">
                Credit
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {prevBalance != null && (
            <div className="text-sm">
              Previous balance:{' '}
              <span className={`font-medium ${prevBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Rs {prevBalance.toLocaleString()}
              </span>
            </div>
          )}

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="w-9 py-2.5 text-[11px] uppercase tracking-wide text-muted-foreground font-medium"></th>
                  <th className="py-2.5 pl-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Particular</th>
                  <th className="w-24 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Colour</th>
                  <th className="w-20 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Size</th>
                  <th className="w-20 py-2.5 text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Qty</th>
                  <th className="w-24 py-2.5 text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Price</th>
                  <th className="w-28 py-2.5 pr-2.5 text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Total</th>
                  <th className="w-9"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <ItemRow
                    key={field.id}
                    index={index}
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    products={products}
                    onSelectProduct={selectProduct}
                    onRemove={remove}
                    canRemove={fields.length > 1}
                    isLastRow={index === fields.length - 1}
                    append={append}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {submitted && errors.items && <p className="text-red-600 text-xs">{errors.items.message}</p>}

          <div className="border-t pt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="flex gap-4">
              <div className="w-32 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bilty charges</Label>
                <Input type="number" className="font-mono tabular-nums" {...register('bilty_charges', { valueAsNumber: true })} />
              </div>
              <div className="w-32 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Packaging</Label>
                <Input type="number" className="font-mono tabular-nums" {...register('packaging_charges', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="flex items-center gap-5 ml-auto">
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Grand total</div>
                <div className="font-mono tabular-nums text-2xl font-semibold tracking-tight">
                  <span className="text-sm text-muted-foreground font-sans mr-1">Rs</span>
                  {grandTotal.toLocaleString()}
                </div>
                {amountWords && <div className="text-[11px] text-muted-foreground mt-0.5">{amountWords}</div>}
                {newBalance != null && (
                  <div className="text-xs mt-1">
                    New balance:{' '}
                    <span className="text-red-600 font-medium">Rs {newBalance.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <Button type="submit" size="lg" disabled={!isValid || isSubmitting}>
                {isSubmitting ? 'Saving...' : editingBillId ? 'Update bill' : 'Save bill'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}