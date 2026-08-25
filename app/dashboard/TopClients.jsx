import React from "react";
import { Users } from "lucide-react";
import { formatPKR } from "./mockData";
import ViewAllClientsDialog from "./ViewAllClientsDialog";

// topFive: first 5 clients to show inline
// allClients: full sorted list, passed to the "View all" dialog
export default function TopClients({ topFive, allClients, delayMs = 0 }) {
  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3"
      style={{
        animationDelay: `${delayMs}ms`,
        animationDuration: "500ms",
        animationFillMode: "forwards",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-neutral-400" />
          <h2 className="text-sm font-medium text-neutral-900">
            Top Clients by Balance
          </h2>
        </div>
        <ViewAllClientsDialog clients={allClients} />
      </div>
      <div className="space-y-3">
        {topFive.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-neutral-50"
          >
            <span className="text-sm text-neutral-700">{c.name}</span>
            <span className="text-sm font-medium tabular-nums text-neutral-900">
              {formatPKR(c.balance)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}