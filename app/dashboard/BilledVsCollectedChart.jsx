"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function fmt(n) {
  return "Rs " + Math.round(n || 0).toLocaleString("en-PK");
}

export default function BilledVsCollectedChart({ data }) {
  return (
    <div style={{ width: "100%", height: 288 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#a3a3a3" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#a3a3a3" }}
            tickFormatter={(v) => `${v / 1000}k`}
          />
          <Tooltip
            formatter={(v) => fmt(v)}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="billed"
            name="Billed"
            fill="#171717"
            radius={[4, 4, 0, 0]}
            animationDuration={900}
          />
          <Bar
            dataKey="collected"
            name="Collected"
            fill="#d4a94a"
            radius={[4, 4, 0, 0]}
            animationDuration={900}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}