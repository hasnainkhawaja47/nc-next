'use client'

import { useState, useTransition } from 'react'
import { Package, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTopProductsForMonth } from './actions'

const MAX_MONTHS_BACK = 4

export default function TopProducts({ initialProducts, initialMonthLabel, delayMs = 0 }) {
  const [products, setProducts] = useState(initialProducts)
  const [monthLabel, setMonthLabel] = useState(initialMonthLabel)
  const [offset, setOffset] = useState(0)
  const [isPending, startTransition] = useTransition()

  const max = products[0]?.units || 1

  function goTo(newOffset) {
    startTransition(async () => {
      const result = await getTopProductsForMonth(newOffset)
      setProducts(result.products)
      setMonthLabel(result.monthLabel)
      setOffset(newOffset)
    })
  }

  const canGoBack = offset > -MAX_MONTHS_BACK
  const canGoForward = offset < 0

  return (
    <div
      className="h-full flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-3 transition-shadow duration-200 hover:shadow-md"
      style={{
        animationDelay: `${delayMs}ms`,
        animationDuration: '500ms',
        animationFillMode: 'forwards',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex-1 space-y-3 transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
          <Package className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">
            Top Products — {monthLabel}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {offset !== 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => goTo(0)}
              disabled={isPending}
              title="Back to current month"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(offset - 1)}
            disabled={!canGoBack || isPending}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(offset + 1)}
            disabled={!canGoForward || isPending}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {products.length === 0 && (
          <p className="text-xs text-muted-foreground">No sales recorded this month.</p>
        )}
        {products.map((p, i) => {
          const pct = (p.units / max) * 100
          return (
            <div key={p.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-foreground/80">{p.name}</span>
                <span className="tabular-nums text-muted-foreground">{p.units}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground animate-in fade-in"
                  style={{
                    width: `${pct}%`,
                    animationDelay: `${delayMs + 120 + i * 80}ms`,
                    animationDuration: '500ms',
                    animationFillMode: 'forwards',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}