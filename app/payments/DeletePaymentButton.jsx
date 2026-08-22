'use client'

import { deletePayment } from './actions'

export default function DeletePaymentButton({ id }) {
  async function handleDelete() {
    if (!confirm('Delete this payment?')) return
    const result = await deletePayment(id)
    if (result.error) {
      alert(result.error)
      return
    }
    window.location.reload()
  }

  return (
    <button onClick={handleDelete} className="text-red-600 text-xs">
      Delete
    </button>
  )
}