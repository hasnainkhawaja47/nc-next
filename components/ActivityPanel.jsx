'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActivity } from '@/lib/activity-context'
import { deleteBill } from '@/app/new-bill/actions'
import BillDocument, { BillsDocument } from '@/components/BillDocument'
import { usePathname } from 'next/navigation'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const LONG_PRESS_MS = 450

function useScrollFade() {
    const scrollRef = useRef(null)
    const [showTopFade, setShowTopFade] = useState(false)
    const [showBottomFade, setShowBottomFade] = useState(false)

    const updateFades = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setShowTopFade(el.scrollTop > 4)
        setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
    }, [])

    return { scrollRef, showTopFade, showBottomFade, updateFades }
}

export default function ActivityPanel() {
    const { entries, removeActivity, clearAll } = useActivity()
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const [deleteEntry, setDeleteEntry] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [confirmClearOpen, setConfirmClearOpen] = useState(false)

    // Bulk selection state
    const [selectMode, setSelectMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [bulkPrinting, setBulkPrinting] = useState(false)
    const longPressTimer = useRef(null)
    const longPressFired = useRef(false)

    const { scrollRef, showTopFade, showBottomFade, updateFades } = useScrollFade()

    useEffect(() => {
        updateFades()
    }, [entries.length, open, updateFades])

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

    async function handlePrintSelected() {
        const selected = entries.filter((e) => selectedIds.has(e.billId))
        if (selected.length === 0) return

        setBulkPrinting(true)
        try {
            const blob = await pdf(<BillsDocument entries={selected} />).toBlob()
            window.open(URL.createObjectURL(blob), '_blank')
            exitSelectMode()
        } catch (err) {
            toast.error('Failed to generate PDF')
        } finally {
            setBulkPrinting(false)
        }
    }

    function toggleSelected(billId) {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(billId)) next.delete(billId)
            else next.add(billId)
            return next
        })
    }

    function exitSelectMode() {
        setSelectMode(false)
        setSelectedIds(new Set())
    }

    function startLongPress(billId) {
        longPressFired.current = false
        longPressTimer.current = setTimeout(() => {
            longPressFired.current = true
            setSelectMode(true)
            setSelectedIds(new Set([billId]))
        }, LONG_PRESS_MS)
    }

    function cancelLongPress() {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }
    }

    function handleRowClick(billId) {
        // Swallow the click that follows a fired long-press
        if (longPressFired.current) {
            longPressFired.current = false
            return
        }
        if (selectMode) toggleSelected(billId)
    }

    async function handleDelete() {
        if (!deleteEntry) return

        setDeleting(true)

        const result = await deleteBill(deleteEntry.billId)

        if (result.error) {
            toast.error(result.error)
            setDeleting(false)
            return
        }

        removeActivity(deleteEntry.billId)
        setDeleteEntry(null)
        setDeleting(false)

        toast.success('Bill deleted')
    }

    function handleClearAll() {
        clearAll()
        setConfirmClearOpen(false)
        if (selectMode) exitSelectMode()
    }

    return (
        <>
            {/* Floating activity button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open recent bills"
                    title="Recent bills"
                    className="
                        fixed bottom-5 right-5 z-40
                        flex items-center justify-center
                        w-14 h-14 rounded-full
                        bg-[#1a1a2e] text-white
                        shadow-lg
                        hover:bg-[#2a2a4e]
                        transition-all duration-200 ease-out
                        hover:scale-105
                        active:scale-95
                        animate-in fade-in zoom-in-75
                    "
                >
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>

                    <Badge className="absolute -top-1 -right-1 bg-[#C8A951] text-[#1a1a2e]">
                        {entries.length}
                    </Badge>
                </button>
            )}

            {/* Expanded activity panel */}
            {open && (
                <Card
                    className="
                    fixed z-40 bottom-5 right-5
                    w-[calc(100vw-2.5rem)] max-w-sm
                    max-h-[70vh]
                    rounded-xl p-0 overflow-hidden
                    shadow-xl
                    flex flex-col
                    animate-in fade-in slide-in-from-bottom-4 zoom-in-95
                    duration-200 ease-out
                "
                >
                    {/* Header */}
                    <div
                        className="
                            flex items-center justify-between
                            px-4 py-3
                            border-b
                            bg-[#1a1a2e]
                            text-white
                            rounded-t-xl
                        "
                    >
                        {selectMode ? (
                            <span className="text-sm font-medium">
                                {selectedIds.size} selected
                            </span>
                        ) : (
                            <span className="text-sm font-medium">
                                Recent bills
                            </span>
                        )}

                        <div className="flex items-center gap-1">
                            {selectMode && (
                                <button
                                    onClick={handlePrintSelected}
                                    disabled={selectedIds.size === 0 || bulkPrinting}
                                    aria-label="Print selected bills"
                                    title="Print selected"
                                    className="
                                        flex items-center justify-center
                                        w-8 h-8 rounded-full
                                        text-gray-300
                                        hover:text-white
                                        hover:bg-white/10
                                        disabled:opacity-40
                                        disabled:hover:bg-transparent
                                        transition-all duration-150
                                        active:scale-90
                                    "
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M6 9V2h12v7" />
                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                        <path d="M6 14h12v8H6z" />
                                    </svg>
                                </button>
                            )}

                            {!selectMode && (
                                <button
                                    onClick={() => setConfirmClearOpen(true)}
                                    aria-label="Clear all recent bills"
                                    title="Clear all"
                                    className="
                                        flex items-center justify-center
                                        w-8 h-8 rounded-full
                                        text-gray-300
                                        hover:text-white
                                        hover:bg-white/10
                                        transition-all duration-150
                                        active:scale-90
                                    "
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    </svg>
                                </button>
                            )}

                            {/* FAB morphs into close / exit-select button */}
                            <button
                                onClick={() => (selectMode ? exitSelectMode() : setOpen(false))}
                                aria-label={selectMode ? 'Cancel selection' : 'Close recent bills'}
                                title={selectMode ? 'Cancel' : 'Close'}
                                className="
                                    flex items-center justify-center
                                    w-8 h-8 rounded-full
                                    text-gray-300
                                    hover:text-white
                                    hover:bg-white/10
                                    transition-all duration-200
                                    hover:rotate-90
                                    active:scale-90
                                "
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M18 6L6 18" />
                                    <path d="M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Bills */}
                    <div className="relative flex-1 min-h-0">
                        <div
                            className={`
                                pointer-events-none absolute top-0 left-0 right-0 h-6 z-10
                                bg-gradient-to-b from-background to-transparent
                                transition-opacity duration-200
                                ${showTopFade ? 'opacity-100' : 'opacity-0'}
                            `}
                        />
                        <ScrollArea
                            viewportRef={scrollRef}
                            onScroll={updateFades}
                            className="h-full"
                        >
                            <div className="divide-y">
                                {entries.map((entry) => {
                                    const isSelected = selectedIds.has(entry.billId)
                                    return (
                                        <div
                                            key={entry.billId}
                                            onPointerDown={() => startLongPress(entry.billId)}
                                            onPointerUp={cancelLongPress}
                                            onPointerLeave={cancelLongPress}
                                            onPointerCancel={cancelLongPress}
                                            onClick={() => handleRowClick(entry.billId)}
                                            className={`
                                                px-4 py-3
                                                transition-all duration-200
                                                select-none
                                                animate-in fade-in slide-in-from-right-3
                                                ${selectMode ? 'cursor-pointer' : ''}
                                                ${isSelected ? 'bg-blue-50' : 'hover:bg-muted/40'}
                                            `}
                                        >
                                            <div className="flex items-start gap-2">
                                                {selectMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelected(entry.billId)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="mt-1 shrink-0"
                                                        aria-label={`Select bill #${entry.billId}`}
                                                    />
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    {/* Bill number + amount */}
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-sm font-medium">
                                                            Bill #{entry.billId}
                                                        </span>

                                                        <span className="text-sm">
                                                            Rs {entry.amount.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* Client + date */}
                                                    <div className="text-xs text-gray-500 mb-2">
                                                        {entry.firmName} · {entry.date}
                                                    </div>

                                                    {/* Action icons — hidden in select mode */}
                                                    {!selectMode && (
                                                        <TooltipProvider delayDuration={200}>
                                                            <div className="flex items-center gap-1">

                                                                {/* Edit */}
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        render={
                                                                            <Link
                                                                                href={`/new-bill?edit=${entry.billId}`}
                                                                                aria-label="Edit bill"
                                                                                className="
                                                                                inline-flex items-center justify-center
                                                                                w-8 h-8 rounded-md
                                                                                text-blue-600
                                                                                hover:bg-blue-50
                                                                                hover:text-blue-700
                                                                                transition-all duration-150
                                                                                hover:scale-110
                                                                                active:scale-95
                                                                                "
                                                                            >
                                                                                <svg
                                                                                    width="16"
                                                                                    height="16"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                >
                                                                                    <path d="M12 20h9" />
                                                                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                                                </svg>
                                                                            </Link>
                                                                        }
                                                                    />
                                                                    <TooltipContent>
                                                                        <p>Edit bill</p>
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                {/* Print */}
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        render={
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    handlePrint(entry)
                                                                                }}
                                                                                aria-label="Print bill"
                                                                                className="
                                                                                inline-flex items-center justify-center
                                                                                w-8 h-8 rounded-md
                                                                                text-blue-600
                                                                                hover:bg-blue-50
                                                                                hover:text-blue-700
                                                                                transition-all duration-150
                                                                                hover:scale-110
                                                                                active:scale-95
                                                                            "
                                                                            >
                                                                                <svg
                                                                                    width="16"
                                                                                    height="16"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                >
                                                                                    <path d="M6 9V2h12v7" />
                                                                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                                                                    <path d="M6 14h12v8H6z" />
                                                                                </svg>
                                                                            </button>
                                                                        }
                                                                    />
                                                                    <TooltipContent>
                                                                        <p>Print bill</p>
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                {/* Ledger */}
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        render={
                                                                            <Link
                                                                                href={`/clients/${entry.firmId}/ledger`}
                                                                                aria-label="Open ledger"
                                                                                className="
                                                                                inline-flex items-center justify-center
                                                                                w-8 h-8 rounded-md
                                                                                text-blue-600
                                                                                hover:bg-blue-50
                                                                                hover:text-blue-700
                                                                                transition-all duration-150
                                                                                hover:scale-110
                                                                                active:scale-95
                                                                            "
                                                                            >
                                                                                <svg
                                                                                    width="16"
                                                                                    height="16"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                >
                                                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                                                                                </svg>
                                                                            </Link>
                                                                        }
                                                                    />
                                                                    <TooltipContent>
                                                                        <p>Open ledger</p>
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                {/* Delete */}
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        render={
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setDeleteEntry(entry)
                                                                                }}
                                                                                aria-label="Delete bill"
                                                                                className="
                                                                                inline-flex items-center justify-center
                                                                                w-8 h-8 rounded-md
                                                                                text-red-600
                                                                                hover:bg-red-50
                                                                                hover:text-red-700
                                                                                transition-all duration-150
                                                                                hover:scale-110
                                                                                active:scale-95
                                                                            "
                                                                            >
                                                                                <svg
                                                                                    width="16"
                                                                                    height="16"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                >
                                                                                    <path d="M3 6h18" />
                                                                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                                                    <path d="M10 11v6" />
                                                                                    <path d="M14 11v6" />
                                                                                </svg>
                                                                            </button>
                                                                        }
                                                                    />
                                                                    <TooltipContent>
                                                                        <p>Delete bill</p>
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                            </div>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                        <div
                            className={`
                                pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10
                                bg-gradient-to-t from-background to-transparent
                                transition-opacity duration-200
                                ${showBottomFade ? 'opacity-100' : 'opacity-0'}
                            `}
                        />
                    </div>
                </Card>
            )}
            <AlertDialog
                open={!!deleteEntry}
                onOpenChange={(value) => {
                    if (!value && !deleting) {
                        setDeleteEntry(null)
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Bill #{deleteEntry?.billId}?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            This will permanently delete this bill and its associated
                            data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? 'Deleting...' : 'Delete bill'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear all recent bills?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This only clears this panel's queue — it does not delete any bills. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
                            Clear all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}