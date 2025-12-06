import { DomainChecker } from "@/components/domain-checker"
import { CheckCircle2 } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 dark:to-slate-950">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Domain Expiry Checker</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Check domain expiration dates, WHOIS information, and SSL certificate status instantly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <DomainChecker />
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-6 text-center text-sm text-muted-foreground">
        <p>Powered by WHOIS API & SSL Certificate Checking. Comprehensive domain intelligence at your fingertips.</p>
      </footer>
    </main>
  )
}
