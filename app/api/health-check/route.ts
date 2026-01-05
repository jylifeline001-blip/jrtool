import { NextResponse } from "next/server"
import { JSDOM } from "jsdom"

export const maxDuration = 60 // Allow longer timeout for crawling

interface PageHealth {
    url: string
    status: "healthy" | "warning" | "error"
    statusCode: number
    loadTime: number
    issues: string[]
    issueType?: "Speed" | "CSS" | "Content" | "Security"
}

// Simple internal categorization for issues
const getIssueType = (issues: string[]): "Speed" | "CSS" | "Content" | "Security" | undefined => {
    if (issues.some(i => i.toLowerCase().includes("security") || i.toLowerCase().includes("hacked") || i.toLowerCase().includes("malware"))) return "Security"
    if (issues.some(i => i.toLowerCase().includes("css") || i.toLowerCase().includes("content"))) return "CSS" // or Content
    if (issues.some(i => i.toLowerCase().includes("slow") || i.toLowerCase().includes("time"))) return "Speed"
    return undefined
}

// Optimized Check URL (Stable)
async function checkUrl(url: string, isMain: boolean = false): Promise<PageHealth> {
    const issues: string[] = []
    let status: "healthy" | "warning" | "error" = "healthy"
    let statusCode = 0
    const start = performance.now()

    try {
        const controller = new AbortController()
        // Timeout 8s (More reliable)
        const timeout = setTimeout(() => controller.abort(), 8000)

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            },
        })
        clearTimeout(timeout)
        const loadTime = Math.round(performance.now() - start)
        statusCode = res.status

        if (!res.ok) {
            // Smart Status Handling
            if (res.status === 403 || res.status === 429 || res.status === 503) {
                status = "warning"
                issues.push(`Access Limitation (${res.status}) - Bot Protection?`)
            } else if (res.status === 404) {
                status = "error"
                issues.push("Page Not Found (404)")
            } else if (res.status >= 500) {
                status = "error"
                issues.push(`Server Error (${res.status})`)
            } else {
                status = "error"
                issues.push(`HTTP Error ${res.status}`)
            }
        } else {
            if (res.redirected) {
                const origin = new URL(url).origin
                const finalOrigin = new URL(res.url).origin
                if (origin !== finalOrigin) {
                    // Check if it's just http -> https
                    if (origin.replace("http:", "https:") !== finalOrigin) {
                        status = "warning"
                        issues.push(`Redirects to: ${new URL(res.url).hostname}`)
                    }
                }
            }
        }

        // Relaxed Speed Threshold (4s)
        if (loadTime > 4000) {
            if (status === "healthy") status = "warning"
            issues.push(`Slow load: ${(loadTime / 1000).toFixed(1)}s`)
        }

        if (url.startsWith("http://")) {
            status = "warning"
            issues.push("Insecure (HTTP)")
        }

        let htmlContent = "" // Unused

        if (res.ok) {
            const text = await res.text()
            const lowerText = text.toLowerCase()

            if (text.length < 500) {
                if (!text.includes('<div id="root"') && !text.includes('<div id="app"') && !text.includes('__NEXT_DATA__')) {
                    status = "warning"
                    issues.push("Content suspiciously short")
                }
            }

            if (lowerText.includes("hacked by") || lowerText.includes("0wn3d")) {
                status = "error"
                issues.push("Security: Potential defacement")
            }

            if (text.match(/<script[^>]*>[\s\S]*?eval\s*\(/i)) {
                status = "warning"
                issues.push("Suspicious 'eval' in script tags")
            }

            // CSS CHECK REMOVED: Too many false positives and timeout risks
        }

        return {
            url, status, statusCode, loadTime, issues,
            issueType: getIssueType(issues),
            html: "" // Don't send HTML back to client to save bandwidth
        } as any

    } catch (error: any) {
        return {
            url, status: "error", statusCode: 0,
            loadTime: Math.round(performance.now() - start),
            issues: [`Unreachable: ${error.message}`]
        }
    }
}

// Function to fetch sitemap and return URLs
async function fetchSitemap(baseUrl: string): Promise<string[]> {
    try {
        const sitemapUrl = new URL("/sitemap.xml", baseUrl).href
        const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(3000) }) // 3s timeout
        if (!res.ok) return []
        const text = await res.text()

        // Simple regex to extract <loc> URLs
        const regex = /<loc>(.*?)<\/loc>/g
        const urls: string[] = []
        let match
        while ((match = regex.exec(text)) !== null) {
            const foundUrl = match[1].trim()
            // If it's a sitemap index (nested sitemap), we might want to fetch it too, but for speed we'll just ignore or add it if it looks like a page.
            // A better check is to see if it ends in .xml
            if (!foundUrl.endsWith(".xml")) {
                urls.push(foundUrl)
            }
        }
        return urls
    } catch {
        return []
    }
}

// Scan Homepage ONLY for links (Depth 1, no recursion)
async function scanHomepageLinks(homepageUrl: string, maxLinks: number = 10): Promise<string[]> {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(homepageUrl, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        })
        clearTimeout(timeout)

        if (!res.ok) return []
        const text = await res.text()
        const baseOrigin = new URL(homepageUrl).origin
        const foundUrls: string[] = []

        const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["']/gi
        let match
        while ((match = linkRegex.exec(text)) !== null) {
            const href = match[1]
            if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) continue

            try {
                const fullUrl = new URL(href, homepageUrl).href
                if (fullUrl.startsWith(baseOrigin) && !foundUrls.includes(fullUrl)) {
                    if (!fullUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|css|js|xml|json|svg|ico)$/i)) {
                        foundUrls.push(fullUrl)
                    }
                }
            } catch { }
            if (foundUrls.length >= maxLinks) break
        }
        return foundUrls
    } catch {
        return []
    }
}


export async function POST(req: Request) {
    try {
        const { url } = await req.json()

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 })
        }

        let targetUrl = url.trim()
        if (!targetUrl.startsWith("http")) {
            targetUrl = `https://${targetUrl}`
        }

        // Attempt to discover pages
        // 1. Sitemap
        let pageUrls = await fetchSitemap(targetUrl)

        // 2. Discover links from Homepage (if sitemap missing or small)
        if (pageUrls.length < 5) {
            const discoveredUrls = await scanHomepageLinks(targetUrl, 15)
            // Merge and dedupe
            pageUrls = Array.from(new Set([...pageUrls, ...discoveredUrls]))
        } else {
            if (pageUrls.length > 20) pageUrls = pageUrls.slice(0, 20)
        }

        // Ensure main page is included
        if (!pageUrls.includes(targetUrl) && !pageUrls.some(u => u.includes(targetUrl.replace(/^https?:\/\//, '')))) {
            pageUrls.unshift(targetUrl)
        }

        pageUrls = Array.from(new Set(pageUrls))
        if (pageUrls.length > 20) pageUrls = pageUrls.slice(0, 20)
        if (pageUrls.length > 15) pageUrls = pageUrls.slice(0, 15)

        // PERFORM CHECKS
        const results: PageHealth[] = []
        const batchSize = 15 // Check all at once

        for (let i = 0; i < pageUrls.length; i += batchSize) {
            const batch = pageUrls.slice(i, i + batchSize)
            const batchResults = await Promise.all(batch.map(u => checkUrl(u, u === targetUrl)))

            // Remove the internal 'html' prop before sending
            batchResults.forEach((r: any) => { delete r.html })

            results.push(...batchResults)
        }

        // Final stats
        const totalPages = results.length
        const errors = results.filter(r => r.status === "error").length
        const slow = results.filter(r => r.loadTime > 2500).length
        const security = results.filter(r => r.issues.some(i => i.toLowerCase().includes("security") || i.toLowerCase().includes("hacked"))).length

        // Main result categorization
        const mainPageResult = results.find(r => r.url === targetUrl) || results[0]

        return NextResponse.json({
            main: mainPageResult,
            pages: results, // Send ALL pages
            stats: {
                totalPages,
                errors,
                slow,
                security
            }
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
