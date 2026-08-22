'use client'

import { toast } from 'sonner'
import { PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import BillDocument from '@/components/BillDocument'

export function showBillSavedToast({ bill, firmName, items, amountWords, prevBalance, onStartNew }) {
  const doc = (
    <BillDocument bill={bill} firmName={firmName} items={items} amountWords={amountWords} prevBalance={prevBalance} />
  )

  const id = toast.custom(
    (t) => (
      <div className="bg-white border rounded-md shadow-lg p-4 w-[320px]">
        <p className="text-sm font-medium mb-3">Bill #{bill.id} saved</p>
        <div className="flex gap-2 flex-wrap">
          <PDFDownloadLink document={doc} fileName={`bill-${bill.id}.pdf`}>
            {({ loading }) => <Button size="sm" disabled={loading}>{loading ? 'Preparing...' : 'Download'}</Button>}
          </PDFDownloadLink>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const blob = await pdf(doc).toBlob()
              window.open(URL.createObjectURL(blob), '_blank')
            }}
          >
            Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.dismiss(t)
              onStartNew()
            }}
          >
            Start new bill
          </Button>
        </div>
      </div>
    ),
    { duration: Infinity }
  )

  return id
}