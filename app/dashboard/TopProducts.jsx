import React from "react";
import { Package } from "lucide-react";

export default function TopProducts({ products, monthLabel, delayMs = 0 }) {
  const max = products[0]?.units || 1;

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3 transition-shadow duration-200 hover:shadow-md"
      style={{
        animationDelay: `${delayMs}ms`,
        animationDuration: "500ms",
        animationFillMode: "forwards",
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">
          Top Products — {monthLabel}
        </h2>
      </div>
      <div className="space-y-3">
        {products.map((p, i) => {
          const pct = (p.units / max) * 100;
          return (
            <div key={p.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-foreground/80">{p.name}</span>
                <span className="tabular-nums text-muted-foreground">{p.units}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground animate-in fade-in"
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