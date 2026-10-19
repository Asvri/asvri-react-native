import { useCallback, useRef, useState, type ReactElement } from "react"
import { Modal, SafeAreaView, StyleSheet } from "react-native"
import { AsvriCheckoutView } from "./AsvriCheckoutView"
import { type AsvriCheckoutResult, checkHttpUrl } from "./result"

export interface OpenCheckoutOptions {
  /** The session's url, from your server. */
  checkoutUrl: string
  /** The session's success_url. */
  successUrl: string
  /** The session's cancel_url. */
  cancelUrl?: string | null
  title?: string
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
export function useAsvriCheckout(): { open: (options: OpenCheckoutOptions) => Promise<AsvriCheckoutResult>; checkout: ReactElement | null; isOpen: boolean } {
  const [current, setCurrent] = useState<OpenCheckoutOptions | null>(null)
  const resolver = useRef<((r: AsvriCheckoutResult) => void) | null>(null)

  const settle = useCallback((result: AsvriCheckoutResult) => {
    const resolve = resolver.current
    resolver.current = null
    setCurrent(null)
    resolve?.(result)
  }, [])

  const open = useCallback((options: OpenCheckoutOptions) => {
    checkHttpUrl(options.checkoutUrl, "checkoutUrl")
    checkHttpUrl(options.successUrl, "successUrl")
    if (options.cancelUrl) checkHttpUrl(options.cancelUrl, "cancelUrl")
    // a second open() while one is showing ends the first as dismissed
    resolver.current?.({ status: "dismissed", sessionId: null, url: null })
    return new Promise<AsvriCheckoutResult>((resolve) => {
      resolver.current = resolve
      setCurrent(options)
    })
  }, [])

  const checkout = current ? (
    <Modal visible testID="asvri-modal" animationType="slide" presentationStyle="fullScreen"
      onRequestClose={() => settle({ status: "dismissed", sessionId: null, url: null })}>
      <SafeAreaView style={styles.fill}>
        <AsvriCheckoutView checkoutUrl={current.checkoutUrl} successUrl={current.successUrl} cancelUrl={current.cancelUrl}
          title={current.title} onResult={settle} />
      </SafeAreaView>
    </Modal>
  ) : null

  return { open, checkout, isOpen: current !== null }
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: "#fff" } })
