import type { ReactNode } from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { cn } from "@/lib/utils"
import { poppins } from "@/lib/fonts"
import { ThemeProvider, themeScript } from "@/components/theme/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar"
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt"
import { PwaUpdateBanner } from "@/components/pwa/PwaUpdateBanner"

export const metadata: Metadata = {
    title: {
        default: "StockLedger – Wholesale Inventory",
        template: "%s | StockLedger",
    },
    description:
        "Manage products, stock, purchases, sales, customers, and suppliers for your wholesale operation.",
    applicationName: "StockLedger",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        title: "StockLedger",
        statusBarStyle: "default",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
        other: [
            { rel: "mask-icon", url: "/icon-maskable-512.png", color: "#3b3fcf" },
        ],
    },
}

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#3b3fcf" },
        { media: "(prefers-color-scheme: dark)", color: "#2a2ea8" },
    ],
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    viewportFit: "cover",
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn("h-full", "antialiased", poppins.variable)}
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="default"
                />
                <meta name="apple-mobile-web-app-title" content="StockLedger" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <meta name="msapplication-TileColor" content="#3b3fcf" />
                <meta name="msapplication-TileImage" content="/icon-192.png" />
                <link rel="manifest" href="/manifest.json" />
            </head>
            <body
                className={cn(
                    "min-h-full flex flex-col font-sans",
                    poppins.variable
                )}
            >
                <ThemeProvider>
                    <TooltipProvider>
                        {children}
                        <ToastContainer position="bottom-right" theme="colored" />
                    </TooltipProvider>
                </ThemeProvider>

                <ServiceWorkerRegistrar />
                <PwaInstallPrompt />
                <PwaUpdateBanner />
            </body>
        </html>
    )
}
