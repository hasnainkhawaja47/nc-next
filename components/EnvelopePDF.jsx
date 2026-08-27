"use client";

// components/EnvelopePDF.jsx
// Commercial #10 envelope (4.125in x 9.5in), generated with @react-pdf/renderer.
// Sender block top-left, recipient block centered — standard envelope layout.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

// Commercial #10 = 9.5in wide x 4.125in tall (landscape) -> points (1in = 72pt)
const ENVELOPE_SIZE = [9.5 * 72, 4.125 * 72];

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  recipient: {
    position: "absolute",
    top: 130,
    left: 340,
    maxWidth: 300,
  },
  recipientName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  recipientLine: { fontSize: 10.5, marginTop: 1 },
});

/**
 * firm: { name, address?, phone? }
 */
export function EnvelopePDF({ firm }) {
  return (
    <Document>
      <Page size={ENVELOPE_SIZE} style={styles.page}>
        <View style={styles.recipient}>
          <Text style={styles.recipientName}>{firm?.name || ""}</Text>
          {firm?.address ? (
            <Text style={styles.recipientLine}>{firm.address}</Text>
          ) : null}
          {firm?.phone ? (
            <Text style={styles.recipientLine}>{firm.phone}</Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

/**
 * Drop-in download button for the Ledger page toolbar, next to the
 * ledger PDF download button. Disabled when the client has no address
 * on file, since an envelope without one isn't useful.
 */
export function EnvelopePDFDownloadButton({ firm }) {
  const fileName = `${(firm?.name || "envelope").replace(/\s+/g, "_")}_envelope.pdf`;
  const hasAddress = Boolean(firm?.address);

  if (!hasAddress) {
    return (
      <Button type="button" variant="outline" disabled title="Add an address to this client first">
        <Mail className="w-4 h-4 mr-1.5" />
        Print envelope
      </Button>
    );
  }

  return (
    <PDFDownloadLink document={<EnvelopePDF firm={firm} />} fileName={fileName}>
      {({ loading }) => (
        <Button type="button" variant="outline" disabled={loading}>
          <Mail className="w-4 h-4 mr-1.5" />
          {loading ? "Preparing..." : "Print envelope"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}