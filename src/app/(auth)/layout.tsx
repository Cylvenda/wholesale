import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-background p-2 pt-16 font-sans text-foreground sm:p-4 sm:pt-16 md:p-8">
            {/* Glassmorphic Auth Card Wrapper */}
            <Card className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-md border border-border/80 bg-card/60 shadow-2xl shadow-chart-3/5 backdrop-blur-md md:grid-cols-2">
                {/* LEFT COLUMN: Wholesale Inventory Illustration */}
                <div className="relative hidden h-full min-h-[500px] items-center justify-center overflow-hidden rounded-[1.6rem] border border-border/60 bg-muted/30 p-8 md:flex">
                    <Image
                        src="/auth-bg.svg"
                        alt="Wholesale inventory illustration"
                        fill
                        sizes="(min-width: 768px) 50vw, 0px"
                        className="object-contain"
                        priority
                    />
                </div>

                {/* RIGHT COLUMN: The Auth Form Side */}
                <div className="flex min-w-0 items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
                    <div className="w-full max-w-md space-y-6">
                        {/* Integrated Branding Header with Generated Icon */}
                        <div className="flex justify-center md:justify-start">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-3 rounded-xl transition hover:opacity-85"
                            >
                                <Image
                                    src="/icon-192.png"
                                    alt="StockLedger icon"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-chart-4 leading-none sm:text-sm sm:tracking-[0.25em]">
                                        Wholesale Inventory
                                    </p>
                                    <p className="mt-1 text-[8px] font-bold uppercase leading-tight tracking-wider text-muted-foreground sm:text-[9px] sm:tracking-widest">
                                        Stock, sales, purchasing operations
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Render Nested Page Form (children) */}
                        <div className="pt-2 bg-inherit!">{children}</div>
                    </div>
                </div>
            </Card>
        </main>
    )
}
