import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'

export default function DataTable({ columns, data, keyField = 'id', renderActions }) {
  return (
    <div className="border rounded-lg overflow-auto max-h-[70vh]">
      <Table className="min-w-[600px]">
        <TableHeader className="bg-muted">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="sticky top-0 z-10 bg-muted">{col.header}</TableHead>
            ))}
            {renderActions && <TableHead className="sticky top-0 z-10 bg-muted"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} className="text-center text-muted-foreground py-6">
                No records found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row[keyField]} className="transition-colors hover:bg-muted/50">
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell className="whitespace-nowrap">{renderActions(row)}</TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}