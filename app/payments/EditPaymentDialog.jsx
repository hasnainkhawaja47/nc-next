'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { updatePayment, getPayment, getFirmBalance } from './actions'
import { Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PaymentFields from './PaymentFields'

export default function EditPaymentDialog({ paymentId, label = 'Edit' }) {
    const [open, setOpen] = useState(false)
    const [payment, setPayment] = useState(null)
    const [date, setDate] = useState(null)
    const [method, setMethod] = useState('Cash')
    const [amount, setAmount] = useState(0)
    const [currentBalance, setCurrentBalance] = useState(null)
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
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
            setAmount(result.payment.amount || 0)
            setDate(result.payment.payment_date ? new Date(result.payment.payment_date) : null)
            if (result.payment.firm_id) {
                const balance = await getFirmBalance(result.payment.firm_id)
                // balance already reflects this payment applied,
                // so add it back to get "balance before this payment"
                setCurrentBalance(balance + (result.payment.amount || 0))
            }
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.target)
        const result = await updatePayment(paymentId, formData)
        setSubmitting(false)
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
            <DialogTrigger
                render={
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-lg">Edit payment</DialogTitle>
                </DialogHeader>

                {loading || !payment ? (
                    <div className="px-6 pb-6 space-y-3">
                        <Skeleton className="h-9 w-full rounded-lg" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                        <PaymentFields
                            date={date}
                            setDate={setDate}
                            amount={amount}
                            setAmount={setAmount}
                            method={method}
                            setMethod={setMethod}
                            bankNameDefault={payment.bank_name}
                            chequeNumberDefault={payment.cheque_number}
                            memoDefault={payment.memo}
                            balance={currentBalance}
                            disabled={submitting}
                        />

                        <Button type="submit" className="w-full rounded-lg" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save changes'
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}