import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Anomalies({ items, delayMs = 0 }) {
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
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-medium text-neutral-900">Anomalies</h2>
      </div>
      <div className="space-y-3">
        {items.map((an, i) => (
          <div
            key={i}
            className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {an.label}
              </span>
              <span className="text-xs text-neutral-400">{an.date}</span>
            </div>
            <p className="text-xs font-medium text-neutral-800">{an.client}</p>
            <p className="text-xs text-neutral-500">{an.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}