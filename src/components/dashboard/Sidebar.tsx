"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgePercent,
  BarChart3,
  Boxes,
  Contact,
  DollarSign,
  FileText,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Package,
  Settings,
  ShoppingBasket,
  Table2,
  Users,
  Warehouse,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Categories",
    href: "/categories",
    icon: Table2,
  },
  {
    label: "Brands",
    href: "/brands",
    icon: BadgePercent,
  },
  {
    label: "Units",
    href: "/units",
    icon: Package,
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
  },
  {
    label: "Stock",
    href: "/stock",
    icon: Warehouse,
  },
  {
    label: "Purchases",
    href: "/purchases",
    icon: FileText,
  },
  {
    label: "Sales",
    href: "/sales",
    icon: ListOrdered,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Payments",
    href: "/payments",
    icon: DollarSign,
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: ShoppingBasket,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Contact,
  },
  {
    label: "Stock Movements",
    href: "/movements",
    icon: Boxes,
  },
  // {
  //   label: "Expenses",
  //   href: "/expenses",
  //   icon: FileText,
  // },
  {
    label: "Users",
    href: "/users",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  onLogout?: () => void
}

export function Sidebar({
  isOpen = true,
  onClose,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname()

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && onClose && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border/70 bg-card transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between border-b border-border/70 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Boxes className="size-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                IMARA <span className="text-foreground">SHOP</span>
              </span>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Wholesale
              </p>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-lg lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 space-y-1 px-3.5 py-4">
          {navItems.map((item) => {
            const active = isRouteActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
              >
                <Icon
                  className={`size-4.5 shrink-0 transition-colors ${active
                    ? "text-white"
                    : "text-muted-foreground group-hover:text-foreground"
                    }`}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section: Logout */}
        <div className="border-t border-border/70 p-3.5">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <LogOut className="size-4.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
