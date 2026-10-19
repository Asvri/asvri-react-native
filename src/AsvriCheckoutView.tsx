import { useCallback, useRef, useState } from "react"
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { WebView } from "react-native-webview"
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes"
import { type AsvriCheckoutResult, isExternalScheme, matchReturn } from "./result"

export interface AsvriCheckoutViewProps {
  /** The session's url, from your server. */
  checkoutUrl: string
  /** The session's success_url. */
  successUrl: string
  /** The session's cancel_url. */
  cancelUrl?: string | null
  /** Called once, when the customer pays, cancels or closes. */
  onResult: (result: AsvriCheckoutResult) => void
  title?: string
  /** Header and progress colour. Default ASVRI pink. */
  accentColor?: string
}

/**
 * ASVRI's payment page in a WebView, with a close button. Calls onResult as soon as the page heads for the success or
 * cancel URL (that page itself is never loaded in the app); links to bank apps, USSD and wallets open outside.
 */
export function AsvriCheckoutView({ checkoutUrl, successUrl, cancelUrl, onResult, title = "Secure payment", accentColor = "#e6007e" }: AsvriCheckoutViewProps) {
  const done = useRef(false)
  const [loading, setLoading] = useState(true)

  const finish = useCallback((result: AsvriCheckoutResult) => {
    if (done.current) return
    done.current = true
    onResult(result)
  }, [onResult])

  const decide = useCallback((req: ShouldStartLoadRequest) => {
    const result = matchReturn(req.url, successUrl, cancelUrl)
    if (result) {
      finish(result)
      return false
    }
    if (isExternalScheme(req.url)) {
      Linking.openURL(req.url).catch(() => {})
      return false
    }
    return true
  }, [successUrl, cancelUrl, finish])

  return (
    <View style={styles.screen} testID="asvri-checkout">
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" testID="asvri-close" hitSlop={12}
          onPress={() => finish({ status: "dismissed", sessionId: null, url: null })} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>🔒 {title}</Text>
        {loading ? <ActivityIndicator testID="asvri-loading" size="small" color={accentColor} /> : <View style={styles.spacer} />}
      </View>
      <WebView
        testID="asvri-webview"
        source={{ uri: checkoutUrl }}
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={decide}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        startInLoadingState={false}
        style={styles.webview}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  header: { height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  close: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 18, color: "#111827" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "600", color: "#111827" },
  spacer: { width: 20 },
  webview: { flex: 1 },
})
