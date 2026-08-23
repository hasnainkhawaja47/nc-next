'use client'

import { useState } from 'react'
import Link from 'next/link'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActivity } from '@/lib/activity-context'
import { deleteBill } from '@/app/new-bill/actions'
import BillDocument from '@/components/BillDocument'
import { usePathname } from 'next/navigation'

export default function ActivityPanel() {
    const { entries, removeActivity } = useActivity()
    const [open, setOpen] = useState(false)
    const pathname = usePathname()   // ← hook must come first, before any return

    if (pathname === '/login') return null
    if (entries.length === 0) return null
    async function handlePrint(entry) {
        const doc = (
            <BillDocument
                bill={entry.bill}
                firmName={entry.firmName}
                items={entry.items}
                amountWords={entry.amountWords}
                prevBalance={entry.prevBalance}
            />
        )
        const blob = await pdf(doc).toBlob()
        window.open(URL.createObjectURL(blob), '_blank')
    }

    async function handleDelete(entry) {
        if (!confirm(`Delete Bill #${entry.billId}?`)) return
        const result = await deleteBill(entry.billId)
        if (result.error) {
            toast.error(result.error)
            return
        }
        removeActivity(entry.billId)
        toast.success('Bill deleted')
    }

    return (
        <>
            {/* Collapsed: round FAB, bottom-right, same on mobile and desktop */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-5 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#1a1a2e] text-white shadow-lg hover:bg-[#2a2a4e]"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <Badge className="absolute -top-1 -right-1 bg-[#C8A951] text-[#1a1a2e]">{entries.length}</Badge>
                </button>
            )}

            {/* Expanded: chatbot-style dismissible panel, bottom-right */}
            {open && (
                <Card className="fixed z-40 bottom-5 right-5 w-[calc(100vw-2.5rem)] max-w-sm max-h-[70vh] rounded-xl p-0 overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-[#1a1a2e] text-white">
                        <span className="text-sm font-medium">Recent bills</span>
                        <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-white text-sm">✕</button>
                    </div>

                    <ScrollArea className="max-h-[calc(70vh-48px)]">
                        <div className="divide-y">
                            {entries.map((entry) => (
                                <div key={entry.billId} className="px-4 py-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-medium">Bill #{entry.billId}</span>
                                        <span className="text-sm">Rs {entry.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">{entry.firmName} · {entry.date}</div>
                                    <div className="flex gap-3 text-xs">
                                        <Link href={`/new-bill?edit=${entry.billId}`} className="text-blue-600">Edit</Link>
                                        <button onClick={() => handlePrint(entry)} className="text-blue-600">Print</button>
                                        <Link href={`/clients/${entry.firmId}/ledger`} className="text-blue-600">Ledger</Link>
                                        <button onClick={() => handleDelete(entry)} className="text-red-600">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            )}
        </>
    )
}