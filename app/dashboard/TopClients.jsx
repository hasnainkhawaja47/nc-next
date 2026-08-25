import React from "react";
import { Users } from "lucide-react";
import { formatPKR } from "./mockData";

export default function TopClients({ clients, delayMs = 0 }) {
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
        <Users className="h-4 w-4 text-neutral-400" />
        <h2 className="text-sm font-medium text-neutral-900">
          Top Clients by Balance
        </h2>
      </div>
      <div className="space-y-3">
        {clients.map((c) => (
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