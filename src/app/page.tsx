import Image from "next/image"

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border bg-card">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/icon-192.png"
                            alt="StockLedger icon"
                            width={36}
                            height={36}
                            className="object-contain"
                        />
                        <span className="text-xl font-bold tracking-tight">
                            StockLedger
                        </span>
                    </div>
                    <a
                        href="/login"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        Sign in
                    </a>
                </div>
            </header>

            <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-6 py-20">
                <div className="max-w-2xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                        Wholesale operations platform
                    </p>
                    <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                        Know what is moving through your business.
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                        StockLedger brings products, inventory, purchases,
                        sales, customers, and suppliers into one clear
                        operating view.
                    </p>
                    <div className="mt-8">
                        <a
                            href="/login"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                            Open dashboard
                        </a>
                    </div>
                </div>
            </section>
        </main>
    )
}
