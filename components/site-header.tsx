import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-3 group" suppressHydrationWarning>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-blue-500/25 transition-all">
                            JR
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold text-foreground">JR Tools</h1>
                            <p className="text-xs text-muted-foreground">Mayank Choudhary</p>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/#domain" className="hover:text-foreground transition" suppressHydrationWarning>
                            Domain Checker
                        </Link>
                        <Link href="/#links" className="hover:text-foreground transition" suppressHydrationWarning>
                            Link Checker
                        </Link>
                        <Link href="/health-checker" suppressHydrationWarning>
                            <Button variant="ghost" size="sm" className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400" suppressHydrationWarning>
                                Website Health Checker
                            </Button>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    )
}
