"use client"

import * as React from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { ChartDataPoint } from "./types"

interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{
        value: number
        dataKey: string
        payload: ChartDataPoint
    }>
    label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
    if (active && payload && payload.length > 0) {
        const data = payload[0].payload
        return (
            <div className="rounded-xl border border-border/80 bg-popover/95 p-4 shadow-xl backdrop-blur-md">
                <p className="text-xs font-medium text-muted-foreground">
                    {data.day} &middot; {data.date}
                </p>
                {payload.map((entry) => (
                    <div
                        key={entry.dataKey}
                        className="mt-1 flex items-center justify-between gap-4"
                    >
                        <span
                            className="text-xs font-medium capitalize"
                            style={{
                                color: entry.dataKey === "sales" ? "#3b82f6" : "#f59e0b",
                            }}
                        >
                            {entry.dataKey === "sales" ? "Sales" : "Purchases"}:
                        </span>
                        <span className="text-sm font-bold text-foreground">
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

const emptySubscribe = () => () => {}

interface SalesChartProps {
    data: ChartDataPoint[]
}

export function SalesChart({ data }: SalesChartProps) {
    const [selectedPeriod, setSelectedPeriod] = React.useState("7d")
    const isMounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false)

    const chartData = React.useMemo(() => {
        if (!data || data.length === 0) return []
        return data.map((point) => ({
            day: point.day,
            date: point.date,
            sales: point.amount || 0,
            purchases: point.purchases || 0,
        }))
    }, [data])

    const totalSales = React.useMemo(() => {
        return chartData.reduce((sum, point) => sum + point.sales, 0)
    }, [chartData])

    const totalPurchases = React.useMemo(() => {
        return chartData.reduce((sum, point) => sum + point.purchases, 0)
    }, [chartData])

    const yAxisTickFormatter = (value: number) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(0)}M`
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k`
        }
        return String(value)
    }

    return (
        <Card className="rounded-2xl border border-border/70 bg-card p-0 shadow-sm">
            <CardHeader className="flex flex-col gap-4 border-b border-border/50 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                        Purchases &amp; Sales Overview
                    </CardTitle>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                        <span className="text-blue-600">
                            Sales: {formatCurrency(totalSales)}
                        </span>
                        {"  |  "}
                        <span className="text-amber-600">
                            Purchases: {formatCurrency(totalPurchases)}
                        </span>
                    </p>
                </div>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="h-9 w-[130px] cursor-pointer rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground shadow-xs"
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="all">All time</option>
                </select>
            </CardHeader>

            <CardContent className="p-6 pt-8">
                <div className="h-[340px] w-full">
                    {isMounted && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                                barSize={28}
                            >
                                <CartesianGrid
                                    strokeDasharray="4 4"
                                    vertical={false}
                                    stroke="hsl(var(--border))"
                                    opacity={0.6}
                                />

                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={12}
                                    tick={{
                                        fill: "hsl(var(--muted-foreground))",
                                        fontSize: 12,
                                        fontWeight: 500,
                                    }}
                                />

                                <YAxis
                                    domain={[0, "dataMax"]}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={12}
                                    tickFormatter={yAxisTickFormatter}
                                    tick={{
                                        fill: "hsl(var(--muted-foreground))",
                                        fontSize: 12,
                                        fontWeight: 500,
                                    }}
                                />

                                <Tooltip content={<CustomTooltip />} />

                                <Bar
                                    dataKey="sales"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    activeBar={{
                                        fill: "#2563eb",
                                        stroke: "#ffffff",
                                        strokeWidth: 2,
                                    }}
                                />

                                <Bar
                                    dataKey="purchases"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                    activeBar={{
                                        fill: "#d97706",
                                        stroke: "#ffffff",
                                        strokeWidth: 2,
                                    }}
                                />

                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    height={36}
                                    wrapperStyle={{
                                        fontSize: "11px",
                                        paddingLeft: "16px",
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <p className="text-sm text-muted-foreground">
                                No transactional data available for the selected period.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
