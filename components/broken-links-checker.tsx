"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Link2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Search,
  ShieldAlert,
  ArrowUpRight,
  HelpCircle,
  FileWarning,
  Zap,
  Activity
} from "lucide-react"

interface BrokenLink {
  url: string
  status: number | null
  statusText: string
  errorType: string
  foundOn: string
}

interface ScanResponse {
  totalPagesCrawled: number
  totalLinksChecked: number
  results: BrokenLink[]
}

export function BrokenLinksChecker() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResponse | null>(null)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    setError("")
    setResult(null)
    setProgress(5)

    try {
      const interval = setInterval(() => {
        setProgress(prev => (prev < 95 ? prev + 1 : prev))
      }, 250) // Slower progress bar to match deeper scan

      const res = await fetch("/api/check-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      clearInterval(interval)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to scan website")

      setResult(data)
      setProgress(100)
    } catch (err: any) {
      setError(err.message)
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-12">
      <Card className="border-none shadow-2xl bg-white/60 backdrop-blur-md overflow-hidden" suppressHydrationWarning>
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />
        <CardHeader className="pt-10 px-8 pb-6 text-center sm:text-left">
          <div className="flex items-center gap-4 mb-3 justify-center sm:justify-start">
            <div className="p-3 bg-red-100 rounded-2xl">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900 line-through-none">Strict Broken Link Checker</CardTitle>
              <CardDescription className="text-lg">Identify 404 errors, server failures, and dead URLs that hurt your SEO.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-0">
          <form onSubmit={handleCheck} className="flex gap-4 flex-col sm:flex-row mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
              <Input
                type="text"
                placeholder="Enter domain or URL (e.g., example.com)"
                className="pl-12 h-14 text-lg border-slate-200 focus:ring-red-500 focus:border-red-500 bg-white/80 rounded-2xl shadow-sm"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !url}
              className="h-14 px-10 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-2xl transition-all shadow-lg hover:shadow-red-500/30 active:scale-95 flex gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Deep Scanning...
                </>
              ) : (
                <>
                  Find Broken Links
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {loading && (
            <div className="space-y-3 mb-8 animate-in fade-in">
              <div className="flex justify-between text-sm font-bold text-slate-600 uppercase tracking-widest">
                <span>Crawling up to 40 pages...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-5 bg-red-50 border-2 border-red-100 rounded-2xl text-red-700 flex items-center gap-4 mb-8 animate-in zoom-in-95">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {result && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* Coverage Info */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-xl font-bold text-slate-900">{result.totalPagesCrawled}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Pages Scanned</div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-xl font-bold text-slate-900">{result.totalLinksChecked}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Links Verified</div>
                  </div>
                </div>
              </div>

              {result.results.length === 0 ? (
                <div className="py-12 bg-green-50/50 border-2 border-dashed border-green-200 rounded-3xl text-center">
                  <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">✅ No broken links found on scanned pages.</h3>
                  <p className="text-green-600 font-medium max-w-md mx-auto">Your site's link health passed our deep scan of {result.totalPagesCrawled} high-traffic pages.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-slate-800">Broken Links Found</h3>
                    <Badge className="bg-red-600 hover:bg-red-600 text-white px-3 py-1 text-sm font-bold">
                      {result.results.length} ISSUES
                    </Badge>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0">
                          <tr className="text-slate-500 text-xs font-black uppercase tracking-widest">
                            <th className="px-8 py-5 border-b border-slate-100">Source Page URL</th>
                            <th className="px-8 py-5 border-b border-slate-100">Broken Link URL</th>
                            <th className="px-8 py-5 border-b border-slate-100 text-center">Status</th>
                            <th className="px-8 py-5 border-b border-slate-100">Error Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.results.map((link, i) => (
                            <tr key={i} className="hover:bg-red-50/30 transition-colors">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-2 group">
                                  <span className="text-sm text-slate-500 font-medium truncate max-w-[200px]" title={link.foundOn}>{link.foundOn}</span>
                                  <a href={link.foundOn} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-red-600 transition-colors">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-extrabold text-red-600 truncate max-w-[350px]" title={link.url}>{link.url}</span>
                                  <a href={link.url} target="_blank" rel="noreferrer" className="p-1 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition-all">
                                    <ArrowUpRight className="h-4 w-4" />
                                  </a>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black ring-1 ring-red-200">
                                  {link.status || "FAIL"}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase italic tracking-tighter">
                                  <FileWarning className="h-3.5 w-3.5" />
                                  {link.errorType}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extra Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-12">
        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-slate-100 rounded-2xl">
              <HelpCircle className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">What Are Broken Links?</h3>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm mb-4">
            A broken link (also known as a dead link) is a hyperlink on a website that no longer works because the destination page has been moved, deleted, or is experiencing server issues.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 font-medium border border-slate-100">
            Commonly occurs due to URL typos, site migrations without redirects, or external websites going offline.
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-2xl text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Why Broken Links Hurt SEO</h3>
          </div>
          <ul className="space-y-5">
            {[
              { title: "Crawl Budget Waste", desc: "Search bots stop crawling your site if they keep hitting dead ends." },
              { title: "Poor User Experience", desc: "404 errors frustrate visitors and increase your bounce rate." },
              { title: "Loss of Rankings", desc: "Broken links stop the flow of link equity (PageRank) through your site." }
            ].map((item, i) => (
              <li key={i} className="flex gap-4">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">How to Fix Broken Links</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
              <span className="text-lg font-black text-slate-200 group-hover:text-blue-600 transition-colors">01</span>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Update Wrong URLs</h4>
                <p className="text-xs text-slate-500">Correct any character typos in your HTML attributes.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group border-y border-slate-50">
              <span className="text-lg font-black text-slate-200 group-hover:text-blue-600 transition-colors">02</span>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Replace External Links</h4>
                <p className="text-xs text-slate-500">Link to a new relevant source if the old one is gone.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
              <span className="text-lg font-black text-slate-200 group-hover:text-blue-600 transition-colors">03</span>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Use 301 Redirects</h4>
                <p className="text-xs text-slate-500">Forward deleted internal pages to the next most relevant URL.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
