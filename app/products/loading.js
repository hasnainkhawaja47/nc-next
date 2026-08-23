import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-9 w-32" />
            </div>
            <div className="border rounded-lg p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                ))}
            </div>
        </div>
    )
}