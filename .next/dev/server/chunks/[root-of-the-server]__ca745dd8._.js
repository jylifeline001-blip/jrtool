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
"[project]/app/api/whois/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST(req) {
    try {
        const { domain } = await req.json();
        if (!domain || typeof domain !== "string") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Domain is required"
            }, {
                status: 400
            });
        }
        const cleanDomain = domain.replace(/https?:\/\//g, "").replace(/^www\./, "").split("/")[0].toLowerCase().trim();
        if (!cleanDomain || !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/.test(cleanDomain)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Invalid domain format"
            }, {
                status: 400
            });
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 10000);
        console.log("[v0] Fetching RDAP data for:", cleanDomain);
        // Try RDAP first (more reliable than WHOIS)
        const rdapUrl = `https://rdap.org/domain/${cleanDomain}`;
        const response = await fetch(rdapUrl, {
            method: "GET",
            signal: controller.signal,
            headers: {
                Accept: "application/rdap+json"
            }
        }).catch(()=>null);
        clearTimeout(timeoutId);
        if (!response || !response.ok) {
            console.log("[v0] RDAP lookup failed, trying whois.vu service");
            // Fallback to whois.vu
            const whoisController = new AbortController();
            const whoisTimeoutId = setTimeout(()=>whoisController.abort(), 10000);
            const whoisResponse = await fetch(`https://www.whois.vu/?domain=${encodeURIComponent(cleanDomain)}`, {
                signal: whoisController.signal
            });
            clearTimeout(whoisTimeoutId);
            if (!whoisResponse.ok) {
                throw new Error("Unable to fetch WHOIS data from any service");
            }
            // Parse HTML response from whois.vu
            const html = await whoisResponse.text();
            const data = parseWhoisHTML(html, cleanDomain);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
        }
        const data = await response.json();
        console.log("[v0] RDAP response received");
        // Parse RDAP response
        const parsedData = parseRDAPResponse(data, cleanDomain);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(parsedData);
    } catch (error) {
        console.error("[v0] WHOIS lookup error:", error);
        if (error instanceof Error) {
            if (error.name === "AbortError") {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Request timeout. Please try again."
                }, {
                    status: 504
                });
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Unable to fetch domain information. The domain may not exist or be restricted."
        }, {
            status: 500
        });
    }
}
function parseRDAPResponse(data, domain) {
    let expiryDate = null;
    let creationDate = null;
    let updatedDate = null;
    let registrar = null;
    const status = [];
    // Extract dates from RDAP events
    if (data.events && Array.isArray(data.events)) {
        for (const event of data.events){
            if (event.eventAction === "expiration") {
                expiryDate = event.eventDate;
            } else if (event.eventAction === "registration") {
                creationDate = event.eventDate;
            } else if (event.eventAction === "last changed") {
                updatedDate = event.eventDate;
            }
        }
    }
    // Extract registrar from entities
    if (data.entities && Array.isArray(data.entities)) {
        for (const entity of data.entities){
            if (entity.roles && entity.roles.includes("registrar") && entity.vcardArray) {
                registrar = extractVCardName(entity.vcardArray);
                break;
            }
        }
    }
    // Extract status
    if (data.status && Array.isArray(data.status)) {
        status.push(...data.status);
    }
    return {
        domain,
        expiryDate,
        creationDate,
        updatedDate,
        registrar,
        status
    };
}
function parseWhoisHTML(html, domain) {
    const result = {
        domain,
        expiryDate: null,
        creationDate: null,
        updatedDate: null,
        registrar: null,
        status: []
    };
    // Simple regex patterns to extract data
    const expiryMatch = html.match(/Expir[a-z]*\s*(?:Date)?[:\s]*([^<\n]+)/i);
    if (expiryMatch) {
        result.expiryDate = expiryMatch[1].trim();
    }
    const createdMatch = html.match(/Creat[a-z]*\s*(?:Date)?[:\s]*([^<\n]+)/i);
    if (createdMatch) {
        result.creationDate = createdMatch[1].trim();
    }
    const updatedMatch = html.match(/(?:Last\s+)?Updat[a-z]*\s*(?:Date)?[:\s]*([^<\n]+)/i);
    if (updatedMatch) {
        result.updatedDate = updatedMatch[1].trim();
    }
    const registrarMatch = html.match(/Registrar[:\s]*([^<\n]+)/i);
    if (registrarMatch) {
        result.registrar = registrarMatch[1].trim();
    }
    const statusMatch = html.match(/Status[:\s]*([^<\n]+)/i);
    if (statusMatch) {
        const statusStr = statusMatch[1].trim();
        result.status = statusStr.split(/[,;]/).map((s)=>s.trim());
    }
    return result;
}
// Helper to extract name from vCard
function extractVCardName(vcard) {
    for (const prop of vcard){
        if (prop[0] === "fn") {
            return prop[3];
        }
    }
    return null;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ca745dd8._.js.map