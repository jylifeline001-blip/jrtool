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
"[project]/app/api/check-links/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
const maxDuration = 60;
async function fetchSitemap(baseUrl) {
    try {
        const sitemapUrl = new URL("/sitemap.xml", baseUrl).href;
        const res = await fetch(sitemapUrl, {
            signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) return [];
        const text = await res.text();
        const regex = /<loc>(.*?)<\/loc>/g;
        const urls = [];
        let match;
        while((match = regex.exec(text)) !== null){
            const foundUrl = match[1].trim();
            if (!foundUrl.endsWith(".xml") && !foundUrl.includes("/wp-admin/") && !foundUrl.includes("/login")) {
                urls.push(foundUrl);
            }
        }
        return urls;
    } catch  {
        return [];
    }
}
async function getLinksFromPage(url, baseOrigin) {
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return {
            url,
            links: []
        };
        const text = await res.text();
        const dom = new __TURBOPACK__imported__module__$5b$externals$5d2f$jsdom__$5b$external$5d$__$28$jsdom$2c$__cjs$29$__["JSDOM"](text, {
            url
        });
        const document = dom.window.document;
        const anchors = Array.from(document.querySelectorAll("a"));
        const links = anchors.map((a)=>a.href).filter((href)=>{
            if (!href || href === "#") return false;
            if (href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
            const lower = href.toLowerCase();
            if (lower.includes("/login") || lower.includes("/admin") || lower.includes("/wp-login") || lower.includes("/wp-admin")) return false;
            return true;
        }).map((href)=>{
            try {
                // Flatten URLs by removing fragments
                const urlObj = new URL(href, url);
                urlObj.hash = "";
                return urlObj.href;
            } catch  {
                return "";
            }
        }).filter((h)=>h !== "");
        return {
            url,
            links: Array.from(new Set(links))
        };
    } catch  {
        return {
            url,
            links: []
        };
    }
}
async function validateLink(url, foundOn) {
    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; BrokenLinkChecker/3.0; +https://jr-tools.com)"
            },
            signal: AbortSignal.timeout(10000),
            redirect: "follow"
        });
        const status = res.status;
        let isBroken = false;
        let errorType = "Clean";
        if (status === 404) {
            isBroken = true;
            errorType = "404 Not Found";
        } else if (status === 410) {
            isBroken = true;
            errorType = "410 Gone";
        } else if (status >= 500) {
            isBroken = true;
            errorType = `${status} Server Error`;
        } else if (status >= 200 && status < 400) {
            isBroken = false;
            errorType = "Clean";
        } else {
            isBroken = false;
            errorType = "Security/Blocked";
        }
        return {
            url,
            status,
            statusText: res.statusText || `HTTP ${status}`,
            isBroken,
            errorType,
            foundOn
        };
    } catch (error) {
        const errorMsg = error?.message?.toLowerCase() || "";
        let errorType = "Network Error";
        let isBroken = true;
        if (error.name === "AbortError" || errorMsg.includes("timeout")) {
            errorType = "Timeout";
        } else if (errorMsg.includes("enotfound") || errorMsg.includes("dns")) {
            errorType = "DNS Error";
        } else if (errorMsg.includes("cert") || errorMsg.includes("ssl") || errorMsg.includes("tls")) {
            errorType = "SSL Error";
        } else {
            isBroken = false;
        }
        return {
            url,
            status: 0,
            statusText: "Failed",
            isBroken,
            errorType,
            foundOn
        };
    }
}
async function POST(req) {
    try {
        const { url } = await req.json();
        if (!url) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "URL is required"
        }, {
            status: 400
        });
        let targetUrl = url.trim();
        if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`;
        const baseOrigin = new URL(targetUrl).origin;
        // 1. IMPROVED PAGE DISCOVERY
        let discoveredPages = new Set([
            targetUrl
        ]);
        // Try Sitemap first
        const sitemapPages = await fetchSitemap(targetUrl);
        sitemapPages.forEach((p)=>discoveredPages.add(p));
        // If sitemap is sparse, crawl home + 1 level
        if (discoveredPages.size < 5) {
            const homeData = await getLinksFromPage(targetUrl, baseOrigin);
            homeData.links.forEach((l)=>{
                if (l.startsWith(baseOrigin)) discoveredPages.add(l);
            });
        }
        // Limit crawl to 40 pages to stay within 60s timeout
        const pagesToCrawl = Array.from(discoveredPages).slice(0, 40);
        // 2. Multiphase extraction
        const pageResults = await Promise.all(pagesToCrawl.map((p)=>getLinksFromPage(p, baseOrigin)));
        const linkToPageMap = new Map();
        pageResults.forEach((p)=>{
            p.links.forEach((l)=>{
                if (!linkToPageMap.has(l)) linkToPageMap.set(l, p.url);
            });
        });
        const uniqueLinks = Array.from(linkToPageMap.keys()).slice(0, 200);
        // 3. Batch Validation
        const results = [];
        const BATCH_SIZE = 25;
        for(let i = 0; i < uniqueLinks.length; i += BATCH_SIZE){
            const batch = uniqueLinks.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map((l)=>validateLink(l, linkToPageMap.get(l))));
            results.push(...batchResults.filter((r)=>r.isBroken));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            totalPagesCrawled: pagesToCrawl.length,
            totalLinksChecked: uniqueLinks.length,
            results
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

//# sourceMappingURL=%5Broot-of-the-server%5D__3ddcf50f._.js.map