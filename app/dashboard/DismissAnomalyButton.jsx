'use client'

import { useTransition } from 'react'
import { X } from 'lucide-react'
import { dismissAnomaly } from './actions'

export default function DismissAnomalyButton({ id }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => dismissAnomaly(id))}
      className="rounded p-0.5 text-neutral-400 transition-colors duration-150 hover:bg-neutral-200 hover:text-neutral-700 disabled:opacity-50"
      aria-label="Dismiss anomaly"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )
}