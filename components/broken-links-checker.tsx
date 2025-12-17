"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Loader2, X, Zap, Link2 } from "lucide-react"

interface LinkResult {
  url: string
  status: number | null
  statusText: string
  isValid: boolean
  isBroken: boolean
  category: "success" | "broken" | "warning" | "skipped"
  loadTime?: number
  foundOn?: string
}

export function BrokenLinksChecker() {
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [results, setResults] = useState<LinkResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState({ total: 0, valid: 0, broken: 0, warnings: 0, skipped: 0 })

  const isValidUrl = (url: string) => {
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`)
      return u.hostname.length > 0
    } catch {
      return false
    }
  }

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResults([])
    setSummary({ total: 0, valid: 0, broken: 0, warnings: 0, skipped: 0 })

    if (!websiteUrl.trim()) {
      setError("Please enter a website URL")
      setLoading(false)
      return
    }

    if (!isValidUrl(websiteUrl)) {
      setError("Please enter a valid website URL (e.g., example.com or https://example.com)")
      setLoading(false)
      return
    }

    try {
      const fullUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`

      const res = await fetch("/api/check-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      })

      let data
      const contentType = res.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json()
        } catch {
          throw new Error("Invalid response format from server")
        }
      } else {
        throw new Error("Server returned invalid response")
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to check links")
      }

      const linkResults = data.links || []
      setResults(linkResults)

      const stats = {
        total: linkResults.length,
        valid: linkResults.filter((l: LinkResult) => l.category === "success").length,
        broken: linkResults.filter((l: LinkResult) => l.isBroken).length,
        warnings: linkResults.filter((l: LinkResult) => l.category === "warning").length,
        skipped: linkResults.filter((l: LinkResult) => l.category === "skipped").length,
      }
      setSummary(stats)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check links. Please try again."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <form onSubmit={handleCheck} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Website URL</label>
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="example.com or https://example.com"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg h-10 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning for links...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Check Links
            </>
          )}
        </Button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-200 dark:border-blue-800">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.total}</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Total Links</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center border border-green-200 dark:border-green-800">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.valid}</p>
            <p className="text-xs text-green-700 dark:text-green-300 font-medium">Valid</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center border border-red-200 dark:border-red-800">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.broken}</p>
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">Broken</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.warnings}</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Warnings</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg text-center border border-gray-200 dark:border-gray-800">
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{summary.skipped}</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Skipped</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Checking internal links only. Valid: 200-399 (success/redirects). Broken: 404 (not found) or 5xx (server
            error). Warnings: Auth required, timeouts, or other 4xx errors. Skipped: System files like xmlrpc.php,
            wp-admin (not meant for public access).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-semibold text-foreground">URL</th>
                  <th className="text-center py-3 px-3 font-semibold text-foreground">Status</th>
                  <th className="text-center py-3 px-3 font-semibold text-foreground">Time (ms)</th>
                  <th className="text-center py-3 px-3 font-semibold text-foreground">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((link, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition">
                    <td className="py-3 px-3">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs break-all"
                      >
                        {link.url}
                      </a>
                    </td>
                    <td className="text-center py-3 px-3 font-mono text-xs">{link.status || link.statusText}</td>
                    <td className="text-center py-3 px-3 text-xs">{link.loadTime?.toFixed(0) || "—"}</td>
                    <td className="text-center py-3 px-3">
                      {link.category === "success" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                          <CheckCircle className="w-3 h-3" />
                          Valid
                        </span>
                      ) : link.category === "broken" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded">
                          <X className="w-3 h-3" />
                          Broken
                        </span>
                      ) : link.category === "skipped" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                          Skipped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded">
                          <AlertCircle className="w-3 h-3" />
                          Warning
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
            <p className="font-semibold">Status Guide:</p>
            <p>
              <span className="font-medium text-green-600 dark:text-green-400">Valid:</span> HTTP 200-399 (success and
              redirects work properly)
            </p>
            <p>
              <span className="font-medium text-red-600 dark:text-red-400">Broken:</span> HTTP 404 (page not found) or
              500+ (server error)
            </p>
            <p>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">Warning:</span> Auth required
              (401/403), timeout, or other access issues
            </p>
            <p>
              <span className="font-medium text-gray-600 dark:text-gray-400">Skipped:</span> System files like
              xmlrpc.php, wp-admin (not meant for public access)
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && !error && (
        <div className="text-center py-8">
          <Link2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Enter a website URL to scan for broken links</p>
        </div>
      )}
    </div>
  )
}
