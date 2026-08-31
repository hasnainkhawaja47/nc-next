'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
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

// Strips everything but digits and caps the digit count. Used for every
// numeric field's onChange, because `maxLength` is silently ignored by
// browsers on <input type="number"> — it only works on type="text".
function sanitizeDigits(value, maxDigits) {
  return (value || '').replace(/[^\d]/g, '').slice(0, maxDigits)
}

const itemSchema = z.object({
  product_name: z.string().max(40, 'Max 40 characters'),
  colour: z.string().max(15, 'Max 15 characters'),
  size: z.string().max(10, 'Max 10 characters'),
  quantity: z.coerce.number().min(0).max(50000, 'Max 50,000'),
  price: z.coerce.number().min(0).max(999999, 'Max 999,999'),
  product_id: z.number().nullable().optional(),
})

const schema = z
  .object({
    firm_id: z
      .number({ invalid_type_error: 'Please select a client.' })
      .nullable()
      .refine((v) => v != null, 'Please select a client.'),
    bill_date: z.string().min(1, 'Date is required.'),
    bilty_no: z.string().max(15, 'Max 15 characters').optional(),
    do_no: z.string().min(1, 'Required').max(5, 'Max 5 digits').regex(/^\d*$/, 'Numeric only'),
    bilty_charges: z.coerce.number().min(0).max(9999999, 'Max 7 digits').default(0),
    packaging_charges: z.coerce.number().min(0).max(9999999, 'Max 7 digits').default(0),
    is_credit: z.boolean().default(true),
    items: z.array(itemSchema),
  })
  .superRefine((data, ctx) => {
    const valid = data.items.filter((i) => i.product_name?.trim() && i.quantity > 0 && i.price > 0)
    if (valid.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'Add at least one item with a product, quantity, and price.',
      })
    }

    // Once a row has any data in it, all 5 item fields become required for
    // that row. The trailing auto-appended blank row is naturally exempt
    // since it has nothing filled in yet.
    data.items.forEach((item, index) => {
      const anyFilled =
        Boolean(item.product_name?.trim()) ||
        Boolean(item.colour?.trim()) ||
        Boolean(item.size?.trim()) ||
        item.quantity > 0 ||
        item.price > 0
      if (!anyFilled) return

      if (!item.product_name?.trim())
        ctx.addIssue({ code: 'custom', path: ['items', index, 'product_name'], message: 'Required' })
      if (!item.colour?.trim())
        ctx.addIssue({ code: 'custom', path: ['items', index, 'colour'], message: 'Required' })
      if (!item.size?.trim())
        ctx.addIssue({ code: 'custom', path: ['items', index, 'size'], message: 'Required' })
      if (!(item.quantity > 0))
        ctx.addIssue({ code: 'custom', path: ['items', index, 'quantity'], message: 'Required' })
      if (!(item.price > 0))
        ctx.addIssue({ code: 'custom', path: ['items', index, 'price'], message: 'Required' })
    })
  })

const emptyRow = {
  product_name: '',
  colour: '',
  size: '',
  quantity: 0,
  price: 0,
  product_id: null,
}

// Single source of truth for a blank bill's default values, used by both
// buildDefaults() (no initialBill case) and startNewBill(), so the two
// can never quietly drift apart from each other.
function emptyBillDefaults() {
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

function isRowComplete(row) {
  return (
    Boolean(row?.product_name?.trim()) &&
    Boolean(row?.colour?.trim()) &&
    Boolean(row?.size?.trim()) &&
    Number(row?.quantity) > 0 &&
    Number(row?.price) > 0
  )
}

// Shared arrow-key / Tab / Enter / Escape combobox navigation, used by both
// the client picker and the product picker below. Having this in one place
// means both pickers behave identically and a future change only needs to
// happen once, instead of two copies quietly drifting apart.
function useComboboxNav({ show, items, onSelect, onClose }) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  function handleKeyDown(e) {
    if (!show || items.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => (i <= 0 ? items.length - 1 : i - 1))
    } else if (e.key === 'Tab' && highlightedIndex >= 0) {
      // No preventDefault here — Tab should still move focus onward after
      // committing the highlighted selection, not get trapped.
      onSelect(items[highlightedIndex])
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      onSelect(items[highlightedIndex])
    } else if (e.key === 'Escape') {
      onClose?.()
    }
  }

  return { highlightedIndex, setHighlightedIndex, handleKeyDown }
}

function ProductDropdown({ anchorRef, matches, onSelect, show, highlightedIndex, onHighlight }) {
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
      {matches.map((p, i) => (
        <div
          key={p.id}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(p)
          }}
          onMouseEnter={() => onHighlight(i)}
          className={`px-3 py-1.5 text-sm cursor-pointer flex justify-between transition-colors ${i === highlightedIndex ? 'bg-muted' : 'hover:bg-muted'
            }`}
        >
          <span><strong>{p.code}</strong> — {p.name}</span>
          <span className="text-muted-foreground">Rs {p.standard_price}</span>
        </div>
      ))}
    </div>,
    document.body
  )
}

// Quiet, borderless-until-focus cell input for the line-items table.
// `error` swaps the transparent border for a red one when this cell has a
// validation error that should currently be shown.
const Cell = forwardRef(function Cell({ className = '', numeric = false, error = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={`w-full bg-transparent border rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted focus:outline-none focus:bg-background focus:border-ring ${error ? 'border-red-500' : 'border-transparent'
        } ${numeric ? 'text-right tabular-nums font-mono' : ''} ${className}`}
    />
  )
})

function CellError({ message }) {
  if (!message) return null
  return <p className="text-red-600 text-[10px] mt-0.5 px-2.5">{message}</p>
}

const ItemRow = memo(function ItemRow({
  index,
  register,
  watch,
  setValue,
  control,
  rowErrors,
  rowTouched,
  submitted,
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
    const nextRow = { ...currentRow, [field]: value }
    setValue(`items.${index}.${field}`, value, { shouldValidate: true })
    if (isLastRow && isRowComplete(nextRow)) {
      append({ ...emptyRow }, { shouldFocus: false })
    }
  }

  // useWatch (not the plain `watch()` call) so this row actually
  // re-subscribes and re-renders when its own quantity/price change. Plain
  // watch() inside a memoized component's render body doesn't trigger a
  // re-render on its own — it just reads whatever the value happened to be
  // at the last render the row already had for other reasons. That's why
  // the row total was freezing while the grand total (which does use
  // useWatch, in BillTotals) kept updating correctly.
  const rowValues = useWatch({ control, name: `items.${index}` })
  const quantity = Number(rowValues?.quantity) || 0
  const price = Number(rowValues?.price) || 0
  const total = quantity * price

  const matches =
    query.length > 0
      ? products.filter((p) => p.code.toLowerCase().startsWith(query.toLowerCase()) || p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : []

  function handleSelectProduct(p) {
    onSelectProduct(index, p)
    setQuery('')
    setShowDropdown(false)
  }

  const productNav = useComboboxNav({
    show: showDropdown,
    items: matches,
    onSelect: handleSelectProduct,
    onClose: () => setShowDropdown(false),
  })

  const { ref: rhfRef, onBlur: rhfOnBlur, onChange: rhfOnChange, ...rest } = register(`items.${index}.product_name`)

  return (
    <tr className="border-b last:border-b-0">
      <td className="w-9 text-center text-xs text-muted-foreground font-mono align-top pt-1.5">{index + 1}</td>
      <td className="relative align-top">
        <Cell
          {...rest}
          ref={(el) => { rhfRef(el); inputRef.current = el }}
          maxLength={40}
          error={(submitted || rowTouched?.product_name) && !!rowErrors?.product_name}
          onChange={(e) => {
            rhfOnChange(e)
            setQuery(e.target.value)
            setShowDropdown(true)
            productNav.setHighlightedIndex(-1)

            const currentRow = watch(`items.${index}`)

            const nextRow = {
              ...currentRow,
              product_name: e.target.value,
            }

            if (isLastRow && isRowComplete(nextRow)) {
              append({ ...emptyRow }, { shouldFocus: false })
            }
          }}
          onKeyDown={productNav.handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          onBlur={(e) => {
            rhfOnBlur(e)
            setTimeout(() => setShowDropdown(false), 150)
          }}
          placeholder="Code or name..."
          autoComplete="off"
        />
        <CellError message={(submitted || rowTouched?.product_name) && rowErrors?.product_name?.message} />
        <ProductDropdown
          anchorRef={inputRef}
          matches={matches}
          show={showDropdown}
          highlightedIndex={productNav.highlightedIndex}
          onHighlight={productNav.setHighlightedIndex}
          onSelect={handleSelectProduct}
        />
      </td>
      <td className="w-24 align-top">
        <Cell
          {...register(`items.${index}.colour`)}
          onChange={(e) => handleCellChange('colour', e.target.value)}
          maxLength={15}
          error={(submitted || rowTouched?.colour) && !!rowErrors?.colour}
        />
        <CellError message={(submitted || rowTouched?.colour) && rowErrors?.colour?.message} />
      </td>
      <td className="w-20 align-top">
        <Cell
          {...register(`items.${index}.size`)}
          onChange={(e) => handleCellChange('size', e.target.value)}
          maxLength={10}
          error={(submitted || rowTouched?.size) && !!rowErrors?.size}
        />
        <CellError message={(submitted || rowTouched?.size) && rowErrors?.size?.message} />
      </td>
      <td className="w-20 align-top">
        <Cell
          numeric
          type="number"
          placeholder="0"
          error={(submitted || rowTouched?.quantity) && !!rowErrors?.quantity}
          {...(() => {
            const { ref, onChange, ...r } = register(`items.${index}.quantity`, { valueAsNumber: true })
            return {
              ref,
              ...r,
              onChange: (e) => {
                e.target.value = sanitizeDigits(e.target.value, 5) // cap 50,000 → 5 digits
                onChange(e) // RHF coercion (valueAsNumber)
                handleCellChange('quantity', Number(e.target.value) || 0)
              },
            }
          })()}
        />
        <CellError message={(submitted || rowTouched?.quantity) && rowErrors?.quantity?.message} />
      </td>
      <td className="w-24 align-top">
        <Cell
          numeric
          type="number"
          placeholder="0"
          error={(submitted || rowTouched?.price) && !!rowErrors?.price}
          {...(() => {
            const { ref, onChange, ...r } = register(`items.${index}.price`, { valueAsNumber: true })
            return {
              ref,
              ...r,
              onChange: (e) => {
                e.target.value = sanitizeDigits(e.target.value, 6) // cap 999,999 → 6 digits
                onChange(e)
                handleCellChange('price', Number(e.target.value) || 0)
              },
            }
          })()}
        />
        <CellError message={(submitted || rowTouched?.price) && rowErrors?.price?.message} />
      </td>
      <td className="w-28 text-right pr-2.5 align-top pt-1.5">
        <span className={`text-sm font-mono tabular-nums ${total > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {total > 0 ? total.toLocaleString() : '—'}
        </span>
      </td>
      <td className="w-9 text-center align-top pt-1">
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
})

// Isolated so the grand-total math (which must recompute on every keystroke
// in every row) only re-renders this small block, not the whole form and
// every ItemRow along with it.
function BillTotals({ control, prevBalance }) {
  const items = useWatch({ control, name: 'items' })
  const biltyCharges = useWatch({ control, name: 'bilty_charges' })
  const packagingCharges = useWatch({ control, name: 'packaging_charges' })

  const itemsTotal = (items || []).reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0),
    0
  )
  const grandTotal = itemsTotal + Number(biltyCharges || 0) + Number(packagingCharges || 0)
  const amountWords = grandTotal > 0 ? toWords.convert(grandTotal, { currency: true }) : ''
  const newBalance = prevBalance != null ? prevBalance + grandTotal : null

  return (
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
  )
}

export default function NewBillForm({ firms, products, initialBill }) {
  const router = useRouter()
  const { addActivity, updateActivity } = useActivity()
  const editingBillId = initialBill?.bill?.id || null
  const [clientTouched, setClientTouched] = useState(false)
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
    return emptyBillDefaults()
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid, touchedFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: buildDefaults(),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedIsCredit = watch('is_credit')

  // Re-syncs the form whenever the target bill changes — covers entering
  // edit mode for a different bill, and navigating from an edit page back
  // to a plain "New Bill" (initialBill becomes null / firm_id in URL
  // disappears), since that's a real route/search-param change.
  useEffect(() => {
    reset(buildDefaults())
    setSubmitted(false)
    setClientTouched(false)

    if (initialBill?.bill) {
      const firm = firms.find((f) => f.id === initialBill.bill.firm_id)
      if (firm) {
        setClientQuery(firm.name)
        getPreviousBalance(firm.id).then((bal) => {
          setPrevBalance(bal - initialBill.bill.total_amount)
        })
      }
    } else {
      setClientQuery('')
      setPrevBalance(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBill?.bill?.id])

  // Handles the case the effect above can't: clicking the sidebar's "New
  // Bill" link while ALREADY sitting on plain /new-bill with a
  // partially-filled, unsaved form. The route/search-params don't change
  // in that case (no navigation occurs, initialBill?.bill?.id stays
  // undefined before and after), so nothing else in this component would
  // otherwise notice the click. The Sidebar dispatches a 'reset-new-bill'
  // window event on that click; this just needs to listen for it.
  useEffect(() => {
    function handleResetEvent() {
      if (editingBillId) {
        // Mid-edit: drop out of edit mode via a real navigation, which
        // re-triggers the initialBill-keyed effect above and clears
        // prevBalance/clientQuery consistently with that path.
        router.push('/new-bill')
      } else {
        startNewBill()
      }
    }
    window.addEventListener('reset-new-bill', handleResetEvent)
    return () => window.removeEventListener('reset-new-bill', handleResetEvent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBillId])

  const filteredFirms =
    clientQuery.length > 0 ? firms.filter((f) => f.name.toLowerCase().includes(clientQuery.toLowerCase())).slice(0, 8) : []

  async function selectFirm(firm) {
    setValue('firm_id', firm.id, { shouldValidate: true })
    setClientQuery(firm.name)
    setShowClientDropdown(false)
    const bal = await getPreviousBalance(firm.id)
    setPrevBalance(bal)
  }

  const clientNav = useComboboxNav({
    show: showClientDropdown,
    items: filteredFirms,
    onSelect: selectFirm,
    onClose: () => setShowClientDropdown(false),
  })

  const selectProduct = useCallback((index, product) => {
    setValue(`items.${index}.product_name`, product.name, { shouldValidate: true })
    setValue(`items.${index}.product_id`, product.id)

    const currentPrice = watch(`items.${index}.price`)

    if (!currentPrice) {
      setValue(`items.${index}.price`, product.standard_price)
    }
  }, [setValue, watch])

  function startNewBill() {
    setSubmitted(false)
    setClientTouched(false)
    reset(emptyBillDefaults())
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
    <div className="max-w-4xl mx-auto">
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
                  clientNav.setHighlightedIndex(-1)
                }}
                onKeyDown={clientNav.handleKeyDown}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => {
                  setClientTouched(true)
                  setTimeout(() => setShowClientDropdown(false), 150)
                }}
                placeholder="Type to search..."
                autoComplete="off"
              />
              {showClientDropdown && filteredFirms.length > 0 && (
                <div className="absolute z-20 bg-background border rounded-md shadow-md w-full mt-1 max-h-48 overflow-auto animate-in fade-in slide-in-from-top-1">
                  {filteredFirms.map((f, i) => (
                    <div
                      key={f.id}
                      onMouseDown={(e) => { e.preventDefault(); selectFirm(f) }}
                      onMouseEnter={() => clientNav.setHighlightedIndex(i)}
                      className={`px-3 py-1.5 text-sm cursor-pointer transition-colors ${i === clientNav.highlightedIndex ? 'bg-muted' : 'hover:bg-muted'
                        }`}
                    >
                      {f.name}
                    </div>
                  ))}
                </div>
              )}
              {(submitted || clientTouched) && errors.firm_id && (
                <p className="text-red-600 text-xs">{errors.firm_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" {...register('bill_date')} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bilty #</Label>
              <Input
                maxLength={15}
                className={(submitted || touchedFields.bilty_no) && errors.bilty_no ? 'border-red-500' : ''}
                {...register('bilty_no')}
              />
              {(submitted || touchedFields.bilty_no) && errors.bilty_no && (
                <p className="text-red-600 text-xs">{errors.bilty_no.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">D/O #</Label>
              <Input
                inputMode="numeric"
                className={(submitted || touchedFields.do_no) && errors.do_no ? 'border-red-500' : ''}
                {...(() => {
                  const { ref, onChange, ...r } = register('do_no')
                  return {
                    ref,
                    ...r,
                    onChange: (e) => {
                      e.target.value = sanitizeDigits(e.target.value, 5)
                      onChange(e)
                    },
                  }
                })()}
              />
              {(submitted || touchedFields.do_no) && errors.do_no && (
                <p className="text-red-600 text-xs">{errors.do_no.message}</p>
              )}
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
                    control={control}
                    rowErrors={errors?.items?.[index]}
                    rowTouched={touchedFields?.items?.[index]}
                    submitted={submitted}
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
          {submitted && errors.items?.message && <p className="text-red-600 text-xs">{errors.items.message}</p>}

          <div className="border-t pt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="flex gap-4">
              <div className="w-32 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bilty charges</Label>
                <Input
                  type="number"
                  className={`font-mono tabular-nums ${(submitted || touchedFields.bilty_charges) && errors.bilty_charges ? 'border-red-500' : ''}`}
                  {...(() => {
                    const { ref, onChange, ...r } = register('bilty_charges', { valueAsNumber: true })
                    return {
                      ref,
                      ...r,
                      onChange: (e) => {
                        e.target.value = sanitizeDigits(e.target.value, 7)
                        onChange(e)
                      },
                    }
                  })()}
                />
                {(submitted || touchedFields.bilty_charges) && errors.bilty_charges && (
                  <p className="text-red-600 text-xs">{errors.bilty_charges.message}</p>
                )}
              </div>
              <div className="w-32 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Packaging</Label>
                <Input
                  type="number"
                  className={`font-mono tabular-nums ${(submitted || touchedFields.packaging_charges) && errors.packaging_charges ? 'border-red-500' : ''}`}
                  {...(() => {
                    const { ref, onChange, ...r } = register('packaging_charges', { valueAsNumber: true })
                    return {
                      ref,
                      ...r,
                      onChange: (e) => {
                        e.target.value = sanitizeDigits(e.target.value, 7)
                        onChange(e)
                      },
                    }
                  })()}
                />
                {(submitted || touchedFields.packaging_charges) && errors.packaging_charges && (
                  <p className="text-red-600 text-xs">{errors.packaging_charges.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-5 ml-auto">
              <BillTotals control={control} prevBalance={prevBalance} />
              <Button
                type="submit"
                className="rounded-lg h-auto self-stretch px-8"
                size="lg"
                disabled={!isValid || isSubmitting}>
                {isSubmitting ? 'Saving...' : editingBillId ? 'Update bill' : 'Save bill'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}