import api from "@/api/axios"
import { fetchAll } from "@/api/list"
import type {
    Category,
    CategoryPayload,
    Brand,
    BrandPayload,
    Supplier,
    SupplierPayload,
    Customer,
    CustomerPayload,
    Unit,
    UnitPayload,
    Product,
    ProductPayload,
    ProductUnit,
    ProductUnitPayload,
    ProductSummary,
    Stock,
    StockMovement,
    UnitAvailability,
    StockAdjustmentPayload,
    ExpenseCategory,
    ExpenseCategoryPayload,
    Expense,
    ExpensePayload,
    Purchase,
    PurchasePayload,
    Sale,
    SalePayload,
    Payment,
    PaymentPayload,
    DashboardStats,
    ReportFilters,
    ReceiptData,
    PurchaseReceiptData,
    ReportDownload,
    StockSummary,
    PaymentSummary,
    CustomerSummary,
    SupplierSummary,
} from "@/api/types"

export type {
    Category,
    CategoryPayload,
    Brand,
    BrandPayload,
    Supplier,
    SupplierPayload,
    Customer,
    CustomerPayload,
    Unit,
    UnitPayload,
    Product,
    ProductPayload,
    ProductUnit,
    ProductUnitPayload,
    ProductSummary,
    Stock,
    StockMovement,
    UnitAvailability,
    StockAdjustmentPayload,
    ExpenseCategory,
    ExpenseCategoryPayload,
    Expense,
    ExpensePayload,
    Purchase,
    PurchaseItem,
    PurchasePayload,
    PurchaseItemPayload,
    Sale,
    SaleItem,
    SalePayload,
    SaleItemPayload,
    Payment,
    PaymentPayload,
    DashboardStats,
    ReportFilters,
    ReceiptData,
    PurchaseReceiptData,
    PrintableReceiptData,
    ReportDownload,
    StockSummary,
    PaymentSummary,
    CustomerSummary,
    SupplierSummary,
} from "@/api/types"

export type ApiListResponse<T> = {
    count?: number
    next?: string | null
    previous?: string | null
    results?: T[]
}

function reportQuery(filters: ReportFilters) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
    })

    const query = params.toString()
    return query ? `?${query}` : ""
}

function downloadFilename(header: unknown, fallback: string) {
    const match = String(header || "").match(/filename="?([^"]+)"?/i)
    return match?.[1] || fallback
}

async function download(endpoint: string, fallbackFilename: string): Promise<ReportDownload> {
    const response = await api.get(endpoint, { responseType: "blob" })
    return {
        blob: response.data as Blob,
        filename: downloadFilename(
            response.headers["content-disposition"],
            fallbackFilename
        ),
    }
}

/* ------------------------------------------------------------------ */
/* Generic HTTP helpers                                                  */
/* ------------------------------------------------------------------ */

async function list<T>(endpoint: string): Promise<T[]> {
    return fetchAll<T>(endpoint)
}

async function get<T>(endpoint: string): Promise<T> {
    const response = await api.get<T>(endpoint)
    return response.data
}

async function create<T, TPayload>(
    endpoint: string,
    payload: TPayload
): Promise<T> {
    const response = await api.post<T>(endpoint, payload)
    return response.data
}

async function update<T, TPayload>(
    endpoint: string,
    payload: TPayload
): Promise<T> {
    const response = await api.patch<T>(endpoint, payload)
    return response.data
}

async function remove(endpoint: string): Promise<void> {
    await api.delete(endpoint)
}

/* ------------------------------------------------------------------ */
/* Public service object                                               */
/* ------------------------------------------------------------------ */

export const inventoryService = {
    /* --- Dashboard --- */
    getDashboardStats: (period?: string) => {
        const query = period ? `?period=${encodeURIComponent(period)}` : ""
        return get<DashboardStats>(`dashboard/${query}`)
    },

    /* --- Categories --- */
    listCategories: () => list<Category>("categories/"),
    createCategory: (payload: CategoryPayload) =>
        create<Category, CategoryPayload>("categories/", payload),
    updateCategory: (uuid: string, payload: CategoryPayload) =>
        update<Category, CategoryPayload>(`categories/${uuid}/`, payload),
    deleteCategory: (uuid: string) => remove(`categories/${uuid}/`),

    /* --- Products --- */
    listProducts: () => list<Product>("products/"),
    getProduct: (uuid: string) => get<Product>(`products/${uuid}/`),
    createProduct: (payload: ProductPayload) =>
        create<Product, ProductPayload>("products/", payload),
    updateProduct: (uuid: string, payload: ProductPayload) =>
        update<Product, ProductPayload>(`products/${uuid}/`, payload),
    deleteProduct: (uuid: string) => remove(`products/${uuid}/`),
    getProductsSummary: () => get<ProductSummary>("products/summary/"),

    /* --- Product Units --- */
    listProductUnits: (productUuid: string) =>
        list<ProductUnit>(`products/${productUuid}/units/`),
    getProductUnit: (productUuid: string, uuid: string) =>
        get<ProductUnit>(`products/${productUuid}/units/${uuid}/`),
    createProductUnit: (productUuid: string, payload: ProductUnitPayload) =>
        create<ProductUnit, ProductUnitPayload>(`products/${productUuid}/units/`, payload),
    updateProductUnit: (productUuid: string, uuid: string, payload: ProductUnitPayload) =>
        update<ProductUnit, ProductUnitPayload>(`products/${productUuid}/units/${uuid}/`, payload),
    deleteProductUnit: (productUuid: string, uuid: string) =>
        remove(`products/${productUuid}/units/${uuid}/`),

    /* --- Brands --- */
    listBrands: () => list<Brand>("brands/"),
    createBrand: (payload: BrandPayload) =>
        create<Brand, BrandPayload>("brands/", payload),
    updateBrand: (uuid: string, payload: BrandPayload) =>
        update<Brand, BrandPayload>(`brands/${uuid}/`, payload),
    deleteBrand: (uuid: string) => remove(`brands/${uuid}/`),

    /* --- Units --- */
    listUnits: () => list<Unit>("units/"),
    getUnit: (uuid: string) => get<Unit>(`units/${uuid}/`),
    createUnit: (payload: UnitPayload) =>
        create<Unit, UnitPayload>("units/", payload),
    updateUnit: (uuid: string, payload: UnitPayload) =>
        update<Unit, UnitPayload>(`units/${uuid}/`, payload),
    deleteUnit: (uuid: string) => remove(`units/${uuid}/`),

    /* --- Suppliers --- */
    listSuppliers: () => list<Supplier>("suppliers/"),
    getSupplier: (uuid: string) => get<Supplier>(`suppliers/${uuid}/`),
    createSupplier: (payload: SupplierPayload) =>
        create<Supplier, SupplierPayload>("suppliers/", payload),
    updateSupplier: (uuid: string, payload: SupplierPayload) =>
        update<Supplier, SupplierPayload>(`suppliers/${uuid}/`, payload),
    deleteSupplier: (uuid: string) => remove(`suppliers/${uuid}/`),
    getSuppliersSummary: () => get<SupplierSummary>("suppliers/summary/"),

    /* --- Customers --- */
    listCustomers: () => list<Customer>("customers/"),
    getCustomer: (uuid: string) => get<Customer>(`customers/${uuid}/`),
    createCustomer: (payload: CustomerPayload) =>
        create<Customer, CustomerPayload>("customers/", payload),
    updateCustomer: (uuid: string, payload: CustomerPayload) =>
        update<Customer, CustomerPayload>(`customers/${uuid}/`, payload),
    deleteCustomer: (uuid: string) => remove(`customers/${uuid}/`),
    getCustomersSummary: () => get<CustomerSummary>("customers/summary/"),

    /* --- Stock --- */
    listStock: () => list<Stock>("stocks/"),
    getStockSummary: () => get<StockSummary>("stocks/summary/"),
    /** Availability expressed in the selected selling unit (backend is the source of truth). */
    getStockAvailability: (productUuid: string, productUnitUuid?: string) =>
        get<UnitAvailability[]>(
            `stocks/availability/?product=${encodeURIComponent(productUuid)}${
                productUnitUuid ? `&unit=${encodeURIComponent(productUnitUuid)}` : ""
            }`
        ),
    listStockMovements: () => list<StockMovement>("stock-movements/"),
    createStockMovement: (payload: StockAdjustmentPayload) =>
        create<StockMovement, StockAdjustmentPayload>(
            "stock-movements/",
            payload
        ),

    /* --- Purchases --- */
    listPurchases: () => list<Purchase>("purchases/"),
    getPurchase: (uuid: string) => get<Purchase>(`purchases/${uuid}/`),
    createPurchase: (payload: PurchasePayload) =>
        create<Purchase, PurchasePayload>("purchases/", payload),
    updatePurchase: (uuid: string, payload: PurchasePayload) =>
        update<Purchase, PurchasePayload>(`purchases/${uuid}/`, payload),
    cancelPurchase: (uuid: string) =>
        create<void, undefined>(`purchases/${uuid}/cancel/`, undefined),

    /* --- Sales --- */
    listSales: () => list<Sale>("sales/"),
    getSale: (uuid: string) => get<Sale>(`sales/${uuid}/`),
    createSale: (payload: SalePayload) =>
        create<Sale, SalePayload>("sales/", payload),
    updateSale: (uuid: string, payload: SalePayload) =>
        update<Sale, SalePayload>(`sales/${uuid}/`, payload),
    cancelSale: (uuid: string) =>
        create<void, undefined>(`sales/${uuid}/cancel/`, undefined),

    /* --- Payments --- */
    listPayments: () => list<Payment>("payments/"),
    getPayment: (uuid: string) => get<Payment>(`payments/${uuid}/`),
    createPayment: (payload: PaymentPayload) =>
        create<Payment, PaymentPayload>("payments/", payload),
    updatePayment: (uuid: string, payload: PaymentPayload) =>
        update<Payment, PaymentPayload>(`payments/${uuid}/`, payload),
    deletePayment: (uuid: string) => remove(`payments/${uuid}/`),
    getPaymentsSummary: () => get<PaymentSummary>("payments/summary/"),

    /* --- Expenses --- */
    listExpenses: () =>
        list<Expense>("expenses/"),
    getExpense: (uuid: string) => get<Expense>(`expenses/${uuid}/`),
    createExpense: (payload: ExpensePayload) =>
        create<Expense, ExpensePayload>("expenses/", payload),
    updateExpense: (uuid: string, payload: ExpensePayload) =>
        update<Expense, ExpensePayload>(`expenses/${uuid}/`, payload),
    deleteExpense: (uuid: string) => remove(`expenses/${uuid}/`),

    listExpenseCategories: () =>
        list<ExpenseCategory>("expense-categories/"),
    createExpenseCategory: (payload: ExpenseCategoryPayload) =>
        create<ExpenseCategory, ExpenseCategoryPayload>("expense-categories/", payload),

    /* --- Reports and receipts --- */
    downloadPurchaseReport: (filters: ReportFilters = {}) =>
        download(`reports/purchases/export/${reportQuery(filters)}`, "purchased-items.xlsx"),

    downloadSalesReport: (filters: ReportFilters = {}) =>
        download(`reports/sales/export/${reportQuery(filters)}`, "completed-sales.xlsx"),

    getReceipt: async (uuid: string): Promise<ReceiptData> => {
        const response = await api.get<{ success: boolean; data: ReceiptData }>(
            `sales/${uuid}/receipt/?format=json`
        )
        return response.data.data
    },

    downloadReceipt: (uuid: string) =>
        download(`sales/${uuid}/receipt/`, `receipt-${uuid}.pdf`),

    getPurchaseReceipt: async (uuid: string): Promise<PurchaseReceiptData> => {
        const response = await api.get<{ success: boolean; data: PurchaseReceiptData }>(
            `purchases/${uuid}/receipt/?format=json`
        )
        return response.data.data
    },

    downloadPurchaseReceipt: (uuid: string) =>
        download(`purchases/${uuid}/receipt/`, `purchase-receipt-${uuid}.pdf`),
}