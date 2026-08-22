'use client'

import { useState } from 'react'
import { addClient, updateClient, deleteClient } from './actions'
import DataTable from '@/components/DataTable'
import Link from 'next/link'
export default function ClientsTable({ initialClients }) {
  const [clients] = useState(initialClients)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState(null)

  function openAdd() {
    setEditing(null)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(c) {
    setEditing(c)
    setError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const result = editing
      ? await updateClient(editing.id, formData)
      : await addClient(formData)

    if (result.error) {
      setError(result.error)
      return
    }
    setModalOpen(false)
    window.location.reload()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this client?')) return
    const result = await deleteClient(id)
    if (result.error) {
      alert(result.error)
      return
    }
    window.location.reload()
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <Link href={`/clients/${c.id}/ledger`} className="text-blue-600 hover:underline">
          {c.name}
        </Link>
      ),
    }, ,
    {
      key: 'balance',
      header: 'Balance',
      render: (c) => (
        <span className={c.balance > 0 ? 'text-red-600' : 'text-green-600'}>
          Rs {c.balance?.toLocaleString()}
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={openAdd}
          className="bg-[#1a1a2e] text-white px-4 py-2 rounded-md text-sm hover:bg-[#2a2a4e]"
        >
          + Add client
        </button>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        renderActions={(c) => (
          <>
            <button onClick={() => openEdit(c)} className="text-blue-600 text-xs mr-3">Edit</button>
            <button onClick={() => handleDelete(c.id)} className="text-red-600 text-xs">Delete</button>
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
            <h2 className="font-semibold mb-3">{editing ? 'Edit client' : 'Add client'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Name</label>
                <input name="name" defaultValue={editing?.name} required className="w-full border rounded px-2 py-1.5 text-sm" />
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