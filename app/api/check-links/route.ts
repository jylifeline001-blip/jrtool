import { type NextRequest, NextResponse } from "next/server"

interface LinkResult {
  url: string
  status: number | null
  statusText: string
  isValid: boolean
  isDead: boolean
  isError: boolean
  loadTime?: number
}

async function checkLink(url: string, timeout = 5000): Promise<LinkResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const loadTime = Date.now() - startTime

    const isDead = response.status >= 400
    const isValid = response.status >= 200 && response.status < 400

    return {
      url,
      status: response.status,
      statusText: response.statusText,
      isValid,
      isDead,
      isError: false,
      loadTime,
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    const isTimeout = error instanceof Error && error.name === "AbortError"
    const errorMsg = error instanceof Error ? error.message : "Unknown error"

    return {
      url,
      status: null,
      statusText: isTimeout ? "Timeout" : errorMsg,
      isValid: false,
      isDead: false,
      isError: true,
      loadTime,
    }
  }
}

async function extractLinks(htmlContent: string, baseUrl: string): Promise<string[]> {
  try {
    const linkRegex = /href=["']([^"']+)["']/gi
    const links: string[] = []
    let match

    while ((match = linkRegex.exec(htmlContent)) !== null) {
      const href = match[1]
      if (href && href.length > 0 && !href.startsWith("javascript:")) {
        links.push(href)
      }
    }

    const absoluteLinks = links
      .map((link) => {
        try {
          if (link.startsWith("http://") || link.startsWith("https://")) return link
          if (link.startsWith("//")) return `https:${link}`
          if (link.startsWith("/")) return new URL(link, baseUrl).href
          if (link.startsWith("#")) return baseUrl.split("#")[0]
          return new URL(link, baseUrl).href
        } catch {
          return null
        }
      })
      .filter((link): link is string => link !== null)

    return Array.from(new Set(absoluteLinks))
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
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let htmlContent: string
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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

    // Extract all links from the page
    const allLinks = await extractLinks(htmlContent, url)

    if (allLinks.length === 0) {
      return NextResponse.json({
        url,
        linksFound: 0,
        linksChecked: 0,
        links: [],
      })
    }

    const linksToCheck = allLinks.slice(0, 50)

    // Check each link with rate limiting
    const results: LinkResult[] = []
    for (let i = 0; i < linksToCheck.length; i++) {
      const link = linksToCheck[i]
      const result = await checkLink(link)
      results.push(result)

      // Add small delay between requests to avoid overwhelming servers
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
