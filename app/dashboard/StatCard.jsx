import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useCountUp } from "./useCountUp";

export default function StatCard({
  icon: Icon,
  label,
  value,
  formatValue,
  delta,
  deltaGood,
  index = 0,
  deltaSuffix = "vs last month"
}) {
  const animated = useCountUp(value);

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3 transition-shadow duration-200 hover:shadow-md"
      style={{
        animationDelay: `${index * 80}ms`,
        animationDuration: "500ms",
        animationFillMode: "forwards",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {formatValue ? formatValue(animated) : animated.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-foreground/5 p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {deltaGood ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={deltaGood ? "text-emerald-600" : "text-red-500"}>
            {delta}
          </span>
          <span className="text-muted-foreground">{deltaSuffix}</span>
        </div>
      )}
    </div>
  );
}