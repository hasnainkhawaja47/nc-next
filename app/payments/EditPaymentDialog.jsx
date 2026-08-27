'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { updatePayment, getPayment, getFirmBalance } from './actions'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function EditPaymentDialog({ paymentId, label = 'Edit' }) {
    const [open, setOpen] = useState(false)
    const [payment, setPayment] = useState(null)
    const [date, setDate] = useState(null)
    const [method, setMethod] = useState('Cash')
    const [amount, setAmount] = useState(0)
    const [currentBalance, setCurrentBalance] = useState(null)
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

    const newBalance = currentBalance !== null ? currentBalance - (Number(amount) || 0) : null

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
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Date</label>
                                <input type="hidden" name="payment_date" value={date ? format(date, 'yyyy-MM-dd') : ''} required />
                                <Popover>
                                    <PopoverTrigger
                                        render={
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal rounded-lg border-border/60"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, 'PPP') : 'Pick a date'}
                                            </Button>
                                        }
                                    />
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Amount (Rs)</label>
                                <Input
                                    type="number"
                                    name="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min="0"
                                    required
                                    className="rounded-lg border-border/60 tabular-nums"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Payment method</label>
                                <select
                                    name="method"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
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
                                        <label className="text-xs text-muted-foreground">Bank name</label>
                                        <Input
                                            name="bank_name"
                                            defaultValue={payment.bank_name}
                                            className="rounded-lg border-border/60"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-muted-foreground">Cheque / Reference #</label>
                                        <Input
                                            name="cheque_number"
                                            defaultValue={payment.cheque_number}
                                            className="rounded-lg border-border/60"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Memo</label>
                                <Input
                                    name="memo"
                                    defaultValue={payment.memo}
                                    placeholder="Optional note"
                                    className="rounded-lg border-border/60"
                                />
                            </div>
                        </div>

                        {currentBalance !== null && (
                            <div className="rounded-xl bg-zinc-900 text-zinc-50 p-4 space-y-1.5 text-sm">
                                <div className="flex justify-between text-zinc-400">
                                    <span>Current balance</span>
                                    <span className="tabular-nums">Rs {currentBalance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Payment amount</span>
                                    <span className="tabular-nums">Rs {(Number(amount) || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-1.5 mt-1.5 border-t border-zinc-700 text-base font-semibold">
                                    <span>New balance</span>
                                    <span className="tabular-nums">Rs {newBalance.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full rounded-lg">Save changes</Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}