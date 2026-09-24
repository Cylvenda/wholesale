import api from "@/api/axios"

export type ApiListResponse<T> = {
    count?: number
    next?: string | null
    previous?: string | null
    results?: T[]
}

export type Category = {
    uuid: string
    name: string
    description: string
    created_at: string
    created_by: string | null
}

export type CategoryPayload = Pick<Category, "name" | "description">

export type Brand = {
    uuid: string
    name: string
    category: string
    category_name: string
    created_at: string
    created_by: string | null
}

export type BrandPayload = {
    name: string
    category: string
}

export type Supplier = {
    uuid: string
    name: string
    phone: string
    email: string
    address: string
    is_active: boolean
    created_at: string
}

export type SupplierPayload = Omit<Supplier, "uuid" | "created_at" | "created_by">

export type Customer = {
    uuid: string
    name: string
    phone: string | null
    email: string
    business_location: string | null
    is_active: boolean
    created_at: string
}

export type CustomerPayload = Omit<Customer, "uuid" | "created_at">

export type Unit = {
    uuid: string
    name: string
    abbreviation: string | null
    quantity: number
    created_at: string
    created_by: string | null
}

export type UnitPayload = {
    name: string
    abbreviation?: string | null
    quantity?: number
}

export type Product = {
    uuid: string
    brand: string
    brand_name: string
    name: string
    description: string
    unit: string
    unit_name: string
    buying_price: string
    selling_price: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export type ProductPayload = {
    brand: string
    unit: string
    name: string
    description: string
    buying_price: string | number
    selling_price: string | number
    is_active?: boolean
}

export type ProductSummary = {
    total_products: number
    active_products: number
    total_stock_value: number
}

export type Stock = {
    uuid: string
    product: string
    product_name: string
    quantity: number
    buying_price: string
    selling_price: string
    updated_at: string
}

export type StockMovement = {
    uuid: string
    movement_type: string
    quantity: number
    reference: string
    notes: string
    product_name: string
    created_at: string
}

export type StockAdjustmentPayload = {
    product: string
    movement_type: "Stocktake Surplus" | "Stocktake Loss"
    quantity: number
    reference?: string
    notes?: string
}

export type ExpenseCategory = {
    uuid: string
    name: string
    created_at: string
}

export type ExpenseCategoryPayload = Pick<ExpenseCategory, "name">

export type Expense = {
    uuid: string
    category: string
    category_name: string
    amount: string
    description: string
    expense_date: string
    created_at: string
}

export type ExpensePayload = {
    category: string
    amount: string
    description: string
    expense_date: string
}

export type PurchaseItem = {
    uuid: string
    product: string
    product_name: string
    quantity: number
    unit_cost: string
    subtotal: string
}

export type PurchaseItemPayload = {
    product: string
    quantity: number
    unit_cost: string
}

export type Purchase = {
    uuid: string
    supplier: string
    supplier_name: string
    invoice_number: string
    status: "draft" | "completed" | "cancelled"
    total: string
    purchase_date: string
    notes: string
    items: PurchaseItem[]
    created_at: string
}

export type PurchasePayload = {
    supplier: string
    invoice_number?: string
    purchase_date: string
    notes?: string
    items: PurchaseItemPayload[]
}

export type SaleItem = {
    uuid: string
    product: string
    product_name: string
    quantity: number
    unit_price: string
    subtotal: string
}

export type SaleItemPayload = {
    product: string
    quantity: number
    unit_price: string
}

export type Sale = {
    uuid: string
    customer: string
    customer_name: string
    status: "draft" | "completed" | "cancelled"
    payment_status: "unpaid" | "partial" | "paid"
    sale_date: string
    subtotal: string
    discount: string
    total: string
    notes: string
    items: SaleItem[]
    created_at: string
    paid_amount: string
    outstanding_balance: string
}

export type SalePayload = {
    customer: string
    sale_date: string
    discount?: string
    notes?: string
    items: SaleItemPayload[]
}

export type Payment = {
    uuid: string
    customer: string
    customer_name: string
    sale: string | null
    amount: string
    method: string
    reference: string
    payment_date: string
    notes: string
    created_at: string
}

export type PaymentPayload = {
    sale: string
    amount: string
    method: string
    reference?: string
    payment_date: string
    notes?: string
}

export type DashboardStats = {
    total_products: number
    stock_units: number
    sales_value: number
    purchases_value: number
    draft_purchases: number
    low_stock_items: number
    out_of_stock_items: number
    recent_sales: {
        uuid: string
        customer_name: string | null
        sale_date: string | null
        total: string
        payment_status: string
    }[]
    chart_data: {
        day: string
        date: string
        amount: number
        purchases?: number
    }[]
}

export type ReportFilters = {
    from?: string
    to?: string
    product?: string
    supplier?: string
    customer?: string
}

export type ReceiptBusiness = {
    name: string
    address: string
    phone: string
    email: string
    tax_number: string
    receipt_footer: string
}

export type ReceiptSale = {
    uuid: string
    receipt_number: string
    sale_date: string
    cashier: string
    customer: string
    payment_status: "unpaid" | "partial" | "paid"
}

export type ReceiptItem = {
    uuid: string
    product_name: string
    quantity: number
    unit_price: string
    discount: string
    line_total: string
}

export type ReceiptTotals = {
    subtotal: string
    discount: string
    grand_total: string
    amount_paid: string
    outstanding_balance: string
}

export type ReceiptPayment = {
    uuid: string
    amount: string
    method: string
    reference: string
    payment_date: string
}

export type ReceiptData = {
    business: ReceiptBusiness
    sale: ReceiptSale
    items: ReceiptItem[]
    totals: ReceiptTotals
    payments: ReceiptPayment[]
    payment_methods: string[]
    currency: string
}

export type ReportDownload = {
    blob: Blob
    filename: string
}

export type StockSummary = {
    stocked_products: number
    total_quantity: number
    low_stock_items: number
    out_of_stock_items: number
    stock_value: number
}

export type PaymentSummary = {
    today_payments: number
    total_paid: number
    outstanding: number
    pending: number
}

export type CustomerSummary = {
    total_customers: number
    active_customers: number
    total_sales: number
    outstanding: number
}

export type SupplierSummary = {
    total_suppliers: number
    active_suppliers: number
    total_purchases: number
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
    const response = await api.get<ApiListResponse<T> | T[]>(endpoint)
    return Array.isArray(response.data)
        ? response.data
        : response.data.results ?? []
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
}
