import { type AsvriCheckoutResult } from "./result";
export interface AsvriCheckoutViewProps {
    /** The session's url, from your server. */
    checkoutUrl: string;
    /** The session's success_url. */
    successUrl: string;
    /** The session's cancel_url. */
    cancelUrl?: string | null;
    /** Called once, when the customer pays, cancels or closes. */
    onResult: (result: AsvriCheckoutResult) => void;
    title?: string;
    /** Header and progress colour. Default ASVRI pink. */
    accentColor?: string;
}
/**
 * ASVRI's payment page in a WebView, with a close button. Calls onResult as soon as the page heads for the success or
 * cancel URL (that page itself is never loaded in the app); links to bank apps, USSD and wallets open outside.
 */
export declare function AsvriCheckoutView({ checkoutUrl, successUrl, cancelUrl, onResult, title, accentColor }: AsvriCheckoutViewProps): import("react").JSX.Element;
