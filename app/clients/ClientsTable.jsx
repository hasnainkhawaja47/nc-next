'use client'

import { useState, useMemo } from 'react'
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
import { Plus, IdCard, Trash2, X, BookOpen, Search } from 'lucide-react'

export default function ClientsTable({ initialClients }) {

  const [clients] = useState(initialClients)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState(null)
  const [detailsError, setDetailsError] = useState(null)
  const [query, setQuery] = useState("");

  const filteredFirms = useMemo(() => {
    if (!query.trim()) return initialClients;
    const q = query.toLowerCase();
    return initialClients.filter((firm) => firm.name.toLowerCase().includes(q));
  }, [initialClients, query]);

  function openAdd() {
    setEditing(null)
    setError(null)
    setModalOpen(true)
  }

  function openDetails(c) {
    setEditing(c)
    setDetailsError(null)
    setDetailsOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const result = await addClient(formData)

    if (result.error) {
      setError(result.error)
      return
    }
    setModalOpen(false)
    toast.success('Client added')
    window.location.reload()
  }

  async function handleDetailsSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const result = await updateClient(editing.id, formData)

    if (result.error) {
      setDetailsError(result.error)
      return
    }
    setDetailsOpen(false)
    toast.success('Client updated')
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
      <div className="relative w-full mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="animate-in fade-in duration-300">
        <DataTable
          columns={columns}
          data={filteredFirms}
          renderActions={(c) => (
            <div className="flex gap-1">
              <Link
                href={`/clients/${c.id}/ledger`}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetails(c)}>
                <IdCard className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}>
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        />
      </div>

      {/* Add client dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle>Add client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="phone" name="phone" />
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

      {/* Client details dialog (view/edit name, address, phone) */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle>Client details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDetailsSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="details-name">Name</Label>
              <Input id="details-name" name="name" defaultValue={editing?.name} required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="details-address">Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="details-address" name="address" defaultValue={editing?.address ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="details-phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="details-phone" name="phone" defaultValue={editing?.phone ?? ''} />
            </div>
            {detailsError && (
              <p className="text-red-600 text-xs animate-in fade-in slide-in-from-top-1">{detailsError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}