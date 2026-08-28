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
      <DialogTrigger className="text-xs font-medium text-muted-foreground underline-offset-2 transition-colors duration-150 hover:text-foreground hover:underline">
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
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-muted/50"
            >
              <span className="text-foreground/80">{c.name}</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatPKR(c.balance)}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}