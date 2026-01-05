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
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[project]/app/api/ssl/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$tls__$5b$external$5d$__$28$tls$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/tls [external] (tls, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$net__$5b$external$5d$__$28$net$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/net [external] (net, cjs)");
;
;
;
async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const domain = searchParams.get("domain");
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
        const sslData = await getSSLCertificate(cleanDomain);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(sslData);
    } catch (error) {
        console.error("[v0] SSL check error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            domain: "unknown",
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            expired: false,
            error: "Unable to fetch SSL certificate. Domain may not have HTTPS or be unreachable."
        }, {
            status: 500
        });
    }
}
async function getSSLCertificate(domain) {
    return new Promise((resolve, reject)=>{
        const socket = __TURBOPACK__imported__module__$5b$externals$5d2f$net__$5b$external$5d$__$28$net$2c$__cjs$29$__["createConnection"]({
            host: domain,
            port: 443
        }, ()=>{
            const tlsSocket = __TURBOPACK__imported__module__$5b$externals$5d2f$tls__$5b$external$5d$__$28$tls$2c$__cjs$29$__["connect"]({
                host: domain,
                socket: socket,
                servername: domain,
                rejectUnauthorized: false
            }, ()=>{
                const cert = tlsSocket.getPeerCertificate();
                if (!cert || !cert.valid_from || !cert.valid_to) {
                    tlsSocket.destroy();
                    resolve({
                        domain,
                        validFrom: null,
                        validTo: null,
                        daysRemaining: null,
                        expired: false,
                        error: "Unable to retrieve SSL certificate details"
                    });
                    return;
                }
                const validFrom = new Date(cert.valid_from);
                const validTo = new Date(cert.valid_to);
                const now = new Date();
                const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const expired = now > validTo;
                tlsSocket.destroy();
                resolve({
                    domain,
                    validFrom: validFrom.toISOString(),
                    validTo: validTo.toISOString(),
                    daysRemaining,
                    expired,
                    error: null
                });
            });
            tlsSocket.on("error", (err)=>{
                socket.destroy();
                tlsSocket.destroy();
                resolve({
                    domain,
                    validFrom: null,
                    validTo: null,
                    daysRemaining: null,
                    expired: false,
                    error: `SSL error: ${err.message}`
                });
            });
        });
        socket.on("error", (err)=>{
            socket.destroy();
            resolve({
                domain,
                validFrom: null,
                validTo: null,
                daysRemaining: null,
                expired: false,
                error: `Connection error: ${err.message}`
            });
        });
        // 10 second timeout
        socket.setTimeout(10000, ()=>{
            socket.destroy();
            resolve({
                domain,
                validFrom: null,
                validTo: null,
                daysRemaining: null,
                expired: false,
                error: "SSL check timeout"
            });
        });
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bc8c285e._.js.map