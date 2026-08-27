"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getBillDetails } from "./actions";

export function BillDetailsDialog({ billId, isArchive, open, onOpenChange }) {
  const [bill, setBill] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !billId) return;
    setLoading(true);
    getBillDetails(billId, isArchive)
      .then(({ bill, items }) => {
        setBill(bill);
        setItems(items);
      })
      .finally(() => setLoading(false));
  }, [open, billId, isArchive]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg">
            Bill #{billId}
            {isArchive && (
              <span className="ml-2 align-middle text-xs font-normal text-muted-foreground">
                archived
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading || !bill ? (
          <div className="space-y-3 px-6 pb-6">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-4">
            {/* Summary card */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-muted-foreground">Date</div>
              <div className="text-right">{new Date(bill.bill_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-')}</div>              <div className="text-muted-foreground">Bilty No.</div>
              <div className="text-right">{bill.bilty_no || "—"}</div>
              <div className="text-muted-foreground">D.O. No.</div>
              <div className="text-right">{bill.do_no || "—"}</div>
              <div className="text-muted-foreground">Type</div>
              <div className="text-right">{bill.is_credit ? "Credit" : "Cash"}</div>
            </div>

            {/* Items — quiet borderless rows */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                <div>Product</div>
                <div>Colour</div>
                <div>Size</div>
                <div className="text-right">Qty × Price</div>
                <div className="text-right">Total</div>
              </div>
              <div className="divide-y divide-border/50">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-4 py-2 text-sm items-center"
                  >
                    <div className="truncate">{it.product_name}</div>
                    <div className="text-muted-foreground">{it.colour || "—"}</div>
                    <div className="text-muted-foreground">{it.size || "—"}</div>
                    <div className="text-right tabular-nums text-muted-foreground">
                      {it.quantity} × {it.price}
                    </div>
                    <div className="text-right tabular-nums font-medium">{it.total}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dark summary card — grand total */}
            <div className="rounded-xl bg-zinc-900 text-zinc-50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Bilty Charges</span>
                <span className="tabular-nums">{bill.bilty_charges}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Packaging Charges</span>
                <span className="tabular-nums">{bill.packaging_charges}</span>
              </div>
              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-zinc-700 text-base font-semibold">
                <span>Grand Total</span>
                <span className="tabular-nums">{bill.total_amount}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}