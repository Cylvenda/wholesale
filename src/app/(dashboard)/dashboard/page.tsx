"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { inventoryService, type DashboardStats } from "@/api/services/inventory.service"
import { KpiCards } from "@/components/dashboard/KpiCards"
import { SalesChart } from "@/components/dashboard/SalesChart"
import { DealsTable } from "@/components/dashboard/DealsTable"

interface ChartPoint {
    day: string
    date: string
    amount: number
    purchases: number
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedPeriod, setSelectedPeriod] = useState("7d")

    const loadStats = async (period: string) => {
        setLoading(true)
        try {
            const statsData = await inventoryService.getDashboardStats(period)

            const chartData: ChartPoint[] = statsData.chart_data.map((point) => ({
                day: point.day,
                date: point.date,
                amount: point.amount,
                purchases: point.purchases ?? 0,
            }))

            setStats({
                ...statsData,
                chart_data: chartData,
            })
        } catch {
            toast.error("Unable to load dashboard statistics.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const load = async () => { await loadStats(selectedPeriod) }
        load()
    }, [selectedPeriod])

    if (loading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">
                        Loading dashboard…
                    </p>
                </div>
            </div>
        )
    }

    if (!stats) {
        return null
    }

    const chartData = stats.chart_data.map((point) => ({
        day: point.day,
        date: point.date,
        amount: point.amount,
        purchases: point.purchases ?? 0,
    }))

    return (
        <div className="mx-auto flex w-full max-w-8xl flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Wholesale Dashboard
                </h1>
                <p className="text-sm font-medium text-muted-foreground">
                    Real-time B2B metrics, bulk consignment volume, and buyer accounts.
                </p>
            </div>

            <KpiCards stats={stats} />

            <SalesChart data={chartData} selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

            <DealsTable recentSales={stats.recent_sales} />
        </div>
    )
}
