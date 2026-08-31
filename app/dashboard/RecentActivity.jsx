import React from "react";
import { FileText } from "lucide-react";
import { formatPKR } from "./mockData";

export default function RecentActivity({ items, delayMs = 0 }) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3"
      style={{
        animationDelay: `${delayMs}ms`,
        animationDuration: "500ms",
        animationFillMode: "forwards",
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">Recent Activity</h2>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 gap-y-3 text-sm">
        {items.map((a, i) => (
          <React.Fragment key={i}>
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={
                  "h-1.5 w-1.5 shrink-0 rounded-full " +
                  (a.type === "bill" ? "bg-foreground" : "bg-emerald-500")
                }
              />
              <span className="truncate text-foreground/80">{a.client}</span>
            </div>
            <span
              className={
                "inline-flex w-20 items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium " +
                (a.type === "bill"
                  ? "bg-muted text-foreground/80"
                  : "bg-emerald-50 text-emerald-600")
              }
            >
              {a.type === "bill" ? "Billed" : "Collected"}
            </span>
            <span className="tabular-nums text-right text-foreground whitespace-nowrap">
              {formatPKR(a.amount)}
            </span>
            <span className="text-right text-xs text-muted-foreground whitespace-nowrap">
              {a.date}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}