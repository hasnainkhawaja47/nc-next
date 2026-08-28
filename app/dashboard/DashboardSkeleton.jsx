import React from "react";

function Skeleton({ className }) {
  return <div className={"animate-pulse rounded-md bg-muted " + className} />;
}

export default function DashboardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-6 w-32" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-1 rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}