"use client";

import React, { useEffect, useState } from "react";
import { Receipt, Wallet, AlertTriangle, TrendingUp } from "lucide-react";

import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";
import TopProducts from "./TopProducts";
import TopClients from "./TopClients";
import RecentActivity from "./RecentActivity";
import Anomalies from "./Anomalies";
import DashboardSkeleton from "./DashboardSkeleton";
import {
  stats,
  revenueTrend,
  topProductsThisMonth,
  topClients,
  recentActivity,
  anomalies,
  formatPKR,
} from "./mockData";

// NOTE: all data below is mocked. When wiring this up for real:
// - stats.receivables      -> get_firm_balances (sum)
// - stats.bills*Month      -> count on bills filtered by bill_date
// - stats.payments*Month   -> sum on payments filtered by payment date
// - stats.openAnomalies    -> count on anomalies where unresolved
// - revenueTrend           -> bills grouped by month (last 6-12 months)
// - topProductsThisMonth   -> bill_items join bills, filter bill_date this month, group by product_id
// - topClients             -> get_firm_balances, sorted desc, top N
// - recentActivity         -> latest bills + payments merged, sorted by date
// - anomalies              -> anomalies table, unresolved, latest N

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const billsDeltaPct = (
    ((stats.billsThisMonth - stats.billsLastMonth) / stats.billsLastMonth) *
    100
  ).toFixed(0);
  const paymentsDeltaPct = (
    ((stats.paymentsThisMonth - stats.paymentsLastMonth) /
      stats.paymentsLastMonth) *
    100
  ).toFixed(0);

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 opacity-0 animate-in fade-in slide-in-from-bottom-2 [animation-duration:400ms] [animation-fill-mode:forwards]">
          <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500">
            Overview of Needle Craft's billing and receivables
          </p>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                label="Bills This Month"
                value={stats.billsThisMonth}
                delta={`${billsDeltaPct > 0 ? "+" : ""}${billsDeltaPct}%`}
                deltaGood={billsDeltaPct >= 0}
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
              <StatCard
                index={3}
                icon={AlertTriangle}
                label="Open Anomalies"
                value={stats.openAnomalies}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <RevenueChart data={revenueTrend} delayMs={160} />
              <TopProducts
                products={topProductsThisMonth}
                monthLabel="August"
                delayMs={220}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <TopClients clients={topClients} delayMs={280} />
              <RecentActivity items={recentActivity} delayMs={340} />
              <Anomalies items={anomalies} delayMs={400} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}