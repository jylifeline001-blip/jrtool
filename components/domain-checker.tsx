"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Trash2 } from "lucide-react"

interface WhoisData {
  domain: string
  expiryDate: string | null
  creationDate: string | null
  updatedDate: string | null
  registrar: string | null
  status: string[]
  error?: string
}

interface SSLData {
  domain: string
  validFrom: string | null
  validTo: string | null
  daysRemaining: number | null
  expired: boolean
  error: string | null
}

interface DomainResult extends WhoisData {
  ssl?: SSLData
  loading: boolean
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "N/A"
  }
}

const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
  if (!expiryDate) return null
  try {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return null
  }
}

const getExpiryStatus = (days: number | null): { color: string; label: string; bgColor: string; textColor: string } => {
  if (days === null)
    return { color: "text-gray-600", label: "Unknown", bgColor: "bg-gray-100", textColor: "text-gray-700" }
  if (days < 0) return { color: "text-destructive", label: "Expired", bgColor: "bg-red-100", textColor: "text-red-700" }
  if (days < 30)
    return { color: "text-orange-600", label: "Critical", bgColor: "bg-orange-100", textColor: "text-orange-700" }
  if (days < 90)
    return { color: "text-yellow-600", label: "Warning", bgColor: "bg-yellow-100", textColor: "text-yellow-700" }
  return { color: "text-green-600", label: "Healthy", bgColor: "bg-green-100", textColor: "text-green-700" }
}

const getSSLStatus = (
  days: number | null,
  error: string | null,
): { color: string; label: string; bgColor: string; textColor: string } => {
  if (error)
    return { color: "text-gray-600", label: "Not Available", bgColor: "bg-gray-100", textColor: "text-gray-700" }
  if (days === null)
    return { color: "text-gray-600", label: "Unknown", bgColor: "bg-gray-100", textColor: "text-gray-700" }
  if (days < 0) return { color: "text-destructive", label: "Expired", bgColor: "bg-red-100", textColor: "text-red-700" }
  if (days < 15)
    return { color: "text-orange-600", label: "Expiring Soon", bgColor: "bg-orange-100", textColor: "text-orange-700" }
  return { color: "text-green-600", label: "Valid", bgColor: "bg-green-100", textColor: "text-green-700" }
}

const validateDomain = (domain: string): boolean => {
  const trimmed = domain.trim()
  if (!trimmed) return false
  const cleaned = trimmed
    .replace(/https?:\/\//g, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase()
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/.test(cleaned)
}

export function DomainChecker() {
  const [domainsInput, setDomainsInput] = useState("")
  const [results, setResults] = useState<Map<string, DomainResult>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const extractDomains = (input: string): string[] => {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && validateDomain(line))
      .map((line) =>
        line
          .replace(/https?:\/\//g, "")
          .replace(/^www\./, "")
          .split("/")[0]
          .toLowerCase(),
      )
      .filter((domain, index, self) => self.indexOf(domain) === index) // Remove duplicates
      .slice(0, 20) // Limit to 20 domains
  }

  const processDomains = async (domains: string[]) => {
    setLoading(true)
    setError("")
    const newResults = new Map<string, DomainResult>()

    // Initialize all domains as loading
    domains.forEach((domain) => {
      newResults.set(domain, {
        domain,
        expiryDate: null,
        creationDate: null,
        updatedDate: null,
        registrar: null,
        status: [],
        ssl: undefined,
        loading: true,
      })
    })
    setResults(newResults)

    // Process with rate limiting (200ms delay between requests)
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i]

      // Add delay before request (except for first one)
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      try {
        // Fetch both WHOIS and SSL data in parallel
        const [whoisRes, sslRes] = await Promise.all([
          fetch("/api/whois", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          }),
          fetch(`/api/ssl?domain=${encodeURIComponent(domain)}`),
        ])

        const whoisText = await whoisRes.text()
        let whoisData

        try {
          whoisData = JSON.parse(whoisText)
        } catch {
          throw new Error("Invalid WHOIS response format")
        }

        if (!whoisRes.ok) {
          throw new Error(whoisData.error || `WHOIS Error: ${whoisRes.status}`)
        }

        // Parse SSL data
        const sslText = await sslRes.text()
        let sslData

        try {
          sslData = JSON.parse(sslText)
        } catch {
          sslData = {
            domain,
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            expired: false,
            error: "Invalid SSL response",
          }
        }

        // Update result with both WHOIS and SSL data
        newResults.set(domain, {
          ...whoisData,
          ssl: sslData,
          loading: false,
        })
        setResults(new Map(newResults))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Lookup failed"
        newResults.set(domain, {
          domain,
          expiryDate: null,
          creationDate: null,
          updatedDate: null,
          registrar: null,
          status: [],
          ssl: {
            domain,
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            expired: false,
            error: "SSL check failed",
          },
          error: errorMessage,
          loading: false,
        })
        setResults(new Map(newResults))
      }
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const domains = extractDomains(domainsInput)

    if (domains.length === 0) {
      setError("Please enter at least one valid domain")
      return
    }

    await processDomains(domains)
  }

  const calculateSummary = () => {
    const resultArray = Array.from(results.values())
    const checked = resultArray.filter((r) => !r.loading).length
    const errors = resultArray.filter((r) => r.error).length
    const expiring = resultArray.filter((r) => {
      const days = getDaysUntilExpiry(r.expiryDate)
      return days !== null && days < 30 && days >= 0
    }).length
    const expired = resultArray.filter((r) => {
      const days = getDaysUntilExpiry(r.expiryDate)
      return days !== null && days < 0
    }).length

    return { total: resultArray.length, checked, errors, expiring, expired }
  }

  const summary = calculateSummary()

  return (
    <div className="space-y-8">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Domain Expiry Checker</CardTitle>
          <CardDescription>Check up to 20 domains at once. Enter one domain per line</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 line-through">
            <textarea
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
              placeholder="example.com&#10;google.com&#10;github.com"
              disabled={loading}
              className="w-full h-32 px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 font-mono text-sm resize-vertical"
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                type="submit"
                disabled={loading || !domainsInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Domains"
                )}
              </Button>
              {results.size > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    setResults(new Map())
                    setDomainsInput("")
                    setError("")
                  }}
                  className="px-4 py-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert className="border-destructive bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Badges */}
      {results.size > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.checked}</p>
                <p className="text-xs text-blue-600/70">Checked</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{summary.total - summary.errors}</p>
                <p className="text-xs text-green-600/70">Valid</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{summary.expiring}</p>
                <p className="text-xs text-orange-600/70">Expiring</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{summary.expired}</p>
                <p className="text-xs text-red-600/70">Expired</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {results.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domain Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-semibold text-foreground">Domain</th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">Expiry Date</th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">Days Left</th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">Registrar</th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">SSL Expiry</th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">SSL Days Left</th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">SSL Status</th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(results.values()).map((result) => {
                    const daysLeft = getDaysUntilExpiry(result.expiryDate)
                    const status = getExpiryStatus(daysLeft)
                    const sslStatus = getSSLStatus(result.ssl?.daysRemaining ?? null, result.ssl?.error ?? null)

                    return (
                      <tr
                        key={result.domain}
                        className={`border-b border-border hover:bg-muted/50 transition-colors ${
                          result.error ? "bg-red-50 dark:bg-red-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3 font-medium text-foreground">{result.domain}</td>
                        <td className="py-3 px-3 text-foreground">
                          {result.loading ? (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Loader2 className="w-3 h-3 animate-spin" />
                            </span>
                          ) : result.error ? (
                            <span className="text-red-600">Error</span>
                          ) : (
                            formatDate(result.expiryDate)
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {result.loading ? (
                            <span className="text-muted-foreground">-</span>
                          ) : result.error ? (
                            <span className="text-red-600">N/A</span>
                          ) : daysLeft !== null ? (
                            <span className={`font-semibold ${status.color}`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-foreground text-muted-foreground">
                          {result.registrar || (result.loading ? "-" : "N/A")}
                        </td>
                        <td className="py-3 px-3 text-foreground">
                          {result.loading ? (
                            <span className="text-muted-foreground">-</span>
                          ) : result.ssl?.error ? (
                            <span className="text-gray-500 text-xs">N/A</span>
                          ) : (
                            formatDate(result.ssl?.validTo || null)
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {result.loading ? (
                            <span className="text-muted-foreground">-</span>
                          ) : result.ssl?.error ? (
                            <span className="text-gray-500 text-xs">N/A</span>
                          ) : result.ssl?.daysRemaining !== null ? (
                            <span className={`font-semibold ${sslStatus.color}`}>
                              {result.ssl.daysRemaining < 0
                                ? `${Math.abs(result.ssl.daysRemaining)}d ago`
                                : `${result.ssl.daysRemaining}d`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {result.loading ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <span
                              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${sslStatus.bgColor} ${sslStatus.textColor}`}
                            >
                              {sslStatus.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {result.loading ? (
                            <span className="text-muted-foreground">-</span>
                          ) : result.error ? (
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              Error
                            </span>
                          ) : (
                            <span
                              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${status.bgColor} ${status.textColor}`}
                            >
                              {status.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
