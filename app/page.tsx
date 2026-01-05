import { DomainChecker } from "@/components/domain-checker"
import { BrokenLinksChecker } from "@/components/broken-links-checker"
import { Globe, Link2, Shield } from "lucide-react"

import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" suppressHydrationWarning>
      <SiteHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Web Intelligence Tool</h2>
          <p className="text-lg text-muted-foreground">
            Monitor your domains, check SSL certificates, and validate website links in real-time.
          </p>
        </div>

        {/* Tools Section */}
        <div className="space-y-16 mb-16">
          {/* Domain Checker Card */}
          <div id="domain" className="scroll-mt-24">
            <div className="bg-white/50 backdrop-blur-sm dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden shadow-indigo-500/5">
              <div className="p-6 sm:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Domain Expiry Checker</h3>
                    <p className="text-muted-foreground">Monitor domain expiration dates and WHOIS data in bulk.</p>
                  </div>
                </div>
                <DomainChecker />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <div className="p-2 bg-slate-50 rounded-full">
              <Link2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>

          {/* Broken Links Checker Card */}
          <div id="links" className="scroll-mt-24">
            <BrokenLinksChecker />
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-border text-center">
            <div className="inline-flex p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-2">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">Real-time Monitoring</h4>
            <p className="text-xs text-muted-foreground">Instant results for all your checks</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-border text-center">
            <div className="inline-flex p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mb-2">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">Secure & Private</h4>
            <p className="text-xs text-muted-foreground">Your data is never stored or shared</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-border text-center">
            <div className="inline-flex p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-2">
              <Link2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">Easy Integration</h4>
            <p className="text-xs text-muted-foreground">Lightweight and fast performance</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-12" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-3">JR Tools</h4>
              <p className="text-sm text-muted-foreground">
                Mayank Choudhary for developers and domain managers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <a href="#domain" className="hover:text-foreground transition" suppressHydrationWarning>
                    Domain Checker
                  </a>
                </li>
                <li>
                  <a href="#links" className="hover:text-foreground transition" suppressHydrationWarning>
                    Link Validator
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">About</h4>
              <p className="text-sm text-muted-foreground">Fast, reliable tools for modern web development.</p>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
            <p>© 2025 JR Tools. Built with precision and care.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
