/** How the customer left ASVRI's payment page. */
export type AsvriCheckoutStatus = 
/** ASVRI sent them to your success URL. Confirm the payment on your server before you deliver. */
"completed"
/** They chose to go back (ASVRI sent them to your cancel URL). */
 | "cancelled"
/** They closed the payment screen themselves. */
 | "dismissed";
export interface AsvriCheckoutResult {
    status: AsvriCheckoutStatus;
    /** The checkout session id (cs_test_… / cs_live_…) ASVRI added to the return URL, when there is one. */
    sessionId: string | null;
    /** The address that ended the checkout. */
    url: string | null;
}
/**
 * Whether `url` is one of the checkout's return addresses: completed (success URL), cancelled (cancel URL) or null
 * (any other page: ASVRI's, a gateway's, 3-D Secure). A return address matches on scheme, host, port and path, and the
 * URL must carry the return address's own query parameters; ASVRI adds session_id.
 */
export declare function matchReturn(url: string, successUrl: string, cancelUrl?: string | null): AsvriCheckoutResult | null;
/** Links ASVRI's checkout may hand to another app (a bank app, USSD, a wallet): anything that isn't a web page. */
export declare function isExternalScheme(url: string): boolean;
export declare function checkHttpUrl(value: string, name: string): string;
