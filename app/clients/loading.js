import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-4 sm:p-6">
      <Skeleton className="h-7 w-24 mb-4" />

      <div className="flex justify-end mb-3">
        <Skeleton className="h-9 w-28" />
      </div>

      <Skeleton className="h-9 w-full mb-4" />

      <div className="border rounded-lg p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}