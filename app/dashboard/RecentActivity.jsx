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
      <div className="space-y-3">
        {items.map((a, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (a.type === "bill" ? "bg-foreground" : "bg-emerald-500")
                }
              />
              <span className="text-foreground/80">{a.client}</span>
              <span
                className={
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                  (a.type === "bill"
                    ? "bg-muted text-foreground/80"
                    : "bg-emerald-50 text-emerald-600")
                }
              >
                {a.type === "bill" ? "Billed" : "Collected"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-foreground">
                {formatPKR(a.amount)}
              </span>
              <span className="w-10 text-right text-xs text-muted-foreground">
                {a.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}