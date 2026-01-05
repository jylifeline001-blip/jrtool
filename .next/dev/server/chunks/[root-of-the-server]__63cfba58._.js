module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/jsdom [external] (jsdom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("jsdom", () => require("jsdom"));

module.exports = mod;
}),
"[project]/app/api/health-check/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "maxDuration",
    ()=>maxDuration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$jsdom__$5b$external$5d$__$28$jsdom$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/jsdom [external] (jsdom, cjs)");
;
;
const maxDuration = 60 // Allow longer timeout for crawling
;
// Simple internal categorization for issues
const getIssueType = (issues)=>{
    if (issues.some((i)=>i.toLowerCase().includes("security") || i.toLowerCase().includes("hacked") || i.toLowerCase().includes("malware"))) return "Security";
    if (issues.some((i)=>i.toLowerCase().includes("css") || i.toLowerCase().includes("content"))) return "CSS" // or Content
    ;
    if (issues.some((i)=>i.toLowerCase().includes("slow") || i.toLowerCase().includes("time"))) return "Speed";
    return undefined;
};
async function checkUrl(url, isMain = false) {
    const issues = [];
    let status = "healthy";
    let statusCode = 0;
    const start = performance.now();
    try {
        const controller = new AbortController();
        // Timeout 10s for individual page
        const timeout = setTimeout(()=>controller.abort(), 10000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; JRTools-WebsiteHealthChecker/1.0)"
            }
        });
        clearTimeout(timeout);
        const loadTime = Math.round(performance.now() - start);
        statusCode = res.status;
        if (!res.ok) {
            status = "error";
            issues.push(`HTTP Status ${res.status}`);
        } else {
            // Check for redirects
            if (res.redirected) {
                const origin = new URL(url).origin;
                const finalOrigin = new URL(res.url).origin;
                if (origin !== finalOrigin) {
                    status = "warning";
                    issues.push(`Redirected to external domain: ${finalOrigin}`);
                }
            }
        }
        // Speed Check
        if (loadTime > 3000) {
            if (status !== "error") status = "warning";
            issues.push(`Slow load time: ${(loadTime / 1000).toFixed(2)}s`);
        }
        // HTTPS Check
        if (url.startsWith("http://")) {
            status = "warning";
            issues.push("Not using HTTPS");
        }
        let htmlContent = "";
        // Deep checks: CSS, Content, Security
        if (res.ok) {
            const text = await res.text();
            htmlContent = text;
            const lowerText = text.toLowerCase();
            // 1. Content Check
            if (text.length < 500) {
                status = "warning";
                issues.push("Page content is suspiciously short (< 500 chars)");
            }
            // 2. Security Checks (Heuristic)
            if (lowerText.includes("hacked by") || lowerText.includes("0wn3d")) {
                status = "error";
                issues.push("Potential defacement text found");
            }
            // Check for specific malicious patterns (common in WP hacks)
            if (text.match(/<script[^>]*>[\s\S]*?eval\s*\(/i)) {
                status = "warning";
                issues.push("Suspicious 'eval' in script tags");
            }
            // 3. CSS availability
            // While we are parsing, let's extract CSS links
            const dom = new __TURBOPACK__imported__module__$5b$externals$5d2f$jsdom__$5b$external$5d$__$28$jsdom$2c$__cjs$29$__["JSDOM"](text);
            const doc = dom.window.document;
            const links = Array.from(doc.querySelectorAll("link[rel='stylesheet']"));
            // Check first 3 CSS files to see if they are reachable (head request)
            // Check max 3 to avoid hanging
            let cssBroken = false;
            const cssChecks = links.slice(0, 3).map(async (link)=>{
                const cssHref = link.href;
                if (!cssHref) return;
                try {
                    const fullCssUrl = new URL(cssHref, url).href;
                    const cssRes = await fetch(fullCssUrl, {
                        method: "HEAD",
                        signal: AbortSignal.timeout(3000)
                    });
                    if (!cssRes.ok) return {
                        url: fullCssUrl,
                        status: cssRes.status
                    };
                } catch (e) {
                    return {
                        url: cssHref,
                        error: true
                    };
                }
            });
            const cssResults = await Promise.all(cssChecks);
            cssResults.forEach((r)=>{
                if (r) {
                    status = "warning";
                    issues.push(`Broken CSS: ${r.url} (${r.status || 'Error'})`);
                    cssBroken = true;
                }
            });
        }
        return {
            url,
            status,
            statusCode,
            loadTime,
            issues,
            issueType: getIssueType(issues),
            html: htmlContent
        };
    } catch (error) {
        return {
            url,
            status: "error",
            statusCode: 0,
            loadTime: Math.round(performance.now() - start),
            issues: [
                `Unreachable: ${error.message}`
            ]
        };
    }
}
// Function to fetch sitemap and return URLs
async function fetchSitemap(baseUrl) {
    try {
        const sitemapUrl = new URL("/sitemap.xml", baseUrl).href;
        const res = await fetch(sitemapUrl, {
            signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) return [];
        const text = await res.text();
        // Simple regex to extract <loc> URLs
        const regex = /<loc>(.*?)<\/loc>/g;
        const urls = [];
        let match;
        while((match = regex.exec(text)) !== null){
            const foundUrl = match[1].trim();
            // If it's a sitemap index (nested sitemap), we might want to fetch it too, but for speed we'll just ignore or add it if it looks like a page.
            // A better check is to see if it ends in .xml
            if (foundUrl.endsWith(".xml")) {
                // It's likely a sitemap index. For V0 demo, we might skip deep recursion or just try to fetch this one too.
                // Let's try to fetch one level deep.
                try {
                    const subRes = await fetch(foundUrl, {
                        signal: AbortSignal.timeout(3000)
                    });
                    if (subRes.ok) {
                        const subText = await subRes.text();
                        let subMatch;
                        while((subMatch = regex.exec(subText)) !== null){
                            urls.push(subMatch[1].trim());
                        }
                    }
                } catch  {}
            } else {
                urls.push(foundUrl);
            }
        }
        return urls;
    } catch  {
        return [];
    }
}
// Crawler BFS
async function crawlWebsite(startUrl, maxPages = 30) {
    const visited = new Set();
    const queue = [
        startUrl
    ];
    const foundUrls = [];
    const baseOrigin = new URL(startUrl).origin;
    visited.add(startUrl);
    while(queue.length > 0 && foundUrls.length < maxPages){
        const currentUrl = queue.shift();
        // foundUrls should only contain unique verified links, but we add them as we pop from queue to avoid duplicates in scanning
        // actually, we should track what we intend to scan.
        foundUrls.push(currentUrl);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(()=>controller.abort(), 8000) // Increase timeout for crawling
            ;
            const res = await fetch(currentUrl, {
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; JRTools-WebsiteHealthChecker/1.0)"
                }
            });
            clearTimeout(timeout);
            if (res.ok && res.headers.get("content-type")?.includes("text/html")) {
                const text = await res.text();
                // Use JSDOM for robust link parsing
                const dom = new __TURBOPACK__imported__module__$5b$externals$5d2f$jsdom__$5b$external$5d$__$28$jsdom$2c$__cjs$29$__["JSDOM"](text);
                const doc = dom.window.document;
                const anchors = Array.from(doc.querySelectorAll("a"));
                for (const a of anchors){
                    const href = a.href || a.getAttribute("href") // JSDOM might not resolve .href to absolute completely in this context without a base URL in constructor, but let's try
                    ;
                    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) continue;
                    try {
                        const fullUrl = new URL(href, currentUrl).href;
                        // Strict internal link check
                        if (new URL(fullUrl).origin === baseOrigin && !visited.has(fullUrl)) {
                            // Filter files
                            if (!fullUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|css|js|xml|json|svg)$/i)) {
                                visited.add(fullUrl);
                                queue.push(fullUrl);
                            }
                        }
                    } catch  {}
                }
            }
        } catch  {}
        // Yield to event loop
        await new Promise((r)=>setTimeout(r, 50));
    }
    return foundUrls;
}
async function POST(req) {
    try {
        const { url } = await req.json();
        if (!url) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "URL is required"
            }, {
                status: 400
            });
        }
        let targetUrl = url.trim();
        if (!targetUrl.startsWith("http")) {
            targetUrl = `https://${targetUrl}`;
        }
        // Attempt to discover pages
        // 1. Sitemap
        let pageUrls = await fetchSitemap(targetUrl);
        // 2. Crawl if no sitemap or very few pages (heuristic: if sitemap has < 5 pages, it might be incomplete or just a sitemap index that failed)
        // We combine results if sitemap is small
        if (pageUrls.length < 5) {
            const crawledUrls = await crawlWebsite(targetUrl, 25);
            // Merge and dedupe
            pageUrls = Array.from(new Set([
                ...pageUrls,
                ...crawledUrls
            ]));
        } else {
            // Limit large sitemaps
            if (pageUrls.length > 50) pageUrls = pageUrls.slice(0, 50);
        }
        // Ensure main page is included
        if (!pageUrls.includes(targetUrl) && !pageUrls.some((u)=>u.includes(targetUrl.replace(/^https?:\/\//, '')))) {
            pageUrls.unshift(targetUrl);
        }
        // Remove duplicates again just in case
        pageUrls = Array.from(new Set(pageUrls));
        // Valid Limit to prevent timeout
        if (pageUrls.length > 30) pageUrls = pageUrls.slice(0, 30);
        // PERFORM CHECKS
        const results = [];
        const batchSize = 5;
        for(let i = 0; i < pageUrls.length; i += batchSize){
            const batch = pageUrls.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map((u)=>checkUrl(u)));
            // Remove the internal 'html' prop before sending
            batchResults.forEach((r)=>{
                delete r.html;
            });
            results.push(...batchResults);
        }
        // Final stats
        const totalPages = results.length;
        const errors = results.filter((r)=>r.status === "error").length;
        const slow = results.filter((r)=>r.loadTime > 3000).length;
        const security = results.filter((r)=>r.issues.some((i)=>i.toLowerCase().includes("security") || i.toLowerCase().includes("hacked"))).length;
        // Main result categorization
        const mainPageResult = results.find((r)=>r.url === targetUrl) || results[0];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            main: mainPageResult,
            pages: results,
            stats: {
                totalPages,
                errors,
                slow,
                security
            }
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__63cfba58._.js.map