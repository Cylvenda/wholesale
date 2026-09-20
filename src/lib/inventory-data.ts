export type Status = "active" | "inactive" | "in-stock" | "low-stock" | "out-of-stock" | "draft" | "received" | "cancelled" | "paid" | "partial" | "pending" | "completed" | "purchase" | "sale" | "adjustment" | "return"

export type InventoryRow = { 
  id: string
  primary: string
  secondary?: string
  values: string[]
  status?: Status
  created_at?: string
  raw?: Record<string, unknown>
}

// Deliberately isolated presentation fixtures. Replace with service responses as each API endpoint is connected.
export const inventoryRows: Record<string, InventoryRow[]> = {
  categories: [
    { id: "beer", primary: "Beer & Cider", secondary: "Crates, cartons and bottles", values: ["42", "Beer, cider and malt beverages", "12 Jun 2026"], status: "active" },
    { id: "soft-drinks", primary: "Soft Drinks", secondary: "Soda and energy drinks", values: ["31", "Carbonated and energy beverages", "09 Jun 2026"], status: "active" },
    { id: "water", primary: "Water", secondary: "Bottled drinking water", values: ["18", "Still and sparkling water", "28 May 2026"], status: "active" },
  ],
  suppliers: [
    { id: "s1", primary: "Kilimanjaro Breweries", secondary: "+255 712 000 151", values: ["orders@kibo.example", "TZS 8,450,000", "TZS 1,200,000"], status: "active" },
    { id: "s2", primary: "Coastal Beverages", secondary: "+255 754 000 220", values: ["sales@coastal.example", "TZS 4,820,000", "TZS 0"], status: "active" },
  ],
  customers: [
    { id: "c1", primary: "Mlimani Distributors", secondary: "+255 713 000 184", values: ["Dar es Salaam", "TZS 6,950,000", "TZS 760,000"], status: "active" },
    { id: "c2", primary: "Upendo Traders", secondary: "+255 687 000 410", values: ["Kariakoo, Dar es Salaam", "TZS 3,240,000", "TZS 0"], status: "active" },
  ],
  stock: [
    { id: "st1", primary: "Safari Lager 500ml", secondary: "Beer & Cider", values: ["240", "60", "Crates", "Today, 10:30"], status: "in-stock" },
    { id: "st2", primary: "Coca-Cola 300ml", secondary: "Soft Drinks", values: ["18", "24", "Crates", "Yesterday, 15:10"], status: "low-stock" },
    { id: "st3", primary: "Afya Water 500ml", secondary: "Water", values: ["0", "20", "Cartons", "12 Sep 2026"], status: "out-of-stock" },
  ],
  movements: [
    { id: "m1", primary: "Safari Lager 500ml", secondary: "Today, 10:30", values: ["Purchase", "+120 crates", "PUR-0068", "Amina M."], status: "purchase" },
    { id: "m2", primary: "Coca-Cola 300ml", secondary: "Today, 09:15", values: ["Sale", "-24 crates", "SAL-0142", "Amina M."], status: "sale" },
  ],
  purchases: [
    { id: "p1", primary: "PUR-0068", secondary: "Kilimanjaro Breweries", values: ["8 items", "TZS 2,160,000", "Today"], status: "received" },
    { id: "p2", primary: "PUR-0067", secondary: "Coastal Beverages", values: ["5 items", "TZS 840,000", "18 Sep 2026"], status: "draft" },
  ],
  sales: [
    { id: "sa1", primary: "SAL-0142", secondary: "Mlimani Distributors", values: ["6 items", "TZS 760,000", "Today"], status: "paid" },
    { id: "sa2", primary: "SAL-0141", secondary: "Upendo Traders", values: ["4 items", "TZS 382,000", "18 Sep 2026"], status: "partial" },
  ],
  payments: [
    { id: "pay1", primary: "PAY-0291", secondary: "Sale SAL-0142 · Mlimani Distributors", values: ["TZS 760,000", "Bank transfer", "Today"], status: "paid" },
    { id: "pay2", primary: "PAY-0290", secondary: "Purchase PUR-0066 · Coastal Beverages", values: ["TZS 420,000", "Cash", "18 Sep 2026"], status: "completed" },
  ],
}
