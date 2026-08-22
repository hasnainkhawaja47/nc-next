'use client'

import { useState } from 'react'
import { addProduct, updateProduct, deleteProduct } from './actions'
import DataTable from '@/components/DataTable'

export default function ProductsTable({ initialProducts }) {
  const [products] = useState(initialProducts)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState(null)

  function openAdd() {
    setEditing(null)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditing(p)
    setError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const result = editing
      ? await updateProduct(editing.id, formData)
      : await addProduct(formData)

    if (result.error) {
      setError(result.error)
      return
    }
    setModalOpen(false)
    window.location.reload()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return
    const result = await deleteProduct(id)
    if (result.error) {
      alert(result.error)
      return
    }
    window.location.reload()
  }

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'standard_price', header: 'Standard Price', render: (p) => `Rs ${p.standard_price?.toLocaleString()}` },
    { key: 'cost_price', header: 'Cost Price', render: (p) => `Rs ${p.cost_price?.toLocaleString()}` },
    { key: 'margin_pct', header: 'Margin', render: (p) => (p.margin_pct != null ? `${p.margin_pct}%` : '—') },
    { key: 'units_sold_ytd', header: 'Sold (YTD)' },
    { key: 'units_sold', header: 'Sold (Total)' },
  ]

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={openAdd}
          className="bg-[#1a1a2e] text-white px-4 py-2 rounded-md text-sm hover:bg-[#2a2a4e]"
        >
          + Add product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        renderActions={(p) => (
          <>
            <button onClick={() => openEdit(p)} className="text-blue-600 text-xs mr-3">Edit</button>
            <button onClick={() => handleDelete(p.id)} className="text-red-600 text-xs">Delete</button>
          </>
        )}
      />

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-5 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold mb-3">{editing ? 'Edit product' : 'Add product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Code</label>
                <input name="code" defaultValue={editing?.code} required className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Name</label>
                <input name="name" defaultValue={editing?.name} required className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Standard price</label>
                <input name="standard_price" type="number" defaultValue={editing?.standard_price} required className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Cost price</label>
                <input name="cost_price" type="number" defaultValue={editing?.cost_price} required className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-[#1a1a2e] text-white px-3 py-1.5 rounded text-sm flex-1">Save</button>
                <button type="button" onClick={() => setModalOpen(false)} className="border px-3 py-1.5 rounded text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}