/**
 * Money keeps its cents. Whole amounts stay clean, but a value such as
 * 1100.50 must not be displayed as a different amount than the one recorded.
 */
export function formatCurrency(value: number | string) {
  const amount = Number(value || 0)
  const hasCents = !Number.isInteger(amount)
  return `TZS ${amount.toLocaleString("en-TZ", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })}`
}

export function formatDate(value?: string) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(new Date(value))
}
