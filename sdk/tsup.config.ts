import { defineConfig } from "tsup";
import { config as loadEnv } from "dotenv";

// Load the app's env files so the SDK bakes in YOUR production API URL at
// build time. .env.local overrides .env (same precedence as Next.js).
loadEnv({ path: "../.env" });
loadEnv({ path: "../.env.local", override: true });
// Allow a dedicated override too.
loadEnv({ path: ".env", override: true });

const API_BASE = (
  process.env.VOICEREVIEW_API_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  ""
).replace(/\/+$/, "");

if (!API_BASE) {
  console.warn(
    "\n⚠️  VoiceReview SDK: no API base URL found (set NEXT_PUBLIC_APP_URL in ../.env or VOICEREVIEW_API_URL). " +
      "The SDK will fall back to the host page origin at runtime.\n",
  );
}

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: ["react"],
  tsconfig: "tsconfig.json",
  // Inline the API base into the bundle as a literal string.
  define: {
    "process.env.VOICEREVIEW_API_BASE": JSON.stringify(API_BASE),
  },
});
