# VoiceReview

**Voice feedback for local businesses, analyzed by AI.** Customers leave reviews by *speaking* instead of typing — VoiceReview transcribes the audio, scores it (rating, sentiment, return-likelihood, issue flags), and turns it into insights, weekly digests, and shareable social cards.

Built with Next.js (App Router), Clerk, Neon/Postgres + Drizzle, Groq Whisper, Google Gemini, Cloudinary, Razorpay, Resend, and Inngest.

---

## Features

- 🎙️ **Voice reviews** — one-tap in-browser recording via the embeddable SDK button or a hosted page.
- 🧠 **AI analysis** — Groq Whisper transcribes; Gemini Flash returns rating, sentiment, return-rate, issue flag, and a one-line summary.
- 📊 **Dashboard & analytics** — per-business ratings, sentiment mix, and return-rate charts.
- 📨 **Weekly AI digest** — an emailed "voice of customer" summary (top complaint, top praise, one recommended action) via Resend, on a Vercel cron.
- 🔳 **QR-to-voice** — a printable QR that opens a branded public review page (`/r/[slug]`) — bridges offline shops with zero code.
- ✨ **Shareable moments** — glowing reviews auto-become branded social cards (`/s/[id]`) with native share + download.
- 💳 **Billing** — Razorpay subscription plans (feature-flagged) with Free/Pro/Business tiers.
- 📦 **SDK** — [`@voicereview/sdk`](./sdk) — a drop-in `<VoiceReviewButton />` for any React app.

---

## Tech stack

| Area            | Tool |
| --------------- | ---- |
| Framework       | Next.js 16 (App Router, React 19) |
| Auth            | Clerk |
| Database / ORM  | Neon Postgres + Drizzle |
| Transcription   | Groq (Whisper) |
| Analysis        | Google Gemini Flash |
| Audio storage   | Cloudinary |
| Email           | Resend |
| Payments        | Razorpay |
| Background jobs | Inngest (optional queue mode) |
| Styling         | Tailwind CSS v4 + shadcn-style UI |

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create `.env.local` (see [Environment variables](#environment-variables)).

### 3. Set up the database

```bash
npx drizzle-kit generate   # generate migrations from schema
npx drizzle-kit migrate    # apply them to your Neon database
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional background services:

```bash
npm run dev:inngest   # local Inngest dev server (only if QUEUE_ENABLED=true)
npm run dev:webhook   # ngrok tunnel for Clerk / Razorpay webhooks
```

---

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Public base URL (used by QR codes, share cards, emails) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk auth |
| `CLERK_WEBHOOK_SECRET` | Verifies the Clerk user webhook |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `..._SIGN_UP_URL`, `..._AFTER_SIGN_IN_URL`, `..._AFTER_SIGN_UP_URL` | Clerk routing |
| `GROQ_API_KEY` | Whisper transcription |
| `GEMINI_API_KEY` | Gemini analysis |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Audio storage |
| `RESEND_API_KEY`, `DIGEST_FROM_EMAIL` | Weekly digest email |
| `CRON_SECRET` | Bearer secret for the digest cron (`/api/digests/run`) |
| `NEXT_PUBLIC_RAZORPAY_ENABLED` | Feature-flag payments (`false` = grant plans instantly) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Razorpay |
| `NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID`, `NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID` | Razorpay plan IDs |
| `QUEUE_ENABLED`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Optional background processing |

> Secrets (e.g. `CLERK_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`) must **not** use the `NEXT_PUBLIC_` prefix — that would expose them in the browser bundle.

---

## Project structure

```
app/
  page.tsx                     Marketing landing page
  (auth)/                      Clerk sign-in / sign-up
  dashboard/                   Authenticated app
    page.tsx                   Overview + analytics
    businesses/                Register, detail (API keys + QR), reviews, performance
    digests/                   Weekly AI digest management
    moments/                   Shareable review cards
    billing/                   Plans + Razorpay checkout
  r/[slug]/                    Public QR voice-review page
  s/[id]/                      Public shareable review card (+ opengraph-image)
  api/                         review, businesses, digests, billing, webhooks, inngest
lib/                           db, ai, analytics, digest, notify, share, plans, razorpay
components/                    dashboard + UI components
sdk/                           @voicereview/sdk — the embeddable button (published separately)
drizzle/                       migrations
```

---

## Key routes

| Route | Description |
| ----- | ----------- |
| `/` | Marketing landing page |
| `/dashboard` | Overview + analytics |
| `/r/[slug]` | Public voice-review page (QR target) |
| `/s/[id]` | Public shareable review card |
| `POST /api/review` | Ingest a voice review (used by the SDK; CORS-enabled) |
| `GET /api/digests/run` | Weekly digest cron (Bearer `CRON_SECRET`) |
| `POST /api/webhook/clerk` | Sync users from Clerk |
| `POST /api/webhook/razorpay` | Sync subscription state |

---

## The SDK

The embeddable button lives in [`sdk/`](./sdk) and is published as `@voicereview/sdk`. It records audio and posts to your VoiceReview API (the domain is baked in at build time). See [`sdk/README.md`](./sdk/README.md).

```tsx
import { VoiceReviewButton } from "@voicereview/sdk";

<VoiceReviewButton apiKey="vr_live_..." businessId="biz_..." customerRef={orderId} />
```

---

## Deployment (Vercel)

1. Push to GitHub and import the repo into Vercel.
2. Add every variable from [Environment variables](#environment-variables) in **Project → Settings → Environment Variables**.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL.
4. The weekly digest cron is defined in [`vercel.json`](./vercel.json); setting `CRON_SECRET` lets Vercel authenticate it automatically.
5. Point the Clerk and Razorpay webhooks at `https://<your-domain>/api/webhook/clerk` and `/api/webhook/razorpay`.
6. Run the database migration against production (`npx drizzle-kit migrate`).

---

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Lint with ESLint |
| `npm run dev:inngest` | Local Inngest dev server |
| `npm run dev:webhook` | ngrok tunnel for webhooks |

---

## License

Proprietary — © VoiceReview. All rights reserved.
