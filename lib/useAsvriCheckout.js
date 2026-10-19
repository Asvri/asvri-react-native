"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAsvriCheckout = useAsvriCheckout;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const AsvriCheckoutView_1 = require("./AsvriCheckoutView");
const result_1 = require("./result");
/**
 * ASVRI Checkout as a promise. Render `checkout` once (anywhere in the screen), then `await open(...)`:
 *
 *   const { open, checkout } = useAsvriCheckout()
 *   const result = await open({ checkoutUrl: s.url, successUrl: s.success_url, cancelUrl: s.cancel_url })
 *   return <>{…}{checkout}</>
 *
 * The secret key stays on your server: it creates the session and gives the app these three URLs.
 */
function useAsvriCheckout() {
    const [current, setCurrent] = (0, react_1.useState)(null);
    const resolver = (0, react_1.useRef)(null);
    const settle = (0, react_1.useCallback)((result) => {
        const resolve = resolver.current;
        resolver.current = null;
        setCurrent(null);
        resolve?.(result);
    }, []);
    const open = (0, react_1.useCallback)((options) => {
        (0, result_1.checkHttpUrl)(options.checkoutUrl, "checkoutUrl");
        (0, result_1.checkHttpUrl)(options.successUrl, "successUrl");
        if (options.cancelUrl)
            (0, result_1.checkHttpUrl)(options.cancelUrl, "cancelUrl");
        // a second open() while one is showing ends the first as dismissed
        resolver.current?.({ status: "dismissed", sessionId: null, url: null });
        return new Promise((resolve) => {
            resolver.current = resolve;
            setCurrent(options);
        });
    }, []);
    const checkout = current ? ((0, jsx_runtime_1.jsx)(react_native_1.Modal, { visible: true, testID: "asvri-modal", animationType: "slide", presentationStyle: "fullScreen", onRequestClose: () => settle({ status: "dismissed", sessionId: null, url: null }), children: (0, jsx_runtime_1.jsx)(react_native_1.SafeAreaView, { style: styles.fill, children: (0, jsx_runtime_1.jsx)(AsvriCheckoutView_1.AsvriCheckoutView, { checkoutUrl: current.checkoutUrl, successUrl: current.successUrl, cancelUrl: current.cancelUrl, title: current.title, onResult: settle }) }) })) : null;
    return { open, checkout, isOpen: current !== null };
}
const styles = react_native_1.StyleSheet.create({ fill: { flex: 1, backgroundColor: "#fff" } });
