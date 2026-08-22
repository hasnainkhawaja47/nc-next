'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ToWords } from 'to-words'
import { saveBill, getPreviousBalance } from './actions'
import BillActions from './BillActions'

const toWords = new ToWords({ localeCode: 'en-IN' })

const schema = z.object({
  firm_id: z.number({ invalid_type_error: 'Please select a client.' }),
  bill_date: z.string().min(1, 'Date is required.'),
  bilty_no: z.string().optional(),
  do_no: z.string().optional(),
  bilty_charges: z.number().min(0).default(0),
  packaging_charges: z.number().min(0).default(0),
  is_credit: z.boolean().default(true),
  items: z
    .array(
      z.object({
        product_name: z.string().min(1),
        colour: z.string().optional(),
        size: z.string().optional(),
        quantity: z.number().min(0),
        price: z.number().min(0),
        product_id: z.number().nullable().optional(),
      })
    )
    .min(1, 'Add at least one item.'),
})

export default function NewBillForm({ firms, products }) {
  const [clientQuery, setClientQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [prevBalance, setPrevBalance] = useState(null)
  const [rowSearches, setRowSearches] = useState({}) // { rowIndex: query }
  const [savedResult, setSavedResult] = useState(null)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      bill_date: new Date().toISOString().split('T')[0],
      bilty_charges: 0,
      packaging_charges: 0,
      is_credit: true,
      items: [
        { product_name: '', colour: '', size: '', quantity: 0, price: 0, product_id: null },
        { product_name: '', colour: '', size: '', quantity: 0, price: 0, product_id: null },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedItems = watch('items')
  const watchedBilty = watch('bilty_charges') || 0
  const watchedPkg = watch('packaging_charges') || 0
  const watchedFirmId = watch('firm_id')

  const itemsTotal = watchedItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0)
  const grandTotal = itemsTotal + Number(watchedBilty) + Number(watchedPkg)
  const amountWords = grandTotal > 0 ? toWords.convert(grandTotal, { currency: true }) : ''
  const newBalance = prevBalance != null ? prevBalance + grandTotal : null

  const filteredFirms =
    clientQuery.length > 0 ? firms.filter((f) => f.name.toLowerCase().includes(clientQuery.toLowerCase())).slice(0, 8) : []

  async function selectFirm(firm) {
    setValue('firm_id', firm.id)
    setClientQuery(firm.name)
    setShowClientDropdown(false)
    const bal = await getPreviousBalance(firm.id)
    setPrevBalance(bal)
  }

  function filteredProducts(query) {
    if (!query) return []
    const q = query.toLowerCase()
    return products
      .filter((p) => p.code.toLowerCase().startsWith(q) || p.name.toLowerCase().includes(q))
      .slice(0, 8)
  }

  function selectProduct(index, product) {
    setValue(`items.${index}.product_name`, product.name)
    setValue(`items.${index}.product_id`, product.id)
    if (!watchedItems[index].price) {
      setValue(`items.${index}.price`, product.standard_price)
    }
    setRowSearches((prev) => ({ ...prev, [index]: '' }))
  }

  async function onSubmit(data) {
    setError(null)
    const cleanItems = data.items
      .filter((i) => i.product_name && (i.quantity > 0 || i.price > 0))
      .map((i) => ({ ...i, quantity: Number(i.quantity), price: Number(i.price) }))

    if (cleanItems.length === 0) {
      setError('Please add at least one item with quantity and price.')
      return
    }

    const result = await saveBill({ ...data, items: cleanItems })

    if (result.error) {
      setError(result.error)
      return
    }

    const firm = firms.find((f) => f.id === data.firm_id)
    setSavedResult({
      bill: result.bill,
      items: result.items,
      firmName: firm?.name || '',
      amountWords: toWords.convert(result.bill.total_amount, { currency: true }),
      prevBalance: prevBalance || 0,
    })

    reset({
      bill_date: new Date().toISOString().split('T')[0],
      bilty_charges: 0,
      packaging_charges: 0,
      is_credit: true,
      items: [
        { product_name: '', colour: '', size: '', quantity: 0, price: 0, product_id: null },
        { product_name: '', colour: '', size: '', quantity: 0, price: 0, product_id: null },
      ],
    })
    setClientQuery('')
    setPrevBalance(null)
  }

  return (
    <div className="max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <label className="text-xs text-gray-600">Client name</label>
            <input
              value={clientQuery}
              onChange={(e) => {
                setClientQuery(e.target.value)
                setShowClientDropdown(true)
                setValue('firm_id', undefined)
                setPrevBalance(null)
              }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Type to search..."
              autoComplete="off"
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
            {showClientDropdown && filteredFirms.length > 0 && (
              <div className="absolute z-20 bg-white border rounded shadow-md w-full mt-1 max-h-48 overflow-auto">
                {filteredFirms.map((f) => (
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
            {errors.firm_id && <p className="text-red-600 text-xs mt-1">{errors.firm_id.message}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-600">Date</label>
            <input type="date" {...register('bill_date')} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>

          <div>
            <label className="text-xs text-gray-600">Bilty #</label>
            <input {...register('bilty_no')} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>

          <div>
            <label className="text-xs text-gray-600">D/O #</label>
            <input {...register('do_no')} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue('is_credit', false)}
            className={`px-3 py-1.5 rounded text-sm ${!watch('is_credit') ? 'bg-[#1a1a2e] text-white' : 'border'}`}
          >
            Cash
          </button>
          <button
            type="button"
            onClick={() => setValue('is_credit', true)}
            className={`px-3 py-1.5 rounded text-sm ${watch('is_credit') ? 'bg-[#1a1a2e] text-white' : 'border'}`}
          >
            Credit
          </button>
        </div>

        {prevBalance != null && (
          <div className="text-sm">
            Previous balance:{' '}
            <span className={prevBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
              Rs {prevBalance.toLocaleString()}
            </span>
          </div>
        )}

        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="py-1.5 px-2 w-6">#</th>
                <th className="py-1.5 px-2">Particular</th>
                <th className="py-1.5 px-2 w-24">Colour</th>
                <th className="py-1.5 px-2 w-20">Size</th>
                <th className="py-1.5 px-2 w-20">Qty</th>
                <th className="py-1.5 px-2 w-24">Price</th>
                <th className="py-1.5 px-2 w-24">Total</th>
                <th className="py-1.5 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const qty = Number(watchedItems[index]?.quantity) || 0
                const price = Number(watchedItems[index]?.price) || 0
                const rowQuery = rowSearches[index] || ''
                const matches = filteredProducts(rowQuery)

                return (
                  <tr key={field.id} className="border-t">
                    <td className="px-2 text-gray-400 text-xs">{index + 1}</td>
                    <td className="px-2 relative">
                      <input
                        {...register(`items.${index}.product_name`)}
                        onChange={(e) => {
                          setValue(`items.${index}.product_name`, e.target.value)
                          setRowSearches((prev) => ({ ...prev, [index]: e.target.value }))
                        }}
                        placeholder="Code or name..."
                        autoComplete="off"
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                      {rowQuery && matches.length > 0 && (
                        <div className="absolute z-20 bg-white border rounded shadow-md w-56 mt-1 max-h-40 overflow-auto">
                          {matches.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => selectProduct(index, p)}
                              className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer flex justify-between"
                            >
                              <span><strong>{p.code}</strong> — {p.name}</span>
                              <span className="text-gray-400">Rs {p.standard_price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-2">
                      <input {...register(`items.${index}.colour`)} className="w-full border rounded px-2 py-1 text-sm" />
                    </td>
                    <td className="px-2">
                      <input {...register(`items.${index}.size`)} className="w-full border rounded px-2 py-1 text-sm" />
                    </td>
                    <td className="px-2">
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-2">
                      <input
                        type="number"
                        {...register(`items.${index}.price`, { valueAsNumber: true })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-2 text-sm font-medium">{qty * price > 0 ? (qty * price).toLocaleString() : '—'}</td>
                    <td className="px-2">
                      <button type="button" onClick={() => remove(index)} className="text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => append({ product_name: '', colour: '', size: '', quantity: 0, price: 0, product_id: null })}
          className="text-sm text-blue-600"
        >
          + Add row
        </button>

        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <div>
            <label className="text-xs text-gray-600">Bilty charges</label>
            <input type="number" {...register('bilty_charges', { valueAsNumber: true })} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Packaging</label>
            <input type="number" {...register('packaging_charges', { valueAsNumber: true })} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        <div className="text-lg font-semibold">Grand total: Rs {grandTotal.toLocaleString()}</div>
        {amountWords && <div className="text-xs text-gray-500">{amountWords}</div>}
        {newBalance != null && (
          <div className="text-sm">
            New balance: <span className="text-red-600 font-medium">Rs {newBalance.toLocaleString()}</span>
          </div>
        )}

        {errors.items && <p className="text-red-600 text-xs">{errors.items.message}</p>}
        {error && <p className="text-red-600 text-xs">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="bg-[#1a1a2e] text-white px-5 py-2 rounded text-sm">
          {isSubmitting ? 'Saving...' : 'Save bill'}
        </button>
      </form>

      {savedResult && (
        <BillActions
          bill={savedResult.bill}
          firmName={savedResult.firmName}
          items={savedResult.items}
          amountWords={savedResult.amountWords}
          prevBalance={savedResult.prevBalance}
        />
      )}
    </div>
  )
}