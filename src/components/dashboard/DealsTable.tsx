"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"

interface RecentSale {
    uuid: string
    customer_name: string | null
    sale_date: string | null
    total: string
    payment_status: string
}

export interface DealsTableProps {
    recentSales: RecentSale[]
}

const statusConfig: Record<string, { variant: "default" | "outline" | "secondary" | "destructive"; className: string }> = {
    paid: {
        variant: "outline",
        className: "rounded-full border-0 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    },
    partial: {
        variant: "outline",
        className: "rounded-full border-0 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    },
    unpaid: {
        variant: "outline",
        className: "rounded-full border-0 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
    },
}

export function DealsTable({ recentSales }: DealsTableProps) {
    const [selectedRange, setSelectedRange] = React.useState("week")

    const renderStatusBadge = (status: string) => {
        const config = statusConfig[status.toLowerCase()] || {
            variant: "outline" as const,
            className: "rounded-full",
        }
        return (
            <Badge
                variant={config.variant}
                className={config.className}
            >
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        )
    }

    const totalAmount = recentSales.reduce(
        (sum, sale) => sum + Number(sale.total),
        0
    )

    return (
        <Card className="rounded-2xl border border-border/70 bg-card p-0 shadow-sm">
            <CardHeader className="flex flex-col gap-4 border-b border-border/50 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                        Recent Sales
                    </CardTitle>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Last {recentSales.length} completed sales &middot; Total: {formatCurrency(totalAmount)}
                    </p>
                </div>
                <select
                    value={selectedRange}
                    onChange={(e) => setSelectedRange(e.target.value)}
                    className="h-9 w-[130px] cursor-pointer rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground shadow-xs"
                >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                </select>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-border/60 bg-muted/40">
                                <th className="py-4 pl-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Customer
                                </th>
                                <th className="py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Date
                                </th>
                                <th className="py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Amount
                                </th>
                                <th className="py-4 pr-6 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Payment
                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSales.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-8 text-center text-sm text-muted-foreground"
                                    >
                                        No recent sales available.
                                    </td>
                                </tr>
                            ) : (
                                recentSales.map((sale) => (
                                    <tr
                                        key={sale.uuid}
                                        className="border-border/40 transition-colors hover:bg-muted/30"
                                    >
                                        <td className="py-4 pl-6">
                                            <span className="font-semibold text-foreground">
                                                {sale.customer_name || "—"}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm text-muted-foreground">
                                            {formatDate(sale.sale_date ?? undefined)}
                                        </td>
                                        <td className="py-4 text-right text-sm font-bold text-foreground">
                                            {formatCurrency(sale.total)}
                                        </td>
                                        <td className="py-4 pr-6 text-center">
                                            {renderStatusBadge(sale.payment_status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
