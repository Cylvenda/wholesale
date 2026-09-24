import Image from "next/image"
import Link from "next/link"
import {
    ArrowRight,
    Check,
    PackageCheck,
    ShieldCheck,
    UsersRound,
} from "lucide-react"

export default function LandingPage() {
    return (
        <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
            <header className="border-b border-primary bg-primary text-primary-foreground">
                <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
                    <Link href="/" className="flex items-center gap-2.5" aria-label="IMARA SHOP home">
                        <Image src="/icon-192.png" alt="" width={34} height={34} className="rounded-lg object-contain" />
                        <span className="text-lg font-bold tracking-tight">IMARA SHOP</span>
                    </Link>
                    <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-lg bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-background/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground">
                        Sign in
                    </Link>
                </div>
            </header>

            <section className="border-b border-border">
                <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-20 lg:px-10 lg:py-28">
                    <div className="max-w-2xl">
                        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-primary" /> WHOLESALE OPERATIONS
                        </p>
                        <h1 className="mt-6 text-4xl font-bold tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl lg:leading-[1.04]">Run your stockroom with certainty.</h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                            IMARA SHOP gives growing businesses one dependable place for stock, sales, purchases, and the people behind every order.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85">
                                Open your dashboard <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            {["Stock control", "Sales tracking", "Purchase records"].map((item) => (
                                <span key={item} className="inline-flex items-center gap-1.5"><Check className="size-4 text-primary" /> {item}</span>
                            ))}
                        </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div><p className="text-xs font-medium text-muted-foreground">OVERVIEW</p><p className="mt-1 text-lg font-bold">Today&apos;s operation</p></div>
                                <div className="rounded-lg bg-muted p-2.5 text-primary"><PackageCheck className="size-5" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 py-4"><Metric label="Stock on hand" value="2,480" /><Metric label="Today’s sales" value="24" /></div>
                            <div className="rounded-xl border border-border bg-background p-4">
                                <div className="flex items-center justify-between"><p className="text-sm font-semibold">Recent activity</p><span className="text-xs font-medium text-primary">Live</span></div>
                                <div className="mt-4 space-y-3"><Activity label="Sale recorded" detail="Invoice #SL-1048" /><Activity label="Purchase received" detail="18 items added" /><Activity label="Stock alert" detail="3 items need review" alert /></div>
                            </div>
                        </div>
                        <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm sm:flex">
                            <div className="rounded-lg bg-muted p-2 text-primary"><UsersRound className="size-4" /></div>
                            <div><p className="text-xs text-muted-foreground">Customer records</p><p className="text-sm font-bold">Always connected</p></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-border bg-muted/55">
                <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
                    <div className="max-w-2xl"><ShieldCheck className="mb-4 size-6 text-primary" /><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Built to make the next action obvious.</h2><p className="mt-2 text-muted-foreground">Open IMARA SHOP and get a focused view of the work that matters today.</p></div>
                    <Link href="/login" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85">Get started <ArrowRight className="size-4" /></Link>
                </div>
            </section>

            <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span className="font-semibold text-foreground">IMARA SHOP</span><span>Designed by <a href="https://cylvenda.co.tz" target="_blank" rel="noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">Cylvenda</a></span></footer>
        </main>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return <div className="rounded-xl bg-muted p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p></div>
}

function Activity({ label, detail, alert = false }: { label: string; detail: string; alert?: boolean }) {
    return <div className="flex items-center gap-3"><span className={`size-2 shrink-0 rounded-full ${alert ? "bg-amber-500" : "bg-primary"}`} /><div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></div></div>
}
