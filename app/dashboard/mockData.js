// Temporary mock data — replace each block with real Supabase queries when porting.
// See areas/needle-craft-webapp notes for which RPCs/queries back each section.

export const stats = {
  receivables: 1284500,
  billsThisMonth: 42,
  billsLastMonth: 36,
  paymentsThisMonth: 918200,
  paymentsLastMonth: 845000,
  openAnomalies: 3,
};

export const revenueTrend = [
  { month: "Mar", total: 620000 },
  { month: "Apr", total: 710000 },
  { month: "May", total: 680000 },
  { month: "Jun", total: 790000 },
  { month: "Jul", total: 860000 },
  { month: "Aug", total: 918200 },
];

export const topProductsThisMonth = [
  { name: "Fleece Suit - L", units: 320 },
  { name: "Jersey Set", units: 275 },
  { name: "Vest - M", units: 210 },
  { name: "Gloves (pair)", units: 190 },
  { name: "Socks (dozen)", units: 150 },
];

export const topClients = [
  { name: "Al-Noor Traders", balance: 182400 },
  { name: "Sherazi Garments", balance: 156000 },
  { name: "Khyber Sports", balance: 121300 },
  { name: "City Textiles", balance: 98700 },
  { name: "Rawal Wholesale", balance: 76200 },
];

export const recentActivity = [
  { type: "bill", client: "Al-Noor Traders", amount: 45200, date: "Aug 24" },
  { type: "payment", client: "Sherazi Garments", amount: 30000, date: "Aug 24" },
  { type: "bill", client: "City Textiles", amount: 18900, date: "Aug 23" },
  { type: "payment", client: "Khyber Sports", amount: 52000, date: "Aug 22" },
  { type: "bill", client: "Rawal Wholesale", amount: 27600, date: "Aug 22" },
  { type: "payment", client: "Al-Noor Traders", amount: 40000, date: "Aug 21" },
];

export const anomalies = [
  { label: "Large Bill", client: "City Textiles", detail: "PKR 210,000 — 3.4x avg", date: "Aug 23" },
  { label: "Overpayment", client: "Khyber Sports", detail: "Paid PKR 52,000 on 48,000 balance", date: "Aug 22" },
  { label: "Duplicate", client: "Al-Noor Traders", detail: "Same amount & date as bill #1042", date: "Aug 21" },
];

export function formatPKR(n) {
  return "PKR " + n.toLocaleString("en-PK");
}