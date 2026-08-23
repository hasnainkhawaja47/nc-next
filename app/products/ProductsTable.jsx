'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { addProduct, updateProduct, deleteProduct } from './actions'
import DataTable from '@/components/DataTable'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'

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
    toast.success(editing ? 'Product updated' : 'Product added')
    window.location.reload()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return
    const result = await deleteProduct(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Product deleted')
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
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add product
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        renderActions={(p) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(p.id)}>
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        )}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit product' : 'Add product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" defaultValue={editing?.code} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="standard_price">Standard price</Label>
              <Input id="standard_price" name="standard_price" type="number" defaultValue={editing?.standard_price} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost_price">Cost price</Label>
              <Input id="cost_price" name="cost_price" type="number" defaultValue={editing?.cost_price} required />
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
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