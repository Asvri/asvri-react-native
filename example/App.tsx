// A shop screen that pays with ASVRI Checkout. Your server makes the session (secret key stays there):
//   POST {BACKEND}/checkout          -> {"url": …, "success_url": …, "cancel_url": …}
//   GET  {BACKEND}/status?session_id -> {"status": "paid" | "open" | "expired"}
// Install: npm install github:asvri/asvri-react-native react-native-webview
import { useState } from "react"
import { Button, SafeAreaView, StyleSheet, Text, View } from "react-native"
import { useAsvriCheckout } from "@asvri/react-native"

const BACKEND = "http://10.0.2.2:8098" // the Android emulator's address for your computer; use your server in production

export default function App() {
  const { open, checkout } = useAsvriCheckout()
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  async function pay() {
    setBusy(true)
    setMessage("")
    try {
      const res = await fetch(`${BACKEND}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: "1042" }) })
      if (!res.ok) throw new Error(`Checkout could not start (${res.status}).`)
      const s = await res.json()
      const result = await open({ checkoutUrl: s.url, successUrl: s.success_url, cancelUrl: s.cancel_url })
      if (result.status === "completed" && result.sessionId) {
        // ask YOUR server, which asks ASVRI: the app's own word isn't proof of payment
        const status = (await (await fetch(`${BACKEND}/status?session_id=${result.sessionId}`)).json()).status
        setMessage(status === "paid" ? `Paid. Thank you! (${result.sessionId})` : `Payment ${status}.`)
      } else {
        setMessage(result.status === "cancelled" ? "Payment cancelled." : "Payment not finished.")
      }
    } catch (e) {
      setMessage(String(e instanceof Error ? e.message : e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.name}>Tote bag</Text>
        <Text>$25</Text>
        <View style={styles.button}><Button title={busy ? "Opening…" : "Pay $25"} onPress={pay} disabled={busy} /></View>
        <Text testID="message">{message}</Text>
      </View>
      {checkout}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  body: { padding: 24 },
  name: { fontSize: 22, fontWeight: "bold" },
  button: { marginVertical: 16, alignSelf: "flex-start" },
})
