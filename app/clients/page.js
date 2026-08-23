import { createClient } from '@/lib/supabase/server'
import ClientsTable from './ClientsTable'
import { Users } from 'lucide-react'

export default async function ClientsPage() {
  const supabase = await createClient()

  const [{ data: firms }, { data: balances }] = await Promise.all([
    supabase.from('firms').select('*').order('name'),
    supabase.rpc('get_firm_balances'),
  ])

  const billedMap = {}
  const paidMap = {}
    ; (balances || []).forEach((b) => {
      billedMap[b.firm_id] = b.billed || 0
      paidMap[b.firm_id] = b.paid || 0
    })

  const enriched = (firms || []).map((f) => ({
    ...f,
    balance: (billedMap[f.id] || 0) - (paidMap[f.id] || 0),
  }))

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-muted-foreground" />
        Clients
      </h1>
      <ClientsTable initialClients={enriched} />
    </div>
  )
}