import { AlertTriangle } from 'lucide-react'
import DismissAnomalyButton from './DismissAnomalyButton'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// items: rows from the anomalies table (id, type, firm_name, details, detected_at)
export default function Anomalies({ items, delayMs = 0 }) {
  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3"
      style={{
        animationDelay: `${delayMs}ms`,
        animationDuration: '500ms',
        animationFillMode: 'forwards',
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-medium text-neutral-900">Anomalies</h2>
      </div>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-xs text-neutral-400">No open anomalies</p>
        )}
        {items.map((an) => (
          <div
            key={an.id}
            className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {an.type}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">
                  {fmtDate(an.detected_at)}
                </span>
                <DismissAnomalyButton id={an.id} />
              </div>
            </div>
            <p className="text-xs font-medium text-neutral-800">
              {an.firm_name || '—'}
            </p>
            <p className="text-xs text-neutral-500">{an.details}</p>
          </div>
        ))}
      </div>
    </div>
  )
}