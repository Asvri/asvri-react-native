"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchReturn = matchReturn;
exports.isExternalScheme = isExternalScheme;
exports.checkHttpUrl = checkHttpUrl;
// a small URL parser: React Native's URL implementation is incomplete on some versions, so this one is used instead
function parse(raw) {
    const m = /^([a-z][a-z0-9+.-]*):\/\/([^/?#:]*)(?::(\d+))?([^?#]*)(?:\?([^#]*))?/i.exec(raw.trim());
    if (!m)
        return null;
    const scheme = m[1].toLowerCase();
    const port = m[3] ?? (scheme === "https" ? "443" : scheme === "http" ? "80" : "");
    let path = m[4] || "/";
    if (path.length > 1 && path.endsWith("/"))
        path = path.slice(0, -1);
    const query = new Map();
    for (const part of (m[5] ?? "").split("&")) {
        if (!part)
            continue;
        const i = part.indexOf("=");
        const dec = (s) => { try {
            return decodeURIComponent(s.replace(/\+/g, " "));
        }
        catch {
            return s;
        } };
        query.set(dec(i < 0 ? part : part.slice(0, i)), dec(i < 0 ? "" : part.slice(i + 1)));
    }
    return { scheme, host: m[2].toLowerCase(), port, path, query };
}
const SESSION_ID = /^cs_(test|live)_[a-f0-9]+$/;
/**
 * Whether `url` is one of the checkout's return addresses: completed (success URL), cancelled (cancel URL) or null
 * (any other page: ASVRI's, a gateway's, 3-D Secure). A return address matches on scheme, host, port and path, and the
 * URL must carry the return address's own query parameters; ASVRI adds session_id.
 */
function matchReturn(url, successUrl, cancelUrl) {
    const u = parse(url);
    if (!u)
        return null;
    const same = (target) => {
        const t = target ? parse(target) : null;
        return !!t && u.scheme === t.scheme && u.host === t.host && u.port === t.port && u.path === t.path && [...t.query].every(([k, v]) => u.query.get(k) === v);
    };
    const id = u.query.get("session_id");
    const sessionId = id && SESSION_ID.test(id) ? id : null;
    if (same(successUrl))
        return { status: "completed", sessionId, url };
    if (same(cancelUrl))
        return { status: "cancelled", sessionId, url };
    return null;
}
/** Links ASVRI's checkout may hand to another app (a bank app, USSD, a wallet): anything that isn't a web page. */
function isExternalScheme(url) {
    const m = /^([a-z][a-z0-9+.-]*):/i.exec(url);
    if (!m)
        return false;
    return !["http", "https", "about", "data", "blob"].includes(m[1].toLowerCase());
}
function checkHttpUrl(value, name) {
    const u = parse(value);
    if (!u || (u.scheme !== "http" && u.scheme !== "https") || !u.host)
        throw new Error(`${name} must be a full http(s) URL`);
    return value;
}
