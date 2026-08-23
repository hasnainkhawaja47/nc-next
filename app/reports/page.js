import { searchBills } from './actions'
import ReportsSearchForm from './ReportsSearchForm'
import Link from 'next/link'

export default async function ReportsPage({ searchParams }) {
    const sp = await searchParams
    const mode = sp.mode || 'date'
    const hasQuery = sp.from || sp.to || sp.bill_no || sp.do_no

    const results = hasQuery
        ? await searchBills({ mode, from: sp.from, to: sp.to, billNo: sp.bill_no, doNo: sp.do_no })
        : []

    return (
        <div className="p-4 sm:p-6 max-w-3xl">
            <h1 className="text-xl sm:text-2xl font-semibold mb-4">Search Bills</h1>

            <ReportsSearchForm defaultMode={mode} defaults={sp} />

            {hasQuery && (
                <div className="mt-6">
                    <div className="text-xs text-gray-500 mb-2">
                        {results.length} bill{results.length !== 1 ? 's' : ''} found
                    </div>

                    <div className="border rounded-md overflow-auto max-h-[60vh]">
                        <table className="w-full text-sm border-collapse min-w-[500px]">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                                <tr className="text-left border-b">
                                    <th className="py-2 px-3 bg-gray-50">Bill #</th>
                                    <th className="py-2 px-3 bg-gray-50">Client</th>
                                    <th className="py-2 px-3 bg-gray-50">Date</th>
                                    <th className="py-2 px-3 bg-gray-50">D/O #</th>
                                    <th className="py-2 px-3 bg-gray-50 text-right">Amount</th>
                                    <th className="py-2 px-3 bg-gray-50"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr><td colSpan={6} className="py-6 text-center text-gray-400">No bills found.</td></tr>
                                ) : (
                                    results.map((b) => (
                                        <tr key={b.id} className="border-b">
                                            <td className="py-2 px-3">{b.id}</td>
                                            <td className="py-2 px-3">{b.firms?.name || '—'}</td>
                                            <td className="py-2 px-3 whitespace-nowrap text-xs text-gray-500">{b.bill_date}</td>
                                            <td className="py-2 px-3">{b.do_no || '—'}</td>
                                            <td className="py-2 px-3 text-right">{b.total_amount?.toLocaleString()}</td>
                                            <td className="py-2 px-3">
                                                <Link href={`/new-bill?edit=${b.id}`} className="text-blue-600 text-xs">View</Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}