import { createClient } from '@/lib/supabase/server'
import DashboardClientSections from './DashboardClientSections'
import BilledVsCollected from './BilledVsCollected'
import TodaysPayments from './TodaysPayments'
import TopProducts from './TopProducts'
import TopClients from './TopClients'
import RecentActivity from './RecentActivity'
import Anomalies from './Anomalies'

function monthBounds(offset = 0) {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const next = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  return { start: first.toISOString().split('T')[0], end: next.toISOString().split('T')[0] }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const thisMonth = monthBounds(0)
  const lastMonth = monthBounds(-1)

  const [
    { data: firmBalances },
    { count: billsThisMonth },
    { count: billsLastMonth },
    { data: paymentsThisMonthRows },
    { data: paymentsLastMonthRows },
    { count: openAnomaliesCount },
    { data: thisMonthBillIds },
    { data: firms },
    { data: recentBills },
    { data: recentPayments },
    { data: anomalyRows },
  ] = await Promise.all([
    supabase.rpc('get_firm_balances'), // returns firm_id, billed, paid (union of live + archive bills/payments)
    supabase.from('bills').select('id', { count: 'exact', head: true }).gte('bill_date', thisMonth.start).lt('bill_date', thisMonth.end),
    supabase.from('bills').select('id', { count: 'exact', head: true }).gte('bill_date', lastMonth.start).lt('bill_date', lastMonth.end),
    supabase.from('payments').select('amount').gte('payment_date', thisMonth.start).lt('payment_date', thisMonth.end),
    supabase.from('payments').select('amount').gte('payment_date', lastMonth.start).lt('payment_date', lastMonth.end),
    supabase.from('anomalies').select('id', { count: 'exact', head: true }).or('dismissed.is.null,dismissed.eq.false'),
    supabase.from('bills').select('id').gte('bill_date', thisMonth.start).lt('bill_date', thisMonth.end),
    supabase.from('firms').select('id, name'),
    supabase.from('bills').select('id, bill_date, total_amount, firm_id, firms(name)').order('bill_date', { ascending: false }).limit(5),
    supabase.from('payments').select('id, payment_date, amount, firm_id, firms(name)').order('payment_date', { ascending: false }).limit(5),
    supabase.from('anomalies').select('id, type, firm_name, details, detected_at').or('dismissed.is.null,dismissed.eq.false').order('detected_at', { ascending: false }).limit(5),
  ])

  // Stats
  // get_firm_balances returns firm_id, billed, paid (incl. archive tables) — balance = billed - paid
  const receivables = (firmBalances || []).reduce(
    (sum, f) => sum + ((f.billed || 0) - (f.paid || 0)),
    0
  )
  const paymentsThisMonth = (paymentsThisMonthRows || []).reduce((s, p) => s + (p.amount || 0), 0)
  const paymentsLastMonth = (paymentsLastMonthRows || []).reduce((s, p) => s + (p.amount || 0), 0)

  const stats = {
    receivables,
    billsThisMonth: billsThisMonth || 0,
    billsLastMonth: billsLastMonth || 0,
    paymentsThisMonth,
    paymentsLastMonth,
    openAnomalies: openAnomaliesCount || 0,
  }

  // Top products this month
  const billIds = (thisMonthBillIds || []).map((b) => b.id)
  let topProductsThisMonth = []
  if (billIds.length > 0) {
    const { data: items } = await supabase
      .from('bill_items')
      .select('product_name, quantity')
      .in('bill_id', billIds)
    const totals = {}
    ;(items || []).forEach((it) => {
      totals[it.product_name] = (totals[it.product_name] || 0) + (it.quantity || 0)
    })
    topProductsThisMonth = Object.entries(totals)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5)
  }

  // Top clients by balance (full sorted list, TopClients slices top 5 + shows full via dialog)
  const firmMap = {}
  ;(firms || []).forEach((f) => { firmMap[f.id] = f.name })
  const allClientsByBalance = (firmBalances || [])
    .map((f) => ({
      name: firmMap[f.firm_id] || 'Unknown',
      balance: (f.billed || 0) - (f.paid || 0),
    }))
    .sort((a, b) => b.balance - a.balance)
  const topClients = allClientsByBalance.slice(0, 5)

  // Recent activity (bills + payments merged)
  const activity = [
    ...(recentBills || []).map((b) => ({
      type: 'bill',
      client: b.firms?.name || '—',
      amount: b.total_amount,
      date: b.bill_date,
    })),
    ...(recentPayments || []).map((p) => ({
      type: 'payment',
      client: p.firms?.name || '—',
      amount: p.amount,
      date: p.payment_date,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map((a) => ({
      ...a,
      date: new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    }))

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 [animation-duration:400ms] [animation-fill-mode:forwards]">
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of Needle Craft's billing and receivables
          </p>
        </div>

        <DashboardClientSections stats={stats} />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TopProducts products={topProductsThisMonth} monthLabel="This Month" delayMs={220} />
          </div>
          <TopClients topFive={topClients} allClients={allClientsByBalance} delayMs={280} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentActivity items={activity} delayMs={340} />
          <Anomalies items={anomalyRows || []} delayMs={400} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BilledVsCollected />
          <TodaysPayments />
        </div>
      </div>
    </div>
  )
}