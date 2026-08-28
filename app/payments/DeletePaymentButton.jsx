'use client'
import { useRouter } from 'next/navigation'
import { deletePayment } from './actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function DeletePaymentButton({ id }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this payment?')) return
    const result = await deletePayment(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Payment deleted')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDelete}>
      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
    </Button>
  )
}