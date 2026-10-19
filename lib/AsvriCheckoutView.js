"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsvriCheckoutView = AsvriCheckoutView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_webview_1 = require("react-native-webview");
const result_1 = require("./result");
/**
 * ASVRI's payment page in a WebView, with a close button. Calls onResult as soon as the page heads for the success or
 * cancel URL (that page itself is never loaded in the app); links to bank apps, USSD and wallets open outside.
 */
function AsvriCheckoutView({ checkoutUrl, successUrl, cancelUrl, onResult, title = "Secure payment", accentColor = "#e6007e" }) {
    const done = (0, react_1.useRef)(false);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const finish = (0, react_1.useCallback)((result) => {
        if (done.current)
            return;
        done.current = true;
        onResult(result);
    }, [onResult]);
    const decide = (0, react_1.useCallback)((req) => {
        const result = (0, result_1.matchReturn)(req.url, successUrl, cancelUrl);
        if (result) {
            finish(result);
            return false;
        }
        if ((0, result_1.isExternalScheme)(req.url)) {
            react_native_1.Linking.openURL(req.url).catch(() => { });
            return false;
        }
        return true;
    }, [successUrl, cancelUrl, finish]);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.screen, testID: "asvri-checkout", children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: "Close", testID: "asvri-close", hitSlop: 12, onPress: () => finish({ status: "dismissed", sessionId: null, url: null }), style: styles.close, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.closeText, children: "\u2715" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.title, numberOfLines: 1, children: ["\uD83D\uDD12 ", title] }), loading ? (0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { testID: "asvri-loading", size: "small", color: accentColor }) : (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.spacer })] }), (0, jsx_runtime_1.jsx)(react_native_webview_1.WebView, { testID: "asvri-webview", source: { uri: checkoutUrl }, originWhitelist: ["*"], onShouldStartLoadWithRequest: decide, onLoadStart: () => setLoading(true), onLoadEnd: () => setLoading(false), javaScriptEnabled: true, domStorageEnabled: true, setSupportMultipleWindows: false, startInLoadingState: false, style: styles.webview })] }));
}
const styles = react_native_1.StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#fff" },
    header: { height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderBottomWidth: react_native_1.StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
    close: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
    closeText: { fontSize: 18, color: "#111827" },
    title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "600", color: "#111827" },
    spacer: { width: 20 },
    webview: { flex: 1 },
});
