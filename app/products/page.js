import { createClient } from '@/lib/supabase/server'
import ProductsTable from './ProductsTable'
import { Package } from 'lucide-react'
export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const [{ data: products }, { data: soldRows }, { data: soldYtdRows }] = await Promise.all([
    supabase.from('products').select('id, code, name, standard_price, cost_price').order('code'),
    supabase.rpc('get_product_units_sold'),
    supabase.rpc('get_product_units_sold_ytd'),
  ])

  const soldMap = {}
    ; (soldRows || []).forEach((r) => { soldMap[r.product_id] = r.units_sold || 0 })

  const soldYtdMap = {}
    ; (soldYtdRows || []).forEach((r) => { soldYtdMap[r.product_id] = r.units_sold_ytd || 0 })

  const enriched = (products || []).map((p) => ({
    ...p,
    units_sold: soldMap[p.id] || 0,
    units_sold_ytd: soldYtdMap[p.id] || 0,
    margin_pct: p.cost_price > 0 ? Math.round(((p.standard_price - p.cost_price) / p.standard_price) * 100) : null,
  }))

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-muted-foreground" />
          Products
        </h1>      </div>
      <ProductsTable initialProducts={enriched} />
    </div>
  )
}