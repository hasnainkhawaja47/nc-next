import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatPKR } from "./mockData";

export default function RevenueChart({ data, delayMs = 0 }) {
  return (
    <div
      className="col-span-1 rounded-xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3 transition-shadow duration-200 hover:shadow-md lg:col-span-2"
      style={{
        animationDelay: `${delayMs}ms`,
        animationDuration: "500ms",
        animationFillMode: "forwards",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Revenue Trend</h2>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">
          Last 6 months
        </span>
      </div>
      <div className="h-64" style={{ minHeight: 256 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <Tooltip
              formatter={(v) => formatPKR(v)}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--foreground)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--primary)" }}
              activeDot={{ r: 5 }}
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}