import { type NextRequest, NextResponse } from "next/server"

interface LinkResult {
  url: string
  status: number | null
  statusText: string
  isValid: boolean
  isDead: boolean
  isError: boolean
  loadTime?: number
  foundOn?: string
}

async function checkLink(url: string, timeout = 10000): Promise<LinkResult> {
  const startTime = Date.now()

  try {
    // Skip common non-content URLs
    const pathname = new URL(url).pathname.toLowerCase()
    if (
      pathname.includes("xmlrpc.php") ||
      pathname.includes("wp-json") ||
      pathname.includes("wp-admin") ||
      pathname.includes("wp-login") ||
      pathname.includes("feed") ||
      pathname.includes("robots.txt") ||
      pathname.includes("sitemap")
    ) {
      return {
        url,
        status: null,
        statusText: "Skipped (Non-content URL)",
        isValid: true,
        isDead: false,
        isError: false,
        loadTime: Date.now() - startTime,
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Try HEAD request first (faster)
    let response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      redirect: "follow",
      signal: controller.signal,
    })

    // If HEAD fails or returns error, try GET
    if (response.status === 405 || response.status === 403 || response.status === 400) {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        signal: controller.signal,
      })
    }

    clearTimeout(timeoutId)
    const loadTime = Date.now() - startTime

    // Determine link status based on HTTP code
    const status = response.status
    let isValid = false
    let isDead = false

    if (status >= 200 && status < 300) {
      // 2xx: Success
      isValid = true
      isDead = false
    } else if (status >= 300 && status < 400) {
      // 3xx: Redirect (valid - browser follows these)
      isValid = true
      isDead = false
    } else if (status === 405) {
      // 405: Method not allowed but resource exists
      isValid = true
      isDead = false
    } else if (status === 401 || status === 403) {
      // 401/403: Auth required but resource exists
      isValid = true
      isDead = false
    } else if (status === 404) {
      // 404: Not found - truly broken
      isValid = false
      isDead = true
    } else if (status >= 500) {
      // 5xx: Server error - mark as broken
      isValid = false
      isDead = true
    } else {
      // Other 4xx errors - broken
      isValid = false
      isDead = true
    }

    return {
      url,
      status,
      statusText: response.statusText || `HTTP ${status}`,
      isValid,
      isDead,
      isError: false,
      loadTime,
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    const isTimeout = error instanceof Error && error.name === "AbortError"

    // Network errors and timeouts are not broken links, just errors
    return {
      url,
      status: null,
      statusText: isTimeout ? "Timeout" : "Network Error",
      isValid: false,
      isDead: false,
      isError: true,
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

    // Validate URL format
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

    // Check each link with rate limiting
    const results: LinkResult[] = []
    for (let i = 0; i < linksToCheck.length; i++) {
      const link = linksToCheck[i]
      const result = await checkLink(link)
      result.foundOn = url
      results.push(result)

      // Rate limit: 200ms between requests
      if (i < linksToCheck.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
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
