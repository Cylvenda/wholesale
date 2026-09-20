export interface KpiMetric {
    id: string
    title: string
    value: string
    change: string
    trend: "up" | "down" | "neutral"
    subtext: string
    iconType: "package" | "warehouse" | "revenue" | "purchase-order" | "alert" | "products"
    colorClass: {
        bg: string
        text: string
        darkBg: string
        darkText: string
    }
}

export interface ChartDataPoint {
    day: string
    date: string
    amount: number
    purchases?: number
}
