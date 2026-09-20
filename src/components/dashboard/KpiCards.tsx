"use client"

import * as React from "react"
import {
    Package,
    Warehouse,
    ShoppingCart,
    Receipt,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { DashboardStats } from "@/api/services/inventory.service"
import type { KpiMetric } from "./types"

export interface KpiCardsProps {
    stats: DashboardStats
    totalPurchases?: string
}

export function KpiCards({ stats, totalPurchases = "0" }: KpiCardsProps) {
    const metrics: KpiMetric[] = React.useMemo(() => {
        return [
            {
                id: "total-products",
                title: "Total Products",
                value: String(stats.total_products),
                change: "",
                trend: "neutral",
                subtext: "Active catalog",
                iconType: "products",
                colorClass: {
                    bg: "bg-blue-100",
                    text: "text-blue-600",
                    darkBg: "dark:bg-blue-950/60",
                    darkText: "dark:text-blue-400",
                },
            },
            {
                id: "stock-units",
                title: "Stock on Hand",
                value: `${stats.stock_units.toLocaleString()} units`,
                change: "",
                trend: "neutral",
                subtext: `${stats.low_stock_items} low, ${stats.out_of_stock_items} out of stock`,
                iconType: "warehouse",
                colorClass: {
                    bg: "bg-emerald-100",
                    text: "text-emerald-600",
                    darkBg: "dark:bg-emerald-950/60",
                    darkText: "dark:text-emerald-400",
                },
            },
            {
                id: "sales-value",
                title: "Total Sales",
                value: formatCurrency(stats.sales_value),
                change: "",
                trend: "neutral",
                subtext: "All completed sales",
                iconType: "revenue",
                colorClass: {
                    bg: "bg-purple-100",
                    text: "text-purple-600",
                    darkBg: "dark:bg-purple-950/60",
                    darkText: "dark:text-purple-400",
                },
            },
            {
                id: "total-purchases",
                title: "Total Purchases",
                value: formatCurrency(totalPurchases),
                change: "",
                trend: "neutral",
                subtext: "All purchases",
                iconType: "purchase-order",
                colorClass: {
                    bg: "bg-amber-100",
                    text: "text-amber-600",
                    darkBg: "dark:bg-amber-950/60",
                    darkText: "dark:text-amber-400",
                },
            },
        ]
    }, [stats, totalPurchases])

    const renderIcon = (type: KpiMetric["iconType"]) => {
        switch (type) {
            case "products":
                return <Package className="size-6 stroke-[2.2]" />
            case "warehouse":
                return <Warehouse className="size-6 stroke-[2.2]" />
            case "revenue":
                return <ShoppingCart className="size-6 stroke-[2.2]" />
            case "purchase-order":
                return <Receipt className="size-6 stroke-[2.2]" />
            case "alert":
                return <Package className="size-6 stroke-[2.2]" />
            default:
                return <Package className="size-6 stroke-[2.2]" />
        }
    }

    return (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
                return (
                    <Card
                        key={metric.id}
                        className="rounded-2xl border border-border/70 bg-card p-0 shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {metric.title}
                                    </p>
                                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                                        {metric.value}
                                    </h3>
                                </div>
                                <div
                                    className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${metric.colorClass.bg} ${metric.colorClass.text} ${metric.colorClass.darkBg} ${metric.colorClass.darkText}`}
                                >
                                    {renderIcon(metric.iconType)}
                                </div>
                            </div>
                            <div className="mt-5 flex items-center text-xs">
                                <span className="font-normal text-muted-foreground">
                                    {metric.subtext}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </section>
    )
}
