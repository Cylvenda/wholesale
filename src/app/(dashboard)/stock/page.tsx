"use client"

import { useCallback, useEffect, useState } from "react"
import { Warehouse } from "lucide-react"
import {
    inventoryService,
    type Stock,
    type StockSummary,
} from "@/api/services/inventory.service"
import { StockAdjustmentForm } from "@/components/stock/stock-adjustment-form"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ResourcePage } from "@/components/resource-page"
import type { InventoryRow, Status } from "@/lib/inventory-data"
import { formatCurrency, formatDate } from "@/lib/format"

function toStockStatus(quantity: number): Status {
    if (quantity === 0) return "out-of-stock"
    if (quantity < 10) return "low-stock"
    return "in-stock"
}

function toRows(stocks: Stock[]): InventoryRow[] {
    return stocks.map((stock) => {
        const quantity = Number(stock.quantity)
        const stockValue = quantity * Number(stock.buying_price || 0)
        return {
            id: stock.uuid,
            primary: stock.product_name,
            values: [
                String(quantity),
                formatCurrency(stock.buying_price),
                formatCurrency(stockValue),
                formatDate(stock.updated_at),
            ],
            status: toStockStatus(quantity),
        }
    })
}

function toSummary(summary: StockSummary): { label: string; value: string }[] {
    return [
        {
            label: "Stocked products",
            value: String(summary.stocked_products),
        },
        {
            label: "Total quantity",
            value: String(summary.total_quantity),
        },
        {
            label: "Low stock",
            value: String(summary.low_stock_items),
        },
        {
            label: "Stock value",
            value: formatCurrency(summary.stock_value),
        },
    ]
}

export default function StockPage() {
    const [stocks, setStocks] = useState<Stock[]>([])
    const [summary, setSummary] = useState<
        { label: string; value: string }[] | undefined
    >()
    const [adjustmentOpen, setAdjustmentOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const loadRows = useCallback(async () => {
        const rows = await inventoryService.listStock()
        setStocks(rows)
        return toRows(rows)
    }, [])

    const loadSummary = useCallback(async () => {
        try {
            const data = await inventoryService.getStockSummary()
            setSummary(toSummary(data))
        } catch {
            // Summary may not be available
        }
    }, [])

    useEffect(() => {
        const load = async () => { await loadSummary() }
        load()
    }, [loadSummary])

    return (
        <>
            <ResourcePage
                title="Stock"
                description="Track available quantities and movement across your warehouse."
                action="Record movement"
                columns={["Product", "Current", "Unit cost", "Stock value", "Last movement", "Status"]}
                rows={toRows(stocks)}
                summary={summary}
                loadRows={loadRows}
                refreshKey={refreshKey}
                viewIcon={<Warehouse className="size-5" />}
                onAction={() => {
                    setAdjustmentOpen(true)
                }}
            />

            <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
                <DialogContent className="max-w-2xl p-6">
                    <DialogHeader>
                        <DialogTitle>Record stock movement</DialogTitle>
                        <DialogDescription>
                            Adjust stock levels with a surplus or loss entry.
                        </DialogDescription>
                    </DialogHeader>
                    <StockAdjustmentForm
                        onCancel={() => setAdjustmentOpen(false)}
                        onSuccess={async () => {
                            await loadRows()
                            setAdjustmentOpen(false)
                            setRefreshKey((k) => k + 1)
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
