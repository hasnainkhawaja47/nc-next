"use client";

// components/LedgerPDF.jsx
// A4 ledger statement, generated with @react-pdf/renderer. Matches the
// entry shape returned by getLedger() / rendered by the on-screen table:
//   { type: 'opening' | 'bill' | 'payment', date, description,
//     credit, debit, balance, openingBalance, isActive, id }

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    borderBottom: "1.5pt solid #1a1a1a",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 17,
    fontFamily: "Times-Bold",
    letterSpacing: 1.5,
  },
  companySub: { fontSize: 8, color: "#555", marginTop: 4 },
  statementTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right" },
  statementMeta: { fontSize: 8, color: "#555", textAlign: "right", marginTop: 2 },
  clientBlock: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clientName: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  clientDetail: { fontSize: 8, color: "#555", marginTop: 2 },
  rangeLabel: { fontSize: 9, color: "#333" },
  table: { width: "100%", marginTop: 4 },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderTop: "0.75pt solid #ccc",
    borderBottom: "0.75pt solid #ccc",
    paddingVertical: 5,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #e5e5e5",
    paddingVertical: 4,
  },
  openingRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    paddingVertical: 5,
    borderBottom: "0.75pt solid #ccc",
    fontFamily: "Helvetica-Bold",
  },
  colDate: { width: "13%" },
  colDesc: { width: "37%" },
  colCredit: { width: "16%", textAlign: "right" },
  colDebit: { width: "16%", textAlign: "right" },
  colBalance: { width: "18%", textAlign: "right" },
  archivedTag: { fontSize: 6.5, color: "#999" },
  totalsBlock: {
    marginTop: 14,
    alignSelf: "flex-end",
    width: "45%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
    marginTop: 3,
    borderTop: "1pt solid #1a1a1a",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#999",
    textAlign: "center",
    borderTop: "0.5pt solid #e5e5e5",
    paddingTop: 6,
  },
});

const fmt = (n) =>
  (Number(n) || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * entries: ledger.entries as returned by getLedger() — same array the
 *   on-screen table renders, already filtered to the current date range.
 * firm: { name, address?, phone? }
 * dateRange: { from: string, to: string }
 * totals: { totalBilled, totalPaid, balance } — from getLedger(), used
 *   for the closing summary so it exactly matches the on-screen cards.
 */
export function LedgerPDF({ entries = [], firm, dateRange, totals }) {
  const opening = entries.find((e) => e.type === "opening");
  const rows = entries.filter((e) => e.type !== "opening");

  const totalDebit = totals?.totalBilled ?? rows.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = totals?.totalPaid ?? rows.reduce((sum, e) => sum + (e.credit || 0), 0);
  const closingBalance =
    totals?.balance ?? (rows.length > 0 ? rows[rows.length - 1].balance : opening?.openingBalance ?? 0);

  const rangeText =
    dateRange?.from || dateRange?.to
      ? `${dateRange.from ? fmtDate(dateRange.from) : "Start"} — ${
          dateRange.to ? fmtDate(dateRange.to) : "Today"
        }`
      : "Full history";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>NEEDLE CRAFT</Text>
            <Text style={styles.companySub}>Rawalpindi, Pakistan</Text>
          </View>
          <View>
            <Text style={styles.statementTitle}>Client Ledger Statement</Text>
            <Text style={styles.statementMeta}>
              Generated {fmtDate(new Date())}
            </Text>
          </View>
        </View>

        <View style={styles.clientBlock}>
          <View>
            <Text style={styles.clientName}>{firm?.name || ""}</Text>
            {firm?.address ? (
              <Text style={styles.clientDetail}>{firm.address}</Text>
            ) : null}
            {firm?.phone ? (
              <Text style={styles.clientDetail}>{firm.phone}</Text>
            ) : null}
          </View>
          <Text style={styles.rangeLabel}>Period: {rangeText}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colCredit}>Credit</Text>
            <Text style={styles.colDebit}>Debit</Text>
            <Text style={styles.colBalance}>Balance</Text>
          </View>

          {opening && (
            <View style={styles.openingRow}>
              <Text style={styles.colDate}>{fmtDate(opening.date)}</Text>
              <Text style={styles.colDesc}>{opening.description}</Text>
              <Text style={styles.colCredit}>—</Text>
              <Text style={styles.colDebit}>—</Text>
              <Text style={styles.colBalance}>{fmt(opening.openingBalance)}</Text>
            </View>
          )}

          {rows.map((e, i) => (
            <View style={styles.row} key={e.id ?? i} wrap={false}>
              <Text style={styles.colDate}>{fmtDate(e.date)}</Text>
              <Text style={styles.colDesc}>
                {e.description}
                {!e.isActive && <Text style={styles.archivedTag}> (archived)</Text>}
              </Text>
              <Text style={styles.colCredit}>{e.credit > 0 ? fmt(e.credit) : "—"}</Text>
              <Text style={styles.colDebit}>{e.debit > 0 ? fmt(e.debit) : "—"}</Text>
              <Text style={styles.colBalance}>{fmt(e.balance)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Total Billed (period)</Text>
            <Text>{fmt(totalDebit)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Total Paid (period)</Text>
            <Text>{fmt(totalCredit)}</Text>
          </View>
          <View style={styles.totalsRowFinal}>
            <Text>Closing Balance</Text>
            <Text>{fmt(closingBalance)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Needle Craft — Client Ledger Statement — {firm?.name || ""} — {rangeText}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Drop-in download button for the Ledger page toolbar. Styled to match
 * the Filter/Clear buttons (same Button component, "outline" variant).
 */
export function LedgerPDFDownloadButton({ entries, firm, dateRange, totals }) {
  const fileName = `${(firm?.name || "ledger").replace(/\s+/g, "_")}_ledger.pdf`;

  return (
    <PDFDownloadLink
      document={
        <LedgerPDF entries={entries} firm={firm} dateRange={dateRange} totals={totals} />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button type="button" variant="outline" disabled={loading}>
          <Download className="w-4 h-4 mr-1.5" />
          {loading ? "Preparing..." : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}