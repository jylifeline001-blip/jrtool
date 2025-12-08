import { type NextRequest, NextResponse } from "next/server"
import { JSDOM } from "jsdom"

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

    // Handle timeout and other errors
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
    const dom = new JSDOM(htmlContent, { url: baseUrl })
    const links = Array.from(dom.window.document.querySelectorAll("a[href]"))
      .map((el) => el.getAttribute("href"))
      .filter((href): href is string => href !== null && href.length > 0)

    const absoluteLinks = links
      .map((link) => {
        try {
          if (link.startsWith("http")) return link
          if (link.startsWith("/")) return new URL(link, baseUrl).href
          if (link.startsWith("#")) return new URL(baseUrl).href
          return new URL(link, baseUrl).href
        } catch {
          return null
        }
      })
      .filter((link): link is string => link !== null)

    // Remove duplicates
    return Array.from(new Set(absoluteLinks))
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Fetch the website
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Unable to fetch website. Status: ${response.status}` }, { status: 400 })
    }

    const htmlContent = await response.text()

    // Extract all links from the page
    const allLinks = await extractLinks(htmlContent, url)

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

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check links. Please try again later.",
      },
      { status: 500 },
    )
  }
}
