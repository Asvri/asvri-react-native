// The checkout screen and hook with react-native-webview mocked: the test plays the payment page by calling the
// onShouldStartLoadWithRequest handler the component gave the WebView, as the real WebView does on each navigation.
import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Button, Linking, Text, View } from "react-native"
import { useState } from "react"
import { AsvriCheckoutView, isExternalScheme, matchReturn, useAsvriCheckout, type AsvriCheckoutResult } from "../src"

const webviews: any[] = []
jest.mock("react-native-webview", () => {
  const { View } = require("react-native")
  return { WebView: (props: any) => { webviews.push(props); return <View testID={props.testID} /> } }
})
const lastWebView = () => webviews[webviews.length - 1]
const navigate = (url: string): boolean => lastWebView().onShouldStartLoadWithRequest({ url, navigationType: "other", mainDocumentURL: url, isTopFrame: true })

const CHECKOUT = "https://pay.asvri.com/?t=abc123"
const SUCCESS = "https://shop.example/thanks"
const CANCEL = "https://shop.example/cart?from=asvri"

beforeEach(() => { webviews.length = 0 })

describe("matchReturn", () => {
  test("the success URL with session_id: completed, with the id", async () => {
    expect(matchReturn(`${SUCCESS}?session_id=cs_test_8f2a91c04be7d3a61f20c9de`, SUCCESS, CANCEL)).toEqual({ status: "completed", sessionId: "cs_test_8f2a91c04be7d3a61f20c9de", url: `${SUCCESS}?session_id=cs_test_8f2a91c04be7d3a61f20c9de` })
  })
  test("trailing slash, host case and default port do not matter", async () => {
    expect(matchReturn("https://SHOP.example:443/thanks/?session_id=cs_live_ab12", SUCCESS)?.status).toBe("completed")
  })
  test("the cancel URL needs its own query parameters", async () => {
    expect(matchReturn(`${CANCEL}&session_id=cs_test_ab`, SUCCESS, CANCEL)?.status).toBe("cancelled")
    expect(matchReturn("https://shop.example/cart", SUCCESS, CANCEL)).toBeNull()
  })
  test("other pages are not returns", async () => {
    for (const u of ["https://pay.asvri.com/?t=abc", "https://checkout.paystack.com/x", "https://shop.example/thanks-not", "http://shop.example/thanks", "https://shop.example:8443/thanks", "https://evil.example/thanks", "javascript:alert(1)"]) {
      expect(matchReturn(u, SUCCESS, CANCEL)).toBeNull()
    }
  })
  test("a session_id that isn't an ASVRI id is dropped", async () => {
    expect(matchReturn(`${SUCCESS}?session_id=%3Cscript%3E`, SUCCESS)?.sessionId).toBeNull()
  })
  test("external schemes", async () => {
    expect(isExternalScheme("intent://pay#Intent;scheme=bank;end")).toBe(true)
    expect(isExternalScheme("tel:*737*000#")).toBe(true)
    expect(isExternalScheme("https://x.example")).toBe(false)
    expect(isExternalScheme("about:blank")).toBe(false)
  })
})

describe("AsvriCheckoutView", () => {
  const setup = async () => {
    const onResult = jest.fn()
    await render(<AsvriCheckoutView checkoutUrl={CHECKOUT} successUrl={SUCCESS} cancelUrl={CANCEL} onResult={onResult} />)
    return onResult
  }

  test("loads the payment page with JavaScript and DOM storage on", async () => {
    await setup()
    expect(lastWebView().source).toEqual({ uri: CHECKOUT })
    expect(lastWebView().javaScriptEnabled).toBe(true)
    expect(lastWebView().domStorageEnabled).toBe(true)
    expect(screen.getByText(/Secure payment/)).toBeTruthy()
  })

  test("gateway and 3-D Secure pages load inside; the success URL ends it as completed, once", async () => {
    const onResult = await setup()
    expect(navigate("https://checkout.paystack.com/xyz")).toBe(true)
    expect(navigate("https://acs.bank.example/3ds")).toBe(true)
    expect(navigate(`${SUCCESS}?session_id=cs_test_0a1b2c`)).toBe(false)
    expect(navigate(`${SUCCESS}?session_id=cs_test_0a1b2c`)).toBe(false)
    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult.mock.calls[0][0]).toMatchObject({ status: "completed", sessionId: "cs_test_0a1b2c" })
  })

  test("the cancel URL: cancelled", async () => {
    const onResult = await setup()
    expect(navigate(`${CANCEL}&session_id=cs_test_0a1b2c`)).toBe(false)
    expect(onResult.mock.calls[0][0].status).toBe("cancelled")
  })

  test("the close button: dismissed", async () => {
    const onResult = await setup()
    await fireEvent.press(screen.getByLabelText("Close"))
    expect(onResult.mock.calls[0][0]).toEqual({ status: "dismissed", sessionId: null, url: null })
  })

  test("bank-app and USSD links open outside, not in the WebView", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
    const onResult = await setup()
    expect(navigate("intent://pay#Intent;scheme=bankapp;end")).toBe(false)
    expect(navigate("tel:*737*000#")).toBe(false)
    expect(open).toHaveBeenCalledWith("intent://pay#Intent;scheme=bankapp;end")
    expect(open).toHaveBeenCalledWith("tel:*737*000#")
    expect(onResult).not.toHaveBeenCalled()
    open.mockRestore()
  })
})

describe("useAsvriCheckout", () => {
  function Shop({ onDone, checkoutUrl = CHECKOUT }: { onDone: (r: AsvriCheckoutResult | Error) => void; checkoutUrl?: string }) {
    const { open, checkout, isOpen } = useAsvriCheckout()
    const [shown, setShown] = useState("")
    return (
      <View>
        <Button title="Pay" onPress={() => {
          try {
            open({ checkoutUrl, successUrl: SUCCESS, cancelUrl: CANCEL }).then((r) => { setShown(r.status); onDone(r) })
          } catch (e) { onDone(e as Error) }
        }} />
        <Text testID="state">{isOpen ? "open" : shown}</Text>
        {checkout}
      </View>
    )
  }

  test("open() shows the checkout and resolves with completed + the session id; the modal goes away", async () => {
    const onDone = jest.fn()
    await render(<Shop onDone={onDone} />)
    await fireEvent.press(screen.getByText("Pay"))
    expect(screen.getByTestId("state").props.children).toBe("open")
    expect(screen.getByTestId("asvri-checkout")).toBeTruthy()
    await act(async () => { navigate(`${SUCCESS}?session_id=cs_test_9f`) })
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", sessionId: "cs_test_9f" }))
    expect(screen.queryByTestId("asvri-checkout")).toBeNull()
    expect(screen.getByTestId("state").props.children).toBe("completed")
  })

  test("Android back (the modal's onRequestClose): dismissed", async () => {
    const onDone = jest.fn()
    await render(<Shop onDone={onDone} />)
    await fireEvent.press(screen.getByText("Pay"))
    await fireEvent(screen.getByTestId("asvri-modal"), "requestClose")
    expect(onDone).toHaveBeenCalledWith({ status: "dismissed", sessionId: null, url: null })
    expect(screen.queryByTestId("asvri-checkout")).toBeNull()
  })

  test("a checkout URL that isn't http(s) is refused before anything opens", async () => {
    const onDone = jest.fn()
    await render(<Shop onDone={onDone} checkoutUrl="javascript:alert(1)" />)
    await fireEvent.press(screen.getByText("Pay"))
    expect(onDone.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(screen.queryByTestId("asvri-checkout")).toBeNull()
  })
})
