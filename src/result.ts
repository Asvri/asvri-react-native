/** How the customer left ASVRI's payment page. */
export type AsvriCheckoutStatus =
  /** ASVRI sent them to your success URL. Confirm the payment on your server before you deliver. */
  | "completed"
  /** They chose to go back (ASVRI sent them to your cancel URL). */
  | "cancelled"
  /** They closed the payment screen themselves. */
  | "dismissed"

export interface AsvriCheckoutResult {
  status: AsvriCheckoutStatus
  /** The checkout session id (cs_test_… / cs_live_…) ASVRI added to the return URL, when there is one. */
  sessionId: string | null
  /** The address that ended the checkout. */
  url: string | null
}

interface Parsed {
  scheme: string
  host: string
  port: string
  path: string
  query: Map<string, string>
}

// a small URL parser: React Native's URL implementation is incomplete on some versions, so this one is used instead
function parse(raw: string): Parsed | null {
  const m = /^([a-z][a-z0-9+.-]*):\/\/([^/?#:]*)(?::(\d+))?([^?#]*)(?:\?([^#]*))?/i.exec(raw.trim())
  if (!m) return null
  const scheme = m[1].toLowerCase()
  const port = m[3] ?? (scheme === "https" ? "443" : scheme === "http" ? "80" : "")
  let path = m[4] || "/"
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
  const query = new Map<string, string>()
  for (const part of (m[5] ?? "").split("&")) {
    if (!part) continue
    const i = part.indexOf("=")
    const dec = (s: string) => { try { return decodeURIComponent(s.replace(/\+/g, " ")) } catch { return s } }
    query.set(dec(i < 0 ? part : part.slice(0, i)), dec(i < 0 ? "" : part.slice(i + 1)))
  }
  return { scheme, host: m[2].toLowerCase(), port, path, query }
}

const SESSION_ID = /^cs_(test|live)_[a-f0-9]+$/

/**
 * Whether `url` is one of the checkout's return addresses: completed (success URL), cancelled (cancel URL) or null
 * (any other page: ASVRI's, a gateway's, 3-D Secure). A return address matches on scheme, host, port and path, and the
 * URL must carry the return address's own query parameters; ASVRI adds session_id.
 */
export function matchReturn(url: string, successUrl: string, cancelUrl?: string | null): AsvriCheckoutResult | null {
  const u = parse(url)
  if (!u) return null
  const same = (target: string | null | undefined) => {
    const t = target ? parse(target) : null
    return !!t && u.scheme === t.scheme && u.host === t.host && u.port === t.port && u.path === t.path && [...t.query].every(([k, v]) => u.query.get(k) === v)
  }
  const id = u.query.get("session_id")
  const sessionId = id && SESSION_ID.test(id) ? id : null
  if (same(successUrl)) return { status: "completed", sessionId, url }
  if (same(cancelUrl)) return { status: "cancelled", sessionId, url }
  return null
}

/** Links ASVRI's checkout may hand to another app (a bank app, USSD, a wallet): anything that isn't a web page. */
export function isExternalScheme(url: string): boolean {
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(url)
  if (!m) return false
  return !["http", "https", "about", "data", "blob"].includes(m[1].toLowerCase())
}

export function checkHttpUrl(value: string, name: string): string {
  const u = parse(value)
  if (!u || (u.scheme !== "http" && u.scheme !== "https") || !u.host) throw new Error(`${name} must be a full http(s) URL`)
  return value
}
