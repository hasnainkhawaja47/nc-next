import { createClient } from '@/lib/supabase/server'
import BilledVsCollectedChart from './BilledVsCollectedChartClient'
import { BarChart3 } from 'lucide-react'

function monthKey(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// Pulls last 6 months of bills + payments and groups both by month.
// NOTE: assumes bills.total_amount holds the billed amount for that row —
// adjust the select/column name if your bills table names it differently.
export default async function BilledVsCollected() {
  const supabase = await createClient()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sinceDate = sixMonthsAgo.toISOString().split('T')[0]

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

  const months = Array.from(
    new Set([...Object.keys(billedByMonth), ...Object.keys(collectedByMonth)])
  )

  const data = months.map((m) => ({
    month: m,
    billed: billedByMonth[m] || 0,
    collected: collectedByMonth[m] || 0,
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