import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json()

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    const cleanDomain = domain
      .replace(/https?:\/\//g, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .toLowerCase()
      .trim()

    if (
      !cleanDomain ||
      !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/.test(cleanDomain)
    ) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    console.log("[v0] Fetching RDAP data for:", cleanDomain)

    // Try RDAP first (more reliable than WHOIS)
    const rdapUrl = `https://rdap.org/domain/${cleanDomain}`
    const response = await fetch(rdapUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/rdap+json",
      },
    }).catch(() => null)

    clearTimeout(timeoutId)

    if (!response || !response.ok) {
      console.log("[v0] RDAP lookup failed, trying whois.vu service")

      // Fallback to whois.vu
      const whoisController = new AbortController()
      const whoisTimeoutId = setTimeout(() => whoisController.abort(), 10000)

      const whoisResponse = await fetch(`https://www.whois.vu/?domain=${encodeURIComponent(cleanDomain)}`, {
        signal: whoisController.signal,
      })

      clearTimeout(whoisTimeoutId)

      if (!whoisResponse.ok) {
        throw new Error("Unable to fetch WHOIS data from any service")
      }

      // Parse HTML response from whois.vu
      const html = await whoisResponse.text()
      const data = parseWhoisHTML(html, cleanDomain)

      return NextResponse.json(data)
    }

    const data = await response.json()
    console.log("[v0] RDAP response received")

    // Parse RDAP response
    const parsedData = parseRDAPResponse(data, cleanDomain)
    return NextResponse.json(parsedData)
  } catch (error) {
    console.error("[v0] WHOIS lookup error:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout. Please try again." }, { status: 504 })
      }
    }

    return NextResponse.json(
      { error: "Unable to fetch domain information. The domain may not exist or be restricted." },
      { status: 500 },
    )
  }
}

function parseRDAPResponse(data: any, domain: string) {
  let expiryDate = null
  let creationDate = null
  let updatedDate = null
  let registrar = null
  const status: string[] = []

  // Extract dates from RDAP events
  if (data.events && Array.isArray(data.events)) {
    for (const event of data.events) {
      if (event.eventAction === "expiration") {
        expiryDate = event.eventDate
      } else if (event.eventAction === "registration") {
        creationDate = event.eventDate
      } else if (event.eventAction === "last changed") {
        updatedDate = event.eventDate
      }
    }
  }

  // Extract registrar from entities
  if (data.entities && Array.isArray(data.entities)) {
    for (const entity of data.entities) {
      if (entity.roles && entity.roles.includes("registrar") && entity.vcardArray) {
        registrar = extractVCardName(entity.vcardArray)
        break
      }
    }
  }

  // Extract status
  if (data.status && Array.isArray(data.status)) {
    status.push(...data.status)
  }

  return {
    domain,
    expiryDate,
    creationDate,
    updatedDate,
    registrar,
    status,
  }
}

function parseWhoisHTML(html: string, domain: string) {
  const result = {
    domain,
    expiryDate: null as string | null,
    creationDate: null as string | null,
    updatedDate: null as string | null,
    registrar: null as string | null,
    status: [] as string[],
  }

  // Simple regex patterns to extract data
  const expiryMatch = html.match(/Expir[a-z]*\s*(?:Date)?[:\s]*([^<\n]+)/i)
  if (expiryMatch) {
    result.expiryDate = expiryMatch[1].trim()
  }

  const createdMatch = html.match(/Creat[a-z]*\s*(?:Date)?[:\s]*([^<\n]+)/i)
  if (createdMatch) {
    result.creationDate = createdMatch[1].trim()
  }

  const updatedMatch = html.match(/(?:Last\s+)?Updat[a-z]*\s*(?:Date)?[:\s]*([^<\n]+)/i)
  if (updatedMatch) {
    result.updatedDate = updatedMatch[1].trim()
  }

  const registrarMatch = html.match(/Registrar[:\s]*([^<\n]+)/i)
  if (registrarMatch) {
    result.registrar = registrarMatch[1].trim()
  }

  const statusMatch = html.match(/Status[:\s]*([^<\n]+)/i)
  if (statusMatch) {
    const statusStr = statusMatch[1].trim()
    result.status = statusStr.split(/[,;]/).map((s) => s.trim())
  }

  return result
}

// Helper to extract name from vCard
function extractVCardName(vcard: any[]): string | null {
  for (const prop of vcard) {
    if (prop[0] === "fn") {
      return prop[3]
    }
  }
  return null
}
