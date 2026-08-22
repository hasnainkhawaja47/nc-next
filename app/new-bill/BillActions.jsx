'use client'

import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { useState } from 'react'
import BillDocument from '@/components/BillDocument'

export default function BillActions({ bill, firmName, items, amountWords, prevBalance }) {
  const [showPreview, setShowPreview] = useState(false)

  const doc = (
    <BillDocument bill={bill} firmName={firmName} items={items} amountWords={amountWords} prevBalance={prevBalance} />
  )

  return (
    <div className="mt-4 border rounded-lg p-4 bg-gray-50">
      <p className="text-sm font-medium mb-3">Bill #{bill.id} saved</p>
      <div className="flex gap-3">
        <PDFDownloadLink
          document={doc}
          fileName={`bill-${bill.id}.pdf`}
          className="bg-[#1a1a2e] text-white px-4 py-2 rounded text-sm"
        >
          {({ loading }) => (loading ? 'Preparing...' : 'Download PDF')}
        </PDFDownloadLink>
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="border px-4 py-2 rounded text-sm"
        >
          {showPreview ? 'Hide preview' : 'Preview / Print'}
        </button>
      </div>

      {showPreview && (
        <div className="mt-4 h-[600px] border rounded">
          <PDFViewer width="100%" height="100%">
            {doc}
          </PDFViewer>
        </div>
      )}
    </div>
  )
}