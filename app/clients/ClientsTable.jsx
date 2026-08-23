'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { addClient, updateClient, deleteClient } from './actions'
import DataTable from '@/components/DataTable'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'

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
    toast.success(editing ? 'Client updated' : 'Client added')
    window.location.reload()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this client?')) return
    const result = await deleteClient(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Client deleted')
    window.location.reload()
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <Link href={`/clients/${c.id}/ledger`} className="hover:underline transition-colors">
          {c.name}
        </Link>
      ),
    },
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
        <Button onClick={openAdd} className="transition-transform active:scale-95">
          <Plus className="w-4 h-4 mr-1.5" />
          Add client
        </Button>
      </div>

      <div className="animate-in fade-in duration-300">
        <DataTable
          columns={columns}
          data={clients}
          renderActions={(c) => (
            <div className="flex gap-1">
              <Link
                href={`/clients/${c.id}/ledger`}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}>
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit client' : 'Add client'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required autoFocus />
            </div>
            {error && (
              <p className="text-red-600 text-xs animate-in fade-in slide-in-from-top-1">{error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}