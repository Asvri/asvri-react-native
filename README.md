# ASVRI Checkout for React Native

Take payments in your React Native app through every gateway you've connected to ASVRI (cards, bank transfer, USSD, mobile money). Your server makes a checkout session; the app opens it in a secure WebView and gets back whether the customer paid, cancelled or closed it.

React Native 0.74+ with [react-native-webview](https://github.com/react-native-webview/react-native-webview) 13+. Built and tested with bare React Native 0.88. Expo development builds include react-native-webview too and should work the same way, but haven't been tested yet.

## How it fits together

1. **Your server** creates the checkout session with your secret key. Use any ASVRI SDK: [Node](https://github.com/asvri/asvri-node), [PHP](https://github.com/asvri/asvri-php), [Python](https://github.com/asvri/asvri-python). It gives the app the session's `url`, `success_url` and `cancel_url`. **The secret key never goes in the app.**
2. **The app** opens it with `useAsvriCheckout`.
3. **Your server** confirms the payment, by retrieving the session or from the `checkout.session.completed` webhook, before you deliver anything.

## Install

```bash
npm install github:asvri/asvri-react-native react-native-webview
cd ios && pod install   # iOS
```

With Expo: `npx expo install react-native-webview`, then add this package.

## Use

```tsx
import { useAsvriCheckout } from "@asvri/react-native"

function PayButton({ orderId }: { orderId: string }) {
  const { open, checkout } = useAsvriCheckout()

  async function pay() {
    const session = await myApi.createCheckout(orderId)          // your server -> ASVRI
    const result = await open({
      checkoutUrl: session.url,
      successUrl: session.success_url,
      cancelUrl: session.cancel_url,
    })
    if (result.status === "completed") {
      const paid = await myApi.isPaid(result.sessionId)          // your server retrieves the session from ASVRI
    }
  }

  return (
    <>
      <Button title="Pay" onPress={pay} />
      {checkout}
    </>
  )
}
```

`result.status` is one of:

- `"completed"`: ASVRI sent the customer to your success URL. `result.sessionId` is the `cs_…` id.
- `"cancelled"`: they chose to go back.
- `"dismissed"`: they closed the screen, or pressed Android's back button.

How it behaves:

- **Return addresses:** the success and cancel URLs are never loaded in the app. The screen closes as soon as the page heads there.
- **Gateway pages:** 3-D Secure and gateway pages open inside the WebView.
- **Other apps:** links to bank apps and USSD (`intent:`, `tel:` and similar) open outside it.

To place the screen yourself, for example in your own navigator, use the view:

```tsx
<AsvriCheckoutView checkoutUrl={…} successUrl={…} cancelUrl={…} onResult={(r) => navigation.goBack()} />
```

A complete shop screen is in [`example/App.tsx`](example/App.tsx).

## Links

- API reference: https://www.asvri.com/developers/docs
- API playground: https://www.asvri.com/api-playground
- Flutter: https://github.com/asvri/asvri-flutter

MIT licence.
