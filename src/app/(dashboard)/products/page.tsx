"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { productService, type Product } from "@/api/services/product.service"
import { ProductForm } from "@/components/products/product-form"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { ErrorState, EmptyState, TableSkeleton } from "@/components/shared/table-states"
import { StatusBadge } from "@/components/shared/status-badge"
import { ViewDialog } from "@/components/shared/view-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [formOpen, setFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const load = useCallback(() => {
        setLoading(true)
        setFailed(false)
        productService
            .list()
            .then(setProducts)
            .catch(() => setFailed(true))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        let active = true
        productService
            .list()
            .then((result) => {
                if (active) setProducts(result)
            })
            .catch(() => {
                if (active) setFailed(true)
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => {
            active = false
        }
    }, [])

    const openCreate = () => {
        setEditingProduct(null)
        setFormOpen(true)
    }

    const openEdit = (product: Product) => {
        setEditingProduct(product)
        setFormOpen(true)
    }

    const openDelete = (product: Product) => {
        setDeletingProduct(product)
    }

    const openView = (product: Product) => {
        setViewingProduct(product)
    }

    const handleDelete = async () => {
        if (!deletingProduct) return
        setSubmitting(true)
        try {
            await productService.delete(deletingProduct.uuid)
            toast.success("Product deleted successfully.")
            setDeletingProduct(null)
            load()
        } catch {
            toast.error("Unable to delete this product. It may be in use.")
        } finally {
            setSubmitting(false)
        }
    }

    const filtered = products.filter((product) =>
        `${product.name} ${product.brand_name} ${product.category_name} ${product.unit}`.toLowerCase().includes(
            search.toLowerCase()
        )
    )
    const totalRows = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
    const visiblePage = Math.min(currentPage, totalPages)
    const startIndex = (visiblePage - 1) * pageSize
    const paginatedProducts = filtered.slice(startIndex, startIndex + pageSize)

    return (
        <main className="min-h-full bg-muted/30">
            <div className="mx-auto w-full max-w-8xl space-y-6 p-4 sm:p-6">
                <PageHeader
                    title="Products"
                    description="Manage beverage products, pricing and active catalogue items."
                    action={
                        <Button onClick={openCreate}>
                            <Plus className="size-4" />
                            Add product
                        </Button>
                    }
                />

                <Card>
                    <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Product catalogue</CardTitle>
                            <CardDescription>
                                {loading
                                    ? "Loading products…"
                                    : `${products.length} products in your workspace.`}
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-600" />
                            <Input
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value)
                                    setCurrentPage(1)
                                }}
                                placeholder="Search products"
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="px-0 pb-0">
                        {failed ? (
                            <ErrorState onRetry={load} />
                        ) : loading ? (
                            <TableSkeleton />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            #
                                        </TableHead>
                                        <TableHead className="pl-2">
                                            Product
                                        </TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Purchase price</TableHead>
                                        <TableHead>Selling price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="pr-6">
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length ? (
                                        paginatedProducts.map((product, index) => (
                                            <TableRow key={product.uuid}>
                                                <TableCell className="text-center text-sm text-muted-foreground">
                                                    {startIndex + index + 1}
                                                </TableCell>
                                                <TableCell className="pl-2 font-medium">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {product.category_name || "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {product.brand_name || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {product.unit_name}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        product.buying_price
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(
                                                        product.selling_price
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        status={
                                                            product.is_active
                                                                ? "active"
                                                                : "inactive"
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="pr-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label={`Actions for ${product.name}`}
                                                            >
                                                                <MoreHorizontal className="size-4 text-blue-600" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openView(product)
                                                                }
                                                            >
                                                                <Eye className="size-4 text-blue-600" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openEdit(product)
                                                                }
                                                            >
                                                                <Pencil className="size-4 text-blue-600" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => openDelete(product)}
                                                            >
                                                                <Trash2 className="size-4 text-blue-600" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="p-0">
                                                <EmptyState
                                                    title="No products found"
                                                    description={
                                                        search
                                                            ? "Try adjusting your search terms."
                                                            : "Add your first beverage product to get started."
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>

                    {!loading && !failed && totalRows > 0 && (
                        <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="whitespace-nowrap">
                                    Showing {startIndex + 1}-
                                    {Math.min(startIndex + pageSize, totalRows)} of {totalRows}
                                </span>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value))
                                        setCurrentPage(1)
                                    }}
                                >
                                    <SelectTrigger className="h-8 border-border bg-background text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 / page</SelectItem>
                                        <SelectItem value="10">10 / page</SelectItem>
                                        <SelectItem value="25">25 / page</SelectItem>
                                        <SelectItem value="50">50 / page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={visiblePage === 1}
                                    className="h-9 w-9"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <span className="min-w-24 text-center text-sm font-medium text-muted-foreground">
                                    Page {visiblePage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={visiblePage === totalPages}
                                    className="h-9 w-9"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Create / Edit Dialog */}
                <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    <DialogContent className="sm:max-w-2xl p-6">
                        <DialogHeader>
                            <DialogTitle>
                                {editingProduct
                                    ? "Edit product"
                                    : "Add product"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingProduct
                                    ? "Update product details, pricing and availability."
                                    : "Enter the product details, assign a brand and unit, then set pricing."}
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm
                            mode={editingProduct ? "edit" : "create"}
                            product={editingProduct}
                            onCancel={() => setFormOpen(false)}
                            onSubmit={async () => {
                                load()
                                setFormOpen(false)
                            }}
                        />
                    </DialogContent>
                </Dialog>

                {/* View Dialog */}
                {viewingProduct && (
                    <ViewDialog
                        open={Boolean(viewingProduct)}
                        onOpenChange={() => setViewingProduct(null)}
                        title={viewingProduct.name}
                        description={viewingProduct.brand_name || undefined}
                        status={viewingProduct.is_active ? "active" : "inactive"}
                        icon={<Package className="size-5" />}
                        fields={[
                            { label: "Brand", value: viewingProduct.brand_name || "—" },
                            { label: "Unit", value: viewingProduct.unit_name || "—" },
                            { label: "Buying price", value: formatCurrency(viewingProduct.buying_price) },
                            { label: "Selling price", value: formatCurrency(viewingProduct.selling_price) },
                        ]}
                        sections={[
                            {
                                label: "Description",
                                content: (
                                    <p className="text-sm text-foreground">
                                        {viewingProduct.description || "No description provided."}
                                    </p>
                                ),
                            },
                        ]}
                        actions={
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setViewingProduct(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => openEdit(viewingProduct)}
                                >
                                    Edit product
                                </Button>
                            </>
                        }
                    />
                )}

                {/* Delete Confirmation */}
                <AlertDialog
                    open={Boolean(deletingProduct)}
                    onOpenChange={(open) => !open && setDeletingProduct(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete product?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete{" "}
                                {deletingProduct?.name}. This action cannot be
                                undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={submitting}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Deleting…"
                                    : "Delete product"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </main>
    )
}
