import { DomainChecker } from "@/components/domain-checker"
import { BrokenLinksChecker } from "@/components/broken-links-checker"
import { Globe, Link2, Shield } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header with JR Logo */}
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                JR
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">JR Tools</h1>
                <p className="text-xs text-muted-foreground">Web Intelligence Platform</p>
              </div>
            </div>

            {/* Navigation would go here */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#domain" className="hover:text-foreground transition">
                Domain Checker
              </a>
              <a href="#links" className="hover:text-foreground transition">
                Link Checker
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Web Intelligence Tools</h2>
          <p className="text-lg text-muted-foreground">
            Monitor your domains, check SSL certificates, and validate website links in real-time.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Domain Checker Card */}
          <div id="domain" className="lg:col-span-1 leading-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Domain Expiry Checker</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Check domain expiration dates, WHOIS information, and SSL certificate status instantly.
                </p>
              </div>
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <DomainChecker />
              </div>
            </div>
          </div>

          {/* Broken Links Checker Card */}
          <div id="links" className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Link2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Broken Links Checker</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Scan websites for broken links, dead URLs, and redirect issues. Keep your site healthy.
                </p>
              </div>
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <BrokenLinksChecker />
              </div>
            </div>
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
      <footer className="border-t border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-3">JR Tools</h4>
              <p className="text-sm text-muted-foreground">
                Web intelligence platform for developers and domain managers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <a href="#domain" className="hover:text-foreground transition">
                    Domain Checker
                  </a>
                </li>
                <li>
                  <a href="#links" className="hover:text-foreground transition">
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
