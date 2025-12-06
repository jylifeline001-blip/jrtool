import { type NextRequest, NextResponse } from "next/server"
import * as tls from "tls"
import * as net from "net"

interface SSLCertificate {
  domain: string
  validFrom: string | null
  validTo: string | null
  daysRemaining: number | null
  expired: boolean
  error: string | null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get("domain")

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

    const sslData = await getSSLCertificate(cleanDomain)
    return NextResponse.json(sslData)
  } catch (error) {
    console.error("[v0] SSL check error:", error)
    return NextResponse.json(
      {
        domain: "unknown",
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        expired: false,
        error: "Unable to fetch SSL certificate. Domain may not have HTTPS or be unreachable.",
      },
      { status: 500 },
    )
  }
}

async function getSSLCertificate(domain: string): Promise<SSLCertificate> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: domain, port: 443 }, () => {
      const tlsSocket = tls.connect(
        {
          host: domain,
          socket: socket,
          servername: domain,
          rejectUnauthorized: false,
        },
        () => {
          const cert = tlsSocket.getPeerCertificate()

          if (!cert || !cert.valid_from || !cert.valid_to) {
            tlsSocket.destroy()
            resolve({
              domain,
              validFrom: null,
              validTo: null,
              daysRemaining: null,
              expired: false,
              error: "Unable to retrieve SSL certificate details",
            })
            return
          }

          const validFrom = new Date(cert.valid_from)
          const validTo = new Date(cert.valid_to)
          const now = new Date()
          const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          const expired = now > validTo

          tlsSocket.destroy()

          resolve({
            domain,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            daysRemaining,
            expired,
            error: null,
          })
        },
      )

      tlsSocket.on("error", (err) => {
        socket.destroy()
        tlsSocket.destroy()
        resolve({
          domain,
          validFrom: null,
          validTo: null,
          daysRemaining: null,
          expired: false,
          error: `SSL error: ${err.message}`,
        })
      })
    })

    socket.on("error", (err) => {
      socket.destroy()
      resolve({
        domain,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        expired: false,
        error: `Connection error: ${err.message}`,
      })
    })

    // 10 second timeout
    socket.setTimeout(10000, () => {
      socket.destroy()
      resolve({
        domain,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        expired: false,
        error: "SSL check timeout",
      })
    })
  })
}
