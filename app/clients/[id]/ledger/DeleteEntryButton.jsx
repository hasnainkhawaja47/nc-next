'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
    <button onClick={handleDelete} className="text-red-600 text-xs">Delete</button>
  )
}