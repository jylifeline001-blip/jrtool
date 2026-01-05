"use client"

import { useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, Globe, Shield, Activity, Search, FileText, Lock } from "lucide-react"

type PageStatus = "healthy" | "warning" | "error"

interface PageResult {
    url: string
    status: PageStatus
    statusCode: number
    loadTime: number
    issues: string[]
    issueType?: "Speed" | "CSS" | "Content" | "Security"
}

interface Stats {
    totalPages: number
    errors: number
    slow: number
    security: number
}

interface CheckResult {
    main: PageResult
    pages: PageResult[]
    stats: Stats
}

export default function HealthCheckerPage() {
    const [url, setUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<CheckResult | null>(null)
    const [error, setError] = useState("")

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return

        setLoading(true)
        setError("")
        setResult(null)

        try {
            const res = await fetch("/api/health-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to check website")
            }

            setResult(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: PageStatus) => {
        switch (status) {
            case "healthy": return "text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
            case "warning": return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900"
            case "error": return "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900"
            default: return "text-slate-500 bg-slate-50"
        }
    }

    const getIssueBadge = (type?: string) => {
        switch (type) {
            case 'Speed': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Speed</Badge>
            case 'Security': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><Lock className="w-3 h-3 mr-1" /> Security</Badge>
            case 'CSS': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><FileText className="w-3 h-3 mr-1" /> CSS/Layout</Badge>
            default: return null
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950" suppressHydrationWarning>
            <SiteHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Website Health Checker</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Comprehensive scan: Availability, Speed, Security, and Broken Links for your entire site.
                    </p>
                </div>

                {/* Search Input */}
                <Card className="mb-8 border-none shadow-lg">
                    <CardContent className="p-6">
                        <form onSubmit={handleCheck} className="flex gap-4 flex-col sm:flex-row">
                            <div className="flex-1 relative">
                                <Globe className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Enter website URL (e.g., https://example.com)"
                                    className="pl-10 h-11 text-lg"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="h-11 px-8 text-lg bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                {loading ? (
                                    <>
                                        <Activity className="mr-2 h-5 w-5 animate-spin" />
                                        Scanning Site...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-5 w-5" />
                                        Scan Website
                                    </>
                                )}
                            </Button>
                        </form>
                        <p className="text-xs text-muted-foreground mt-2 ml-1">
                            Note: Checks up to 20 pages automatically. Usually completes in 5-10 seconds.
                        </p>
                        {error && (
                            <div className="mt-4 p-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-white dark:bg-slate-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Live Pages</CardTitle>
                                    <Globe className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{result.stats?.totalPages ?? 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Found via Sitemap/Crawl</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-slate-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Pages with Errors</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${result.stats?.errors > 0 ? "text-red-500" : ""}`}>
                                        {result.stats?.errors ?? 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">404, 500, or Broken</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-slate-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Slow Pages</CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${result.stats?.slow > 0 ? "text-yellow-600" : ""}`}>
                                        {result.stats?.slow ?? 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Load time &gt; 3s</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-slate-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Security Issues</CardTitle>
                                    <Shield className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${result.stats?.security > 0 ? "text-red-600" : ""}`}>
                                        {result.stats?.security ?? 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Malware / Suspicious</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Results Table */}
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b">
                                <CardTitle>Detailed Site Health Report</CardTitle>
                                <CardDescription>Results for all scanned pages found on the domain.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b">
                                            <tr>
                                                <th className="h-12 px-6 font-medium text-slate-500 dark:text-slate-400 w-[40%]">Page URL</th>
                                                <th className="h-12 px-6 font-medium text-slate-500 dark:text-slate-400">Status</th>
                                                <th className="h-12 px-6 font-medium text-slate-500 dark:text-slate-400">Issue Type</th>
                                                <th className="h-12 px-6 font-medium text-slate-500 dark:text-slate-400">Issues Found</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {result.pages.map((page, i) => (
                                                <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${page.status === 'error' ? 'bg-red-50/30' :
                                                    page.status === 'warning' ? 'bg-yellow-50/30' : ''
                                                    }`}>
                                                    <td className="p-6">
                                                        <a href={page.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline break-all block">
                                                            {page.url}
                                                        </a>
                                                        <div className="text-xs text-slate-400 mt-1">Load Time: {page.loadTime}ms</div>
                                                    </td>
                                                    <td className="p-6">
                                                        <Badge variant="outline" className={`${getStatusColor(page.status)}`}>
                                                            {page.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-6">
                                                        {getIssueBadge(page.issueType)}
                                                        {!page.issueType && page.status !== 'healthy' && <span className="text-slate-400">-</span>}
                                                        {page.status === 'healthy' && <span className="text-green-500 text-xs font-medium">OK</span>}
                                                    </td>
                                                    <td className="p-6">
                                                        {page.issues.length > 0 ? (
                                                            <ul className="space-y-1">
                                                                {page.issues.map((issue, idx) => (
                                                                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start">
                                                                        <span className="mr-2">•</span>
                                                                        {issue}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-green-500 text-xs flex items-center">
                                                                <CheckCircle className="w-3 h-3 mr-1" /> No issues found
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </main>
    )
}
