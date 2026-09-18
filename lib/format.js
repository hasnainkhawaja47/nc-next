export function formatPKR(n) {
  return "PKR " + Math.round(n || 0).toLocaleString("en-PK")
}