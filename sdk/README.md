# @voicereview/sdk

Drop-in **voice review button** for React. Let customers leave feedback by speaking instead of typing — the audio is transcribed and analyzed (rating, sentiment, return-likelihood, issue flags) and lands in your VoiceReview dashboard within seconds.

- 🎙️ One component, records in the browser
- ⚡ Zero backend work — posts straight to your VoiceReview API
- 🎨 Themeable + fully customizable labels
- 📦 Ships ESM + CJS + TypeScript types

## Install

```bash
npm install @voicereview/sdk
# or: pnpm add @voicereview/sdk / yarn add @voicereview/sdk
```

`react` (>=18) is a peer dependency — it uses the React already in your app.

## Quick start

```tsx
import { VoiceReviewButton } from "@voicereview/sdk";

export default function ThankYou({ orderId }: { orderId: string }) {
  return (
    <VoiceReviewButton
      apiKey="vr_live_xxxxxxxxxxxx"
      businessId="biz_xxxxxxxx"
      customerRef={orderId}
      onSuccess={(r) => console.log("Rating:", r.rating, "Sentiment:", r.sentiment)}
    />
  );
}
```

Grab your `apiKey` and `businessId` from your VoiceReview dashboard (Businesses → API credentials).

> The SDK posts to the VoiceReview API automatically — the endpoint is baked into the package, so it works no matter what site it's embedded on. You only need the `endpoint` prop if you want to point it at a different (e.g. self-hosted) instance.

## Props

| Prop             | Type                                   | Default                         | Description |
| ---------------- | -------------------------------------- | ------------------------------- | ----------- |
| `apiKey`         | `string` **(required)**                | —                               | Your publishable API key (`vr_live_…`). |
| `businessId`     | `string` **(required)**                | —                               | The business the review belongs to. |
| `customerRef`    | `string`                               | —                               | Opaque reference (order ID, table, etc.) saved on the review. |
| `endpoint`       | `string`                               | baked-in VoiceReview API        | Override only to target a different/self-hosted instance. |
| `maxDuration`    | `number`                               | `30`                            | Max recording length in seconds. |
| `showResultCard` | `boolean`                              | `true`                          | Show the built-in result card after submitting. |
| `onSuccess`      | `(result: ReviewResult) => void`       | —                               | Called with the analyzed result. |
| `onError`        | `(error: string) => void`              | —                               | Called on failure. |
| `className`      | `string`                               | —                               | Extra classes on the wrapper. |
| `style`          | `React.CSSProperties`                  | —                               | Inline styles on the wrapper. |
| `theme`          | `{ primary, background, text, borderRadius }` | see below                | Visual theming. |
| `labels`         | `{ idle, recording, processing, success, error }` | see below            | Override all UI copy. |

### `ReviewResult`

```ts
interface ReviewResult {
  reviewId: string;
  rating: number;          // 1–5
  sentiment: string;       // superhappy | happy | neutral | sad | angry
  likelyReturnRate: number;// 0–100
  issueFlag: boolean;
  summary: string;
}
```

## Theming

```tsx
<VoiceReviewButton
  apiKey="vr_live_xxx"
  businessId="biz_xxx"
  endpoint="https://your-domain.com/api/review"
  theme={{
    primary: "#059669",
    background: "#ffffff",
    text: "#111827",
    borderRadius: "16px",
  }}
  labels={{
    idle: "How was your experience?",
    recording: "Listening… tap to stop",
    processing: "Saving your feedback…",
    success: "Thanks for your feedback!",
  }}
/>
```

Theme defaults: `primary` `#7c3aed`, `background` `#ffffff`, `text` `#111827`, `borderRadius` `12px`.

## Notes

- The component is a **client component** (`"use client"`), so it works in Next.js App Router, Vite, CRA, and any React 18+ setup.
- It requests microphone permission via the browser's `MediaRecorder` API, so it must run over HTTPS (or `localhost`).

## License

MIT
