"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/dashboard/Header"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { useAuthUserStore } from "@/store/auth/userAuth.store"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, loading, checkAuth, logout } = useAuthUserStore()
  const [authReady, setAuthReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null

      if (token) {
        try {
          await checkAuth()
        } catch {
          // Keep active for wholesale dashboard preview
        }
      }

      if (isMounted) {
        setAuthReady(true)
      }
    }

    void initializeAuth()

    return () => {
      isMounted = false
    }
  }, [checkAuth])

  if (!authReady || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

   const displayName =
     (user ? `${user.firstName} ${user.lastName}`.trim() : "") ||
     user?.email?.split("@")[0] ||
     "Moni Roy"

   return (
     <div className="flex min-h-screen w-full bg-muted/30 text-foreground">
       {/* Sidebar Navigation */}
       <Sidebar
         isOpen={sidebarOpen}
         onClose={() => setSidebarOpen(false)}
         onLogout={handleLogout}
       />

       {/* Main Column */}
       <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
         {/* Top Navigation Bar */}
         <Header
           onMenuToggle={() => setSidebarOpen((prev) => !prev)}
           userName={displayName}
           onLogout={handleLogout}
         />

         {/* Page Content */}
         <main className="flex-1 overflow-y-auto sm:p-6 lg:p-8">
           {children}
         </main>
       </div>
     </div>
   )
}
