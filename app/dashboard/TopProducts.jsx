import React from "react";
import { Package } from "lucide-react";

export default function TopProducts({ products, monthLabel, delayMs = 0 }) {
  const max = products[0]?.units || 1;

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
        <Package className="h-4 w-4 text-neutral-400" />
        <h2 className="text-sm font-medium text-neutral-900">
          Top Products — {monthLabel}
        </h2>
      </div>
      <div className="space-y-3">
        {products.map((p, i) => {
          const pct = (p.units / max) * 100;
          return (
            <div key={p.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-neutral-700">{p.name}</span>
                <span className="tabular-nums text-neutral-400">{p.units}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-neutral-900 opacity-0 animate-in fade-in"
                  style={{
                    width: `${pct}%`,
                    animationDelay: `${delayMs + 120 + i * 80}ms`,
                    animationDuration: "500ms",
                    animationFillMode: "forwards",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}