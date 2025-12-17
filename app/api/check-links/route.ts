import { type NextRequest, NextResponse } from "next/server"

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

async function checkLink(url: string, timeout = 8000): Promise<LinkResult> {
  const startTime = Date.now()

  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const skipPatterns = [
      "xmlrpc.php",
      "wp-json",
      "wp-admin",
      "wp-login",
      "wp-content",
      "/feed",
      "/rss",
      "robots.txt",
      "sitemap.xml",
      ".xml",
    ]

    if (skipPatterns.some((pattern) => pathname.includes(pattern))) {
      return {
        url,
        status: null,
        statusText: "Skipped",
        isValid: true,
        isBroken: false,
        category: "skipped",
        loadTime: Date.now() - startTime,
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const loadTime = Date.now() - startTime
    const status = response.status

    let isValid = false
    let isBroken = false
    let category: "success" | "broken" | "warning" | "skipped"

    if (status >= 200 && status < 300) {
      // Success
      isValid = true
      isBroken = false
      category = "success"
    } else if (status >= 300 && status < 400) {
      // Redirects are valid
      isValid = true
      isBroken = false
      category = "success"
    } else if (status === 404) {
      // Page not found - truly broken
      isValid = false
      isBroken = true
      category = "broken"
    } else if (status >= 500) {
      // Server errors - broken
      isValid = false
      isBroken = true
      category = "broken"
    } else {
      // Other 4xx - warnings (auth required, forbidden, etc.)
      isValid = false
      isBroken = false
      category = "warning"
    }

    return {
      url,
      status,
      statusText: response.statusText || `HTTP ${status}`,
      isValid,
      isBroken,
      category,
      loadTime,
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    const isTimeout = error instanceof Error && error.name === "AbortError"

    return {
      url,
      status: null,
      statusText: isTimeout ? "Timeout" : "Network Error",
      isValid: false,
      isBroken: false,
      category: "warning",
      loadTime,
    }
  }
}

async function extractLinks(htmlContent: string, baseUrl: string): Promise<string[]> {
  try {
    const linkRegex = /href\s*=\s*["']([^"']+)["']/gi
    const links: string[] = []
    let match

    while ((match = linkRegex.exec(htmlContent)) !== null) {
      const href = match[1]
      if (
        href &&
        href.length > 0 &&
        !href.startsWith("javascript:") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        !href.startsWith("#")
      ) {
        links.push(href)
      }
    }

    const parsedBase = new URL(baseUrl)
    const baseDomain = parsedBase.hostname

    const absoluteLinks = links
      .map((link) => {
        try {
          if (link.startsWith("http://") || link.startsWith("https://")) return link
          if (link.startsWith("//")) return `https:${link}`
          if (link.startsWith("/")) return new URL(link, baseUrl).href
          return new URL(link, baseUrl).href
        } catch {
          return null
        }
      })
      .filter((link): link is string => link !== null)

    const internalLinks = absoluteLinks.filter((link) => {
      try {
        const linkUrl = new URL(link)
        return linkUrl.hostname === baseDomain || linkUrl.hostname.endsWith(`.${baseDomain}`)
      } catch {
        return false
      }
    })

    return Array.from(new Set(internalLinks))
  } catch (error) {
    console.error("[v0] Link extraction error:", error)
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let htmlContent: string
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json({ error: `Unable to fetch website. Status: ${response.status}` }, { status: 400 })
      }

      htmlContent = await response.text()
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const errorMsg =
        fetchError instanceof Error && fetchError.name === "AbortError"
          ? "Website fetch timeout. Please try again."
          : fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch website"

      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    if (!htmlContent || htmlContent.length === 0) {
      return NextResponse.json({ error: "Website returned empty content" }, { status: 400 })
    }

    const allLinks = await extractLinks(htmlContent, url)

    if (allLinks.length === 0) {
      return NextResponse.json({
        url,
        linksFound: 0,
        linksChecked: 0,
        links: [],
        message: "No internal links found on this page",
      })
    }

    const linksToCheck = allLinks.slice(0, 100)

    const results: LinkResult[] = []
    for (let i = 0; i < linksToCheck.length; i++) {
      const link = linksToCheck[i]
      const result = await checkLink(link)
      result.foundOn = url
      results.push(result)

      // Rate limit: 100ms between requests
      if (i < linksToCheck.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return NextResponse.json({
      url,
      linksFound: allLinks.length,
      linksChecked: linksToCheck.length,
      links: results,
    })
  } catch (error) {
    console.error("[v0] Link check error:", error)
    const errorMsg = error instanceof Error ? error.message : "Failed to check links"
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
