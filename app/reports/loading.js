import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <Skeleton className="h-7 w-40 mb-4" />

      <div className="rounded-xl border p-4 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="rounded-xl border overflow-hidden">
          <Skeleton className="h-10 w-full" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mt-px" />
          ))}
        </div>
      </div>
    </div>
  )
}