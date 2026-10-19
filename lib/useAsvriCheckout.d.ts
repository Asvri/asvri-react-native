import { type ReactElement } from "react";
import { type AsvriCheckoutResult } from "./result";
export interface OpenCheckoutOptions {
    /** The session's url, from your server. */
    checkoutUrl: string;
    /** The session's success_url. */
    successUrl: string;
    /** The session's cancel_url. */
    cancelUrl?: string | null;
    title?: string;
}
/**
 * ASVRI Checkout as a promise. Render `checkout` once (anywhere in the screen), then `await open(...)`:
 *
 *   const { open, checkout } = useAsvriCheckout()
 *   const result = await open({ checkoutUrl: s.url, successUrl: s.success_url, cancelUrl: s.cancel_url })
 *   return <>{…}{checkout}</>
 *
 * The secret key stays on your server: it creates the session and gives the app these three URLs.
 */
export declare function useAsvriCheckout(): {
    open: (options: OpenCheckoutOptions) => Promise<AsvriCheckoutResult>;
    checkout: ReactElement | null;
    isOpen: boolean;
};
