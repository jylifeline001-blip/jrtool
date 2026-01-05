import { type NextRequest, NextResponse } from "next/server"
import { JSDOM } from "jsdom"

export const maxDuration = 60

interface LinkCheckResult {
  url: string
  status: number | null
  statusText: string
  isBroken: boolean
  errorType: string
  foundOn: string
}

interface PageData {
  url: string
  links: string[]
}

async function fetchSitemap(baseUrl: string): Promise<string[]> {
  try {
    const sitemapUrl = new URL("/sitemap.xml", baseUrl).href
    const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return []
    const text = await res.text()
    const regex = /<loc>(.*?)<\/loc>/g
    const urls: string[] = []
    let match
    while ((match = regex.exec(text)) !== null) {
      const foundUrl = match[1].trim()
      if (!foundUrl.endsWith(".xml") && !foundUrl.includes("/wp-admin/") && !foundUrl.includes("/login")) {
        urls.push(foundUrl)
      }
    }
    return urls
  } catch {
    return []
  }
}

async function getLinksFromPage(url: string, baseOrigin: string): Promise<PageData> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000)
    })

    if (!res.ok) return { url, links: [] }
    const text = await res.text()
    const dom = new JSDOM(text, { url })
    const document = dom.window.document
    const anchors = Array.from(document.querySelectorAll("a"))

    const links = anchors
      .map(a => a.href)
      .filter(href => {
        if (!href || href === "#") return false
        if (href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return false
        const lower = href.toLowerCase()
        if (lower.includes("/login") || lower.includes("/admin") || lower.includes("/wp-login") || lower.includes("/wp-admin")) return false
        return true
      })
      .map(href => {
        try {
          // Flatten URLs by removing fragments
          const urlObj = new URL(href, url)
          urlObj.hash = ""
          return urlObj.href
        } catch {
          return ""
        }
      })
      .filter(h => h !== "")

    return { url, links: Array.from(new Set(links)) }
  } catch {
    return { url, links: [] }
  }
}

async function validateLink(url: string, foundOn: string): Promise<LinkCheckResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BrokenLinkChecker/3.0; +https://jr-tools.com)",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow"
    })

    const status = res.status
    let isBroken = false
    let errorType = "Clean"

    if (status === 404) {
      isBroken = true
      errorType = "404 Not Found"
    } else if (status === 410) {
      isBroken = true
      errorType = "410 Gone"
    } else if (status >= 500) {
      isBroken = true
      errorType = `${status} Server Error`
    } else if (status >= 200 && status < 400) {
      isBroken = false
      errorType = "Clean"
    } else {
      isBroken = false
      errorType = "Security/Blocked"
    }

    return {
      url,
      status,
      statusText: res.statusText || `HTTP ${status}`,
      isBroken,
      errorType,
      foundOn
    }
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || ""
    let errorType = "Network Error"
    let isBroken = true

    if (error.name === "AbortError" || errorMsg.includes("timeout")) {
      errorType = "Timeout"
    } else if (errorMsg.includes("enotfound") || errorMsg.includes("dns")) {
      errorType = "DNS Error"
    } else if (errorMsg.includes("cert") || errorMsg.includes("ssl") || errorMsg.includes("tls")) {
      errorType = "SSL Error"
    } else {
      isBroken = false
    }

    return {
      url,
      status: 0,
      statusText: "Failed",
      isBroken,
      errorType,
      foundOn
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 })

    let targetUrl = url.trim()
    if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`

    const baseOrigin = new URL(targetUrl).origin

    // 1. IMPROVED PAGE DISCOVERY
    let discoveredPages = new Set<string>([targetUrl])

    // Try Sitemap first
    const sitemapPages = await fetchSitemap(targetUrl)
    sitemapPages.forEach(p => discoveredPages.add(p))

    // If sitemap is sparse, crawl home + 1 level
    if (discoveredPages.size < 5) {
      const homeData = await getLinksFromPage(targetUrl, baseOrigin)
      homeData.links.forEach(l => {
        if (l.startsWith(baseOrigin)) discoveredPages.add(l)
      })
    }

    // Limit crawl to 40 pages to stay within 60s timeout
    const pagesToCrawl = Array.from(discoveredPages).slice(0, 40)

    // 2. Multiphase extraction
    const pageResults = await Promise.all(pagesToCrawl.map(p => getLinksFromPage(p, baseOrigin)))
    const linkToPageMap = new Map<string, string>()
    pageResults.forEach(p => {
      p.links.forEach(l => {
        if (!linkToPageMap.has(l)) linkToPageMap.set(l, p.url)
      })
    })

    const uniqueLinks = Array.from(linkToPageMap.keys()).slice(0, 200)

    // 3. Batch Validation
    const results: LinkCheckResult[] = []
    const BATCH_SIZE = 25
    for (let i = 0; i < uniqueLinks.length; i += BATCH_SIZE) {
      const batch = uniqueLinks.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(l => validateLink(l, linkToPageMap.get(l)!))
      )
      results.push(...batchResults.filter(r => r.isBroken))
    }

    return NextResponse.json({
      totalPagesCrawled: pagesToCrawl.length,
      totalLinksChecked: uniqueLinks.length,
      results
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
