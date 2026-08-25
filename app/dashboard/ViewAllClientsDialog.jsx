'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatPKR } from './mockData'

export default function ViewAllClientsDialog({ clients }) {
  return (
    <Dialog>
      <DialogTrigger className="text-xs font-medium text-neutral-500 underline-offset-2 transition-colors duration-150 hover:text-neutral-900 hover:underline">
        View all
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>All Clients by Balance</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {clients.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-neutral-50"
            >
              <span className="text-neutral-700">{c.name}</span>
              <span className="font-medium tabular-nums text-neutral-900">
                {formatPKR(c.balance)}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}