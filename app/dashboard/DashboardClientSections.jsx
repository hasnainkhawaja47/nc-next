"use client";

import React from "react";
import { Receipt, Wallet, TrendingUp } from "lucide-react";

import StatCard from "./StatCard";
import { formatPKR } from "@/lib/format"

// stats: { receivables, collectionRate, paymentsThisMonth, paymentsLastMonth, openAnomalies }
export default function DashboardClientSections({ stats }) {
  const paymentsDeltaPct = stats.paymentsLastMonth
    ? (
      ((stats.paymentsThisMonth - stats.paymentsLastMonth) /
        stats.paymentsLastMonth) *
      100
    ).toFixed(0)
    : "0";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        index={0}
        icon={Wallet}
        label="Total Receivables"
        value={stats.receivables}
        formatValue={formatPKR}
      />
      <StatCard
        index={1}
        icon={Receipt}
        label="Collection Rate"
        value={stats.collectionRate}
        formatValue={(v) => `${v}%`}
        delta={stats.collectionRate >= 100 ? "Fully collected" : `${100 - stats.collectionRate}%`}
        deltaSuffix="still outstanding"
        deltaGood={stats.collectionRate >= 80}
      />
      <StatCard
        index={2}
        icon={TrendingUp}
        label="Payments This Month"
        value={stats.paymentsThisMonth}
        formatValue={formatPKR}
        delta={`${paymentsDeltaPct > 0 ? "+" : ""}${paymentsDeltaPct}%`}
        deltaGood={paymentsDeltaPct >= 0}
      />
    </div>
  );
}