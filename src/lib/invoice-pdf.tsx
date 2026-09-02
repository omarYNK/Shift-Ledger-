import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

function fmtDate(d: Date) {
  return dateFmt.format(d);
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  businessName: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  businessInfoLine: { fontSize: 9, color: "#444", lineHeight: 1.4 },
  invoiceTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "right", marginBottom: 4 },
  invoiceMetaLine: { fontSize: 9, color: "#444", textAlign: "right", lineHeight: 1.4 },
  billTo: { marginBottom: 20 },
  billToLabel: { fontSize: 8, color: "#888", textTransform: "uppercase", marginBottom: 2, letterSpacing: 0.5 },
  billToName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  billToRate: { fontSize: 9, color: "#444" },
  table: { display: "flex", width: "100%" },
  colDate: { width: "16%" },
  colDesc: { width: "44%" },
  colHours: { width: "12%", textAlign: "right" },
  colRate: { width: "14%", textAlign: "right" },
  colAmount: { width: "14%", textAlign: "right" },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", color: "#555" },
  groupHeaderRow: { paddingTop: 10, paddingBottom: 3 },
  groupHeaderText: { fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  noteText: { fontSize: 8, color: "#777", marginTop: 2 },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  subtotalRow: {
    flexDirection: "row",
    paddingVertical: 6,
    marginTop: 2,
    borderTopWidth: 0.5,
    borderTopColor: "#1a1a1a",
  },
  subtotalLabel: { width: "86%", textAlign: "right", fontSize: 9, fontFamily: "Helvetica-Bold", paddingRight: 8 },
  subtotalValue: { width: "14%", textAlign: "right", fontSize: 9, fontFamily: "Helvetica-Bold" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: "#1a1a1a",
  },
  totalLabel: { width: "86%", textAlign: "right", fontSize: 12, fontFamily: "Helvetica-Bold", paddingRight: 8 },
  totalValue: { width: "14%", textAlign: "right", fontSize: 12, fontFamily: "Helvetica-Bold" },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
});

export type InvoicePdfProps = {
  businessName: string;
  businessInfo: string;
  clientName: string;
  clientRate: number | null;
  invoiceNumber: string;
  invoiceDate: Date;
  periodStart: Date;
  periodEnd: Date;
  laborItems: Array<{
    date: Date;
    employeeName: string;
    startTime: string;
    endTime: string;
    hours: number;
    rate: number;
    amount: number;
    note?: string | null;
  }>;
  fixedItems: Array<{ date: Date; description: string; amount: number }>;
  subtotalLabor: number;
  subtotalFixed: number;
  total: number;
};

export function InvoicePdf(props: InvoicePdfProps) {
  const {
    businessName,
    businessInfo,
    clientName,
    clientRate,
    invoiceNumber,
    invoiceDate,
    periodStart,
    periodEnd,
    laborItems,
    fixedItems,
    subtotalLabor,
    subtotalFixed,
    total,
  } = props;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{businessName}</Text>
            {businessInfo.split("\n").filter(Boolean).map((line, i) => (
              <Text key={i} style={styles.businessInfoLine}>{line}</Text>
            ))}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMetaLine}>{invoiceNumber}</Text>
            <Text style={styles.invoiceMetaLine}>Date: {fmtDate(invoiceDate)}</Text>
            <Text style={styles.invoiceMetaLine}>
              Period: {fmtDate(periodStart)} – {fmtDate(periodEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.billTo}>
          <Text style={styles.billToLabel}>Bill To</Text>
          <Text style={styles.billToName}>{clientName}</Text>
          {clientRate !== null && (
            <Text style={styles.billToRate}>Rate: {currency.format(clientRate)} / hr</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Hours</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {laborItems.length > 0 && (
            <View style={styles.groupHeaderRow} wrap={false}>
              <Text style={styles.groupHeaderText}>Labor</Text>
            </View>
          )}
          {laborItems.map((item, i) => (
            <View style={styles.row} key={`labor-${i}`} wrap={false}>
              <Text style={styles.colDate}>{fmtDate(item.date)}</Text>
              <View style={styles.colDesc}>
                <Text>
                  Labor — {item.employeeName} ({item.startTime}–{item.endTime})
                </Text>
                {item.note && <Text style={styles.noteText}>{item.note}</Text>}
              </View>
              <Text style={styles.colHours}>{item.hours.toFixed(2)}</Text>
              <Text style={styles.colRate}>{currency.format(item.rate)}</Text>
              <Text style={styles.colAmount}>{currency.format(item.amount)}</Text>
            </View>
          ))}
          {laborItems.length > 0 && (
            <View style={styles.subtotalRow} wrap={false}>
              <Text style={styles.subtotalLabel}>Labor subtotal</Text>
              <Text style={styles.subtotalValue}>{currency.format(subtotalLabor)}</Text>
            </View>
          )}

          {fixedItems.length > 0 && (
            <View style={styles.groupHeaderRow} wrap={false}>
              <Text style={styles.groupHeaderText}>Other Charges</Text>
            </View>
          )}
          {fixedItems.map((item, i) => (
            <View style={styles.row} key={`fixed-${i}`} wrap={false}>
              <Text style={styles.colDate}>{fmtDate(item.date)}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colHours}></Text>
              <Text style={styles.colRate}></Text>
              <Text style={styles.colAmount}>{currency.format(item.amount)}</Text>
            </View>
          ))}
          {fixedItems.length > 0 && (
            <View style={styles.subtotalRow} wrap={false}>
              <Text style={styles.subtotalLabel}>Other charges subtotal</Text>
              <Text style={styles.subtotalValue}>{currency.format(subtotalFixed)}</Text>
            </View>
          )}

          <View style={styles.totalRow} wrap={false}>
            <Text style={styles.totalLabel}>Total due</Text>
            <Text style={styles.totalValue}>{currency.format(total)}</Text>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
