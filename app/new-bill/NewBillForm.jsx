'use client'
import { showBillSavedToast } from './billSavedToast'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ToWords } from 'to-words'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { saveBill, getPreviousBalance } from './actions'


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

const emptyRow = { product_name: '', colour: '', size: '', quantity: 0, price: 0, product_id: null }

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
      className="bg-white border rounded-md shadow-md max-h-48 overflow-auto"
    >
      {matches.map((p) => (
        <div
          key={p.id}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(p)
          }}
          className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer flex justify-between"
        >
          <span><strong>{p.code}</strong> — {p.name}</span>
          <span className="text-gray-400">Rs {p.standard_price}</span>
        </div>
      ))}
    </div>,
    document.body
  )
}

function ItemRow({ index, register, watch, setValue, products, onSelectProduct, onRemove, canRemove }) {
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const quantity = Number(watch(`items.${index}.quantity`)) || 0
  const price = Number(watch(`items.${index}.price`)) || 0

  const matches =
    query.length > 0
      ? products.filter((p) => p.code.toLowerCase().startsWith(query.toLowerCase()) || p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : []

  const { ref: rhfRef, onChange: rhfOnChange, ...rest } = register(`items.${index}.product_name`)

  return (
    <TableRow>
      <TableCell className="text-gray-400 text-xs w-6">{index + 1}</TableCell>
      <TableCell className="relative">
        <Input
          {...rest}
          ref={(el) => { rhfRef(el); inputRef.current = el }}
          onChange={(e) => {
            rhfOnChange(e)
            setQuery(e.target.value)
            setShowDropdown(true)
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
      </TableCell>
      <TableCell className="w-24"><Input {...register(`items.${index}.colour`)} /></TableCell>
      <TableCell className="w-20"><Input {...register(`items.${index}.size`)} /></TableCell>
      <TableCell className="w-20"><Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} /></TableCell>
      <TableCell className="w-24"><Input type="number" {...register(`items.${index}.price`, { valueAsNumber: true })} /></TableCell>
      <TableCell className="w-24 text-sm font-medium">{quantity * price > 0 ? (quantity * price).toLocaleString() : '—'}</TableCell>
      <TableCell className="w-8">
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)} className="text-red-600 text-xs">✕</button>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function NewBillForm({ firms, products }) {
  const [clientQuery, setClientQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [prevBalance, setPrevBalance] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const clientInputRef = useRef(null)
  const lastAppendedLength = useRef(0)

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
    defaultValues: {
      firm_id: null,
      bill_date: new Date().toISOString().split('T')[0],
      bilty_no: '',
      do_no: '',
      bilty_charges: 0,
      packaging_charges: 0,
      is_credit: true,
      items: [emptyRow, emptyRow],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const watchedBilty = watch('bilty_charges') || 0
  const watchedPkg = watch('packaging_charges') || 0

  // Auto-append a new row once the last row starts getting filled in
  useEffect(() => {
    const last = watchedItems[watchedItems.length - 1]
    if (last?.product_name?.trim() && lastAppendedLength.current !== watchedItems.length) {
      lastAppendedLength.current = watchedItems.length + 1
      append(emptyRow)
    }
  }, [watchedItems, append])

  const itemsTotal = watchedItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0)
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
    if (!watchedItems[index].price) {
      setValue(`items.${index}.price`, product.standard_price)
    }
  }

  function startNewBill() {
    lastAppendedLength.current = 0
    setSubmitted(false)
    reset({
      firm_id: null,
      bill_date: new Date().toISOString().split('T')[0],
      bilty_no: '',
      do_no: '',
      bilty_charges: 0,
      packaging_charges: 0,
      is_credit: true,
      items: [emptyRow, emptyRow],
    })
    setClientQuery('')
    setPrevBalance(null)
  }

  async function onSubmit(data) {
    setSubmitted(true)
    const cleanItems = data.items
      .filter((i) => i.product_name?.trim() && i.quantity > 0 && i.price > 0)
      .map((i) => ({ ...i, quantity: Number(i.quantity), price: Number(i.price) }))

    const result = await saveBill({ ...data, items: cleanItems })

    if (result.error) {
      toast.error(result.error)
      return
    }

    const firm = firms.find((f) => f.id === data.firm_id)

    showBillSavedToast({
      bill: result.bill,
      firmName: firm?.name || '',
      items: result.items,
      amountWords: toWords.convert(result.bill.total_amount, { currency: true }),
      prevBalance: prevBalance || 0,
      onStartNew: startNewBill,
    })
    // form intentionally stays populated until "Start new bill" is clicked in the toast
  }
  const onInvalid = () => setSubmitted(true)

  return (
    <div className="max-w-4xl">
      <Card className="p-4 space-y-4">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative space-y-1.5">
              <label className="text-sm font-medium">Client name</label>
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
                <div className="absolute z-20 bg-white border rounded-md shadow-md w-full mt-1 max-h-48 overflow-auto">
                  {filteredFirms.map((f) => (
                    <div
                      key={f.id}
                      onMouseDown={(e) => { e.preventDefault(); selectFirm(f) }}
                      className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                    >
                      {f.name}
                    </div>
                  ))}
                </div>
              )}
              {submitted && errors.firm_id && <p className="text-red-600 text-xs">{errors.firm_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" {...register('bill_date')} />
              {submitted && errors.bill_date && <p className="text-red-600 text-xs">{errors.bill_date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Bilty #</label>
              <Input {...register('bilty_no')} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">D/O #</label>
              <Input {...register('do_no')} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant={!watch('is_credit') ? 'default' : 'outline'} onClick={() => setValue('is_credit', false)}>Cash</Button>
            <Button type="button" variant={watch('is_credit') ? 'default' : 'outline'} onClick={() => setValue('is_credit', true)}>Credit</Button>
          </div>

          {prevBalance != null && (
            <div className="text-sm">
              Previous balance:{' '}
              <span className={prevBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                Rs {prevBalance.toLocaleString()}
              </span>
            </div>
          )}

          <div className="overflow-x-auto border rounded-md">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-6">#</TableHead>
                  <TableHead>Particular</TableHead>
                  <TableHead className="w-24">Colour</TableHead>
                  <TableHead className="w-20">Size</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-24">Price</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          {submitted && errors.items && <p className="text-red-600 text-xs">{errors.items.message}</p>}

          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Bilty charges</label>
              <Input type="number" {...register('bilty_charges', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Packaging</label>
              <Input type="number" {...register('packaging_charges', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="text-lg font-semibold">Grand total: Rs {grandTotal.toLocaleString()}</div>
          {amountWords && <div className="text-xs text-gray-500">{amountWords}</div>}
          {newBalance != null && (
            <div className="text-sm">
              New balance: <span className="text-red-600 font-medium">Rs {newBalance.toLocaleString()}</span>
            </div>
          )}

          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save bill'}
          </Button>
        </form>
      </Card>

    </div>
  )
}