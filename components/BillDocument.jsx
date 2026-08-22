import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 12 },
  logo: { fontSize: 18, fontWeight: 700, letterSpacing: 2 },
  sub: { fontSize: 9, color: '#666', marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metaRight: { textAlign: 'right' },
  table: { borderTop: '1 solid #ccc', borderBottom: '1 solid #ccc', marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5 solid #eee' },
  tableHeader: { flexDirection: 'row', paddingVertical: 4, fontWeight: 700, backgroundColor: '#f5f5f5' },
  colNum: { width: '6%' },
  colName: { width: '32%' },
  colColour: { width: '14%' },
  colSize: { width: '10%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '14%', textAlign: 'right' },
  colTotal: { width: '14%', textAlign: 'right' },
  totals: { marginTop: 8, alignItems: 'flex-end' },
  totalLine: { fontSize: 10, marginBottom: 2 },
  grandTotal: { fontSize: 13, fontWeight: 700, marginTop: 4 },
  words: { fontSize: 9, color: '#555', marginTop: 2, fontStyle: 'italic' },
  balances: { marginTop: 10, borderTop: '1 solid #ccc', paddingTop: 6 },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 9, color: '#888' },
})

export default function BillDocument({ bill, firmName, items, amountWords, prevBalance }) {
  const newBalance = prevBalance + bill.total_amount

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>NEEDLE CRAFT</Text>
          <Text style={styles.sub}>Wholesale Garments — Rawalpindi</Text>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text>Bill #: {bill.id}</Text>
            {bill.bilty_no ? <Text>Bilty #: {bill.bilty_no}</Text> : null}
            {bill.do_no ? <Text>D/O #: {bill.do_no}</Text> : null}
          </View>
          <View style={styles.metaRight}>
            <Text>Date: {bill.bill_date}</Text>
            <Text>Type: {bill.is_credit ? 'Credit' : 'Cash'}</Text>
            <Text>Client: {firmName}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNum}>#</Text>
            <Text style={styles.colName}>Particular</Text>
            <Text style={styles.colColour}>Colour</Text>
            <Text style={styles.colSize}>Size</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colNum}>{i + 1}</Text>
              <Text style={styles.colName}>{item.product_name}</Text>
              <Text style={styles.colColour}>{item.colour}</Text>
              <Text style={styles.colSize}>{item.size}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{item.price.toLocaleString()}</Text>
              <Text style={styles.colTotal}>{item.total.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          {bill.bilty_charges ? <Text style={styles.totalLine}>Bilty charges: {bill.bilty_charges.toLocaleString()}</Text> : null}
          {bill.packaging_charges ? <Text style={styles.totalLine}>Packaging: {bill.packaging_charges.toLocaleString()}</Text> : null}
          <Text style={styles.grandTotal}>Total: Rs. {bill.total_amount.toLocaleString()}</Text>
          <Text style={styles.words}>{amountWords}</Text>
        </View>

        <View style={styles.balances}>
          <Text style={styles.totalLine}>Previous balance: Rs. {prevBalance.toLocaleString()}</Text>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>New balance: Rs. {newBalance.toLocaleString()}</Text>
        </View>

        <Text style={styles.footer}>Thank you for your business</Text>
      </Page>
    </Document>
  )
}