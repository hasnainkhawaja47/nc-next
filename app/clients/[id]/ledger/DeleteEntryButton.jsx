'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteBill } from '@/app/new-bill/actions'
import { deletePayment } from '@/app/payments/actions'

export default function DeleteEntryButton({ type, id }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    const result = type === 'bill' ? await deleteBill(id) : await deletePayment(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Entry deleted')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDelete}>
      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
    </Button>
  )
}