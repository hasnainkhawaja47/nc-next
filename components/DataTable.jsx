export default function DataTable({ columns, data, keyField = 'id', renderActions }) {
  return (
    <div className="border rounded-lg overflow-auto max-h-[70vh]">
      <table className="w-full text-sm border-collapse min-w-[600px]">
        <thead className="sticky top-0 bg-gray-50 z-10">
          <tr className="text-left border-b">
            {columns.map((col) => (
              <th key={col.key} className="py-2 px-3 bg-gray-50">{col.header}</th>
            ))}
            {renderActions && <th className="py-2 px-3 bg-gray-50"></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="py-2 px-3">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {renderActions && (
                <td className="py-2 px-3 whitespace-nowrap">{renderActions(row)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}