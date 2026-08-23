'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updatePayment, getPayment } from './actions'

export default function EditPaymentDialog({ paymentId, label = 'Edit' }) {
    const [open, setOpen] = useState(false)
    const [payment, setPayment] = useState(null)
    const [method, setMethod] = useState('Cash')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleOpen(isOpen) {
        setOpen(isOpen)
        if (isOpen && !payment) {
            setLoading(true)
            const result = await getPayment(paymentId)
            if (result.error) {
                toast.error(result.error)
                setOpen(false)
                return
            }
            setPayment(result.payment)
            setMethod(result.payment.method || 'Cash')
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const formData = new FormData(e.target)
        const result = await updatePayment(paymentId, formData)
        if (result.error) {
            toast.error(result.error)
            return
        }
        toast.success('Payment updated')
        setOpen(false)
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger className="text-blue-600 text-xs">{label}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit payment</DialogTitle>
                </DialogHeader>

                {loading || !payment ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-600">Date</label>
                            <Input type="date" name="payment_date" defaultValue={payment.payment_date} required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-600">Amount (Rs)</label>
                            <Input type="number" name="amount" defaultValue={payment.amount} min="0" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-600">Payment method</label>
                            <select
                                name="method"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                            >
                                <option>Cash</option>
                                <option>Cheque</option>
                                <option>Bank Transfer</option>
                                <option>Draft</option>
                            </select>
                        </div>
                        {method !== 'Cash' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-600">Bank name</label>
                                    <Input name="bank_name" defaultValue={payment.bank_name} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-600">Cheque / Reference #</label>
                                    <Input name="cheque_number" defaultValue={payment.cheque_number} />
                                </div>
                            </>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-xs text-gray-600">Memo</label>
                            <Input name="memo" defaultValue={payment.memo} placeholder="Optional note" />
                        </div>
                        <Button type="submit" className="w-full">Save changes</Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}