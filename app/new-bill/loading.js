import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="border-b bg-muted/40 px-2.5 py-2.5">
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2.5 py-2.5 border-b last:border-b-0">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>

          <div className="border-t pt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="flex gap-4">
              <div className="w-32 space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="w-32 space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="flex items-center gap-5 ml-auto">
              <div className="text-right space-y-1.5">
                <Skeleton className="h-3 w-20 ml-auto" />
                <Skeleton className="h-7 w-28 ml-auto" />
              </div>
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}