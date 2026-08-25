import React from "react";
import { FileText } from "lucide-react";
import { formatPKR } from "./mockData";

export default function RecentActivity({ items, delayMs = 0 }) {
  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm opacity-0 animate-in fade-in slide-in-from-bottom-3 transition-shadow duration-200 hover:shadow-md"
      style={{
        animationDelay: `${delayMs}ms`,
        animationDuration: "500ms",
        animationFillMode: "forwards",
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-neutral-400" />
        <h2 className="text-sm font-medium text-neutral-900">Recent Activity</h2>
      </div>
      <div className="space-y-3">
        {items.map((a, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (a.type === "bill" ? "bg-neutral-900" : "bg-emerald-500")
                }
              />
              <span className="text-neutral-700">{a.client}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-neutral-900">
                {formatPKR(a.amount)}
              </span>
              <span className="w-10 text-right text-xs text-neutral-400">
                {a.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}