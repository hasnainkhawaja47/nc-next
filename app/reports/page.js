import { searchBills } from './actions'
import ReportsSearchForm from './ReportsSearchForm'
import ResultsTable from './ResultsTable'

export default async function ReportsPage({ searchParams }) {
  const sp = await searchParams
  const mode = sp.mode || 'date'
  const hasQuery = sp.from || sp.to || sp.bill_no || sp.do_no

  const results = hasQuery
    ? await searchBills({ mode, from: sp.from, to: sp.to, billNo: sp.bill_no, doNo: sp.do_no })
    : []

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">Search Bills</h1>

      <ReportsSearchForm defaultMode={mode} defaults={sp} />

      {hasQuery && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <ResultsTable results={results} />
        </div>
      )}
    </div>
  )
}