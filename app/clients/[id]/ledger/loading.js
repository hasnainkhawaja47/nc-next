import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-7 w-56" />
      </div>

      {/* Filter toolbar: From / To / Filter / Clear / Download PDF / Print envelope */}
      <div className="flex flex-wrap items-end justify-center gap-3">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-9 w-[180px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-9 w-[180px]" />
        </div>
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 my-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-md p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-auto max-h-[60vh]">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 z-10 bg-muted"><Skeleton className="h-3.5 w-10" /></TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted"><Skeleton className="h-3.5 w-20" /></TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted text-right"><Skeleton className="h-3.5 w-12 ml-auto" /></TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted text-right"><Skeleton className="h-3.5 w-12 ml-auto" /></TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted text-right"><Skeleton className="h-3.5 w-14 ml-auto" /></TableHead>
              <TableHead className="sticky top-0 z-10 bg-muted"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 9 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-3.5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-3.5 w-40" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}