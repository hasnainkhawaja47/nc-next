import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-7 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
        {/* Form column */}
        <div className="border rounded-xl p-6 max-w-md shadow-sm space-y-4">
          <div className="mb-1 space-y-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>

          {/* Client name input */}
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* PaymentFields: date / amount / method / balance (approximate) */}
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          <div className="flex gap-2 pt-1">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </div>

        {/* Table column */}
        <div className="min-w-0">
          <Skeleton className="h-4 w-28 mb-2" />
          <div className="border rounded-lg p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-[70px] shrink-0" />
                <Skeleton className="h-8 w-[120px] shrink-0" />
                <Skeleton className="h-8 w-[80px] shrink-0" />
                <Skeleton className="h-8 w-[70px] shrink-0" />
                <Skeleton className="h-8 w-[140px] flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}