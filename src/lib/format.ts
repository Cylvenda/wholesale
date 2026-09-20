export function formatCurrency(value: number | string) {
  return `TZS ${Number(value || 0).toLocaleString("en-TZ", { maximumFractionDigits: 0 })}`
}

export function formatDate(value?: string) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(new Date(value))
}
