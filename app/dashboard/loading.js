import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-32" />
            </div>
          ))}
        </div>

        {/* Top Products + Top Clients */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-[288px] w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-[288px] w-full" />
          </div>
        </div>

        {/* Recent Activity + Anomalies */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-[280px] w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-[280px] w-full" />
          </div>
        </div>

        {/* Billed vs Collected + Today's Payments */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-[288px] w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-[280px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}