"use client"

import { useEffect, useState } from "react"
import { BadgeIndianRupee, CalendarDays, Download, FileDown, Loader2, PackageSearch, RotateCcw, ShoppingCart } from "lucide-react"
import { toast } from "react-toastify"
import { inventoryService } from "@/api/services/inventory.service"
import type { Product, ReportDownload } from "@/api/services/inventory.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DownloadKind = "purchases" | "sales" | null

function dateDaysAgo(days: number) {
    const value = new Date()
    value.setDate(value.getDate() - days)
    return value.toISOString().slice(0, 10)
}

function today() {
    return new Date().toISOString().slice(0, 10)
}

function saveReport(report: ReportDownload) {
    const url = URL.createObjectURL(report.blob)
    const link = document.createElement("a")
    link.href = url
    link.download = report.filename
    link.click()
    URL.revokeObjectURL(url)
}

export default function ReportsPage() {
    const [from, setFrom] = useState(dateDaysAgo(30))
    const [to, setTo] = useState(today())
    const [product, setProduct] = useState("")
    const [supplier, setSupplier] = useState("")
    const [customer, setCustomer] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [suppliers, setSuppliers] = useState<Array<{ uuid: string; name: string }>>([])
    const [customers, setCustomers] = useState<Array<{ uuid: string; name: string }>>([])
    const [optionsLoading, setOptionsLoading] = useState(true)
    const [downloading, setDownloading] = useState<DownloadKind>(null)

    useEffect(() => {
        let active = true

        Promise.all([
            inventoryService.listProducts(),
            inventoryService.listSuppliers(),
            inventoryService.listCustomers(),
        ])
            .then(([productResponse, supplierResponse, customerResponse]) => {
                if (!active) return
                setProducts(productResponse)
                setSuppliers(supplierResponse)
                setCustomers(customerResponse)
            })
            .catch(() => {
                if (active) toast.error("Unable to load report filters.")
            })
            .finally(() => {
                if (active) setOptionsLoading(false)
            })

        return () => {
            active = false
        }
    }, [])

    const clearFilters = () => {
        setFrom(dateDaysAgo(30))
        setTo(today())
        setProduct("")
        setSupplier("")
        setCustomer("")
    }

    const downloadPurchases = async () => {
        if (from > to) {
            toast.error("The from date must be on or before the to date.")
            return
        }

        setDownloading("purchases")
        try {
            const report = await inventoryService.downloadPurchaseReport({
                from,
                to,
                product: product && product !== "all" ? product : undefined,
                supplier: supplier && supplier !== "all" ? supplier : undefined,
            })
            saveReport(report)
            toast.success("Purchase report downloaded.")
        } catch {
            toast.error("Unable to download the purchase report.")
        } finally {
            setDownloading(null)
        }
    }

    const downloadSales = async () => {
        if (from > to) {
            toast.error("The from date must be on or before the to date.")
            return
        }

        setDownloading("sales")
        try {
            const report = await inventoryService.downloadSalesReport({
                from,
                to,
                product: product && product !== "all" ? product : undefined,
                customer: customer && customer !== "all" ? customer : undefined,
            })
            saveReport(report)
            toast.success("Completed sales report downloaded.")
        } catch {
            toast.error("Unable to download the sales report.")
        } finally {
            setDownloading(null)
        }
    }

    return (
        <main className="min-h-full bg-muted/30">
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <PageHeader
                    eyebrow="Business intelligence"
                    title="Reports"
                    description="Export completed purchases and sales, or review a completed sale receipt."
                />

                <Card>
                    <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Report filters</CardTitle>
                            <CardDescription>
                                Filters apply to both report downloads.
                            </CardDescription>
                        </div>
                        <Button variant="ghost" className="h-7 gap-2" onClick={clearFilters}>
                            <RotateCcw className="size-4" />
                            Reset
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground" htmlFor="report-from">
                                    From date
                                </label>
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-blue-600" />
                                    <Input
                                        id="report-from"
                                        type="date"
                                        value={from}
                                        onChange={(event) => setFrom(event.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground" htmlFor="report-to">
                                    To date
                                </label>
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-blue-600" />
                                    <Input
                                        id="report-to"
                                        type="date"
                                        value={to}
                                        onChange={(event) => setTo(event.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Product</label>
                                <Select value={product} onValueChange={setProduct}>
                                    <SelectTrigger className="h-8 w-full bg-background" disabled={optionsLoading}>
                                        <SelectValue placeholder="All products" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All products</SelectItem>
                                        {products.map((item) => (
                                            <SelectItem key={item.uuid} value={item.uuid}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Supplier</label>
                                <Select value={supplier} onValueChange={setSupplier}>
                                    <SelectTrigger className="h-8 w-full bg-background" disabled={optionsLoading}>
                                        <SelectValue placeholder="All suppliers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All suppliers</SelectItem>
                                        {suppliers.map((item) => (
                                            <SelectItem key={item.uuid} value={item.uuid}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Customer</label>
                                <Select value={customer} onValueChange={setCustomer}>
                                    <SelectTrigger className="h-8 w-full bg-background" disabled={optionsLoading}>
                                        <SelectValue placeholder="All customers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All customers</SelectItem>
                                        {customers.map((item) => (
                                            <SelectItem key={item.uuid} value={item.uuid}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <section className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
                                    <ShoppingCart className="size-5" />
                                </div>
                                <PackageSearch className="size-5 text-muted-foreground" />
                            </div>
                            <CardTitle>Purchased items</CardTitle>
                            <CardDescription>
                                Completed purchase items with supplier, quantity, unit cost, and total.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                                <p className="text-xs text-muted-foreground">Excel workbook · completed purchases only</p>
                                <Button onClick={downloadPurchases} disabled={Boolean(downloading)}>
                                    {downloading === "purchases" ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <FileDown className="mr-2 size-4" />
                                    )}
                                    Download purchases
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700">
                                    <BadgeIndianRupee className="size-5" />
                                </div>
                                <FileDown className="size-5 text-muted-foreground" />
                            </div>
                            <CardTitle>Completed sales</CardTitle>
                            <CardDescription>
                                Completed sale items with customer, pricing, discount allocation, and totals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                                <p className="text-xs text-muted-foreground">Excel workbook · completed sales only</p>
                                <Button onClick={downloadSales} disabled={Boolean(downloading)}>
                                    {downloading === "sales" ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 size-4" />
                                    )}
                                    Download sales
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    )
}
