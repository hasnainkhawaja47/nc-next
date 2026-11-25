import { createClient } from '@/lib/supabase/server'
import BilledVsCollectedChart from './BilledVsCollectedChartClient'
import { BarChart3 } from 'lucide-react'

const MONTHS_BACK = 6

// 'YYYY-MM' key from a date string (works for 'YYYY-MM-DD' and ISO timestamps)
function monthKey(dateStr) {
  return String(dateStr).slice(0, 7)
}

// 'YYYY-MM' -> 'Nov 26'
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}

const pad = (n) => String(n).padStart(2, '0')

// Pulls the last 6 FULL calendar months (including the current one)
// of bills + payments and groups both by month, in chronological order.
export default async function BilledVsCollected() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Build the list of month keys, oldest -> newest (e.g. 2026-06 ... 2026-11)
  const now = new Date()
  const keys = []
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`)
  }

  // Start from the 1st of the oldest month (no partial month)
  const sinceDate = `${keys[0]}-01`

  const [{ data: bills }, { data: payments }] = await Promise.all([
    supabase
      .from('bills')
      .select('bill_date, total_amount')
      .gte('bill_date', sinceDate),
    supabase
      .from('payments')
      .select('payment_date, amount')
      .gte('payment_date', sinceDate),
  ])

  const billedByMonth = {}
  ;(bills || []).forEach((b) => {
    const k = monthKey(b.bill_date)
    billedByMonth[k] = (billedByMonth[k] || 0) + (b.total_amount || 0)
  })

  const collectedByMonth = {}
  ;(payments || []).forEach((p) => {
    const k = monthKey(p.payment_date)
    collectedByMonth[k] = (collectedByMonth[k] || 0) + (p.amount || 0)
  })

  // Fixed, already-sorted month list; empty months show as 0
  const data = keys.map((k) => ({
    month: monthLabel(k),
    billed: billedByMonth[k] || 0,
    collected: collectedByMonth[k] || 0,
  }))

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3 [animation-duration:500ms] [animation-fill-mode:forwards]">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-foreground">
          Billed vs Collected
        </h2>
      </div>
      <BilledVsCollectedChart data={data} />
    </div>
  )
}