export type ApiResponse<T> = {
    data: T
    status: number
}

export type ListResponse<T> = {
    count: string
    next: string | null
    previous: string | null
    results: T[]
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

export type SupplierPayload = {
    name: string
    phone: string
    email: string
    address?: string
    is_active?: boolean
}

export type Customer = {
    uuid: string
    name: string
    phone: string | null
    email: string
    business_location: string | null
    is_active: boolean
    created_at: string
}

export type CustomerPayload = {
    name: string
    phone: string
    email: string
    business_location?: string
    is_active?: boolean
}

export type Unit = {
    uuid: string
    name: string
    abbreviation: string | null
    is_active: boolean
    created_at: string
    created_by: string | null
}

export type UnitPayload = {
    name: string
    abbreviation?: string | null
    is_active?: boolean
}

export type ProductUnit = {
    uuid: string
    unit: string
    unit_name: string
    unit_abbreviation: string | null
    /** How many base units one of this unit contains. Always a whole number. */
    conversion_factor: number
    buying_price: string
    selling_price: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export type ProductUnitPayload = {
    unit: string
    conversion_factor: string | number
    buying_price: string | number
    selling_price: string | number
    is_active?: boolean
}

export type Product = {
    uuid: string
    brand: string
    brand_name: string
    category_name: string
    name: string
    description: string
    base_unit: string
    base_unit_name: string
    base_unit_abbreviation: string | null
    buying_price: string
    selling_price: string
    is_active: boolean
    created_at: string
    updated_at: string
    product_units: ProductUnit[]
}

export type ProductPayload = {
    brand: string
    base_unit: string
    name: string
    description: string
    buying_price: string | number
    selling_price: string | number
    is_active?: boolean
    product_units?: ProductUnitPayload[]
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
    /** Whole base units on hand. */
    quantity: number
    /** e.g. "9 CS + 23 CHP" */
    formatted_quantity: string
    /** e.g. "239 CHP" */
    base_display: string
    base_unit_name: string
    base_unit_abbreviation: string | null
    buying_price: string
    selling_price: string
    updated_at: string
}

/** Stock expressed in one configured selling unit, as returned by the backend. */
export type UnitAvailability = {
    base_stock: number
    base_unit: string
    base_unit_abbreviation: string | null
    selected_unit: string | null
    conversion_factor: number | null
    /** Whole units of the selected unit that may be sold. */
    available_quantity: number
    remainder_base_quantity: number
    /** e.g. "9 CS + 23 CHP" */
    available_display: string
    /** e.g. "239 CHP" */
    base_display: string
}

export type StockMovement = {
    uuid: string
    movement_type: string
    quantity: number
    base_quantity: number | null
    base_unit_name: string | null
    transaction_quantity: number | null
    transaction_unit_name: string | null
    conversion_factor_used: number | null
    reference: string
    notes: string
    product_name: string
    created_at: string
}

export type StockAdjustmentPayload = {
    product: string
    /** Configured ProductUnit being counted; defaults to the base unit server-side. */
    product_unit?: string
    movement_type: "Stocktake Surplus" | "Stocktake Loss"
    quantity: string | number
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
    product_unit: string
    product_unit_name: string
    product_unit_abbreviation: string | null
    quantity: number
    conversion_factor: number
    base_quantity: number
    unit_cost: string
    subtotal: string
}

export type PurchaseItemPayload = {
    product: string
    product_unit: string
    quantity: string | number
    unit_cost: string
}

export type Purchase = {
    uuid: string
    reference_code: string
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
    product_unit: string
    product_unit_name: string
    product_unit_abbreviation: string | null
    /** Historical label only; the sale form no longer chooses one. */
    sale_type: "wholesale" | "retail"
    quantity: number
    conversion_factor: number
    base_quantity: number
    unit_price: string
    subtotal: string
}

export type SaleItemPayload = {
    product: string
    product_unit: string
    quantity: string | number
    unit_price: string
}

export type Sale = {
    uuid: string
    reference_code: string
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
    reference_code: string
    customer: string
    customer_name: string
    sale: string | null
    amount: string
    /** Sale total this payment settles, in exact decimal money. */
    sale_total: string | null
    /** Total received against that sale, including this payment. */
    amount_paid: string
    /** What is still owed on that sale. */
    outstanding_balance: string
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
    payment_date: string
    notes?: string
}
export type DashboardStats = {
    total_products: number
    stock_units: number
    sales_value: string
    purchases_value: string
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
        /** Exact decimal money, never a float. */
        amount: string
        purchases?: string
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
    quantity: string
    unit: string
    unit_price: string
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

export type PurchaseReceiptData = {
    business: ReceiptBusiness
    purchase: {
        uuid: string
        receipt_number: string
        supplier_invoice_number: string
        purchase_date: string
        receiver: string
        supplier: string
    }
    items: ReceiptItem[]
    totals: Pick<ReceiptTotals, "subtotal" | "grand_total">
    currency: string
}

export type PrintableReceiptData = ReceiptData | PurchaseReceiptData

export type ReportDownload = {
    blob: Blob
    filename: string
}

export type StockSummary = {
    stocked_products: number
    total_quantity: number
    low_stock_items: number
    out_of_stock_items: number
    /** Exact decimal string, never a float. */
    stock_value: string
}

export type PaymentSummary = {
    today_payments: string
    total_paid: string
    outstanding: string
    pending: number
}

export type CustomerSummary = {
    total_customers: number
    active_customers: number
    total_sales: string
    outstanding: string
}

export type SupplierSummary = {
    total_suppliers: number
    active_suppliers: number
    total_purchases: number
}