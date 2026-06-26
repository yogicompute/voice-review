import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "./CopyButton";
import { Badge } from "@/components/ui/badge";

interface CodeGuideProps {
  apiKey: string;
  businessId: string;
}

export function CodeGuide({ apiKey, businessId }: CodeGuideProps) {
  const installSnippet = `npm install @voicereview/sdk`;

  const basicSnippet = `import { VoiceReviewButton } from "@voicereview/sdk";

export default function OrderConfirmation({ orderId }) {
  return (
    <div>
      <h1>Order delivered! 🎉</h1>

      <VoiceReviewButton
        apiKey="${apiKey}"
        businessId="${businessId}"
        customerRef={orderId}
      />
    </div>
  );
}`;

  const advancedSnippet = `<VoiceReviewButton
  apiKey="${apiKey}"
  businessId="${businessId}"
  customerRef={orderId}
  maxDuration={30}
  onSuccess={(result) => {
    console.log("Rating:", result.rating);
    console.log("Sentiment:", result.sentiment);
    // redirect or show thank-you screen
  }}
  onError={(err) => console.error(err)}
  theme={{
    primary: "#your-brand-color",
    borderRadius: "12px",
    background: "#ffffff",
  }}
  labels={{
    idle: "How was your experience?",
    recording: "Listening... tap to stop",
    success: "Thanks for your feedback!",
  }}
  style={{ maxWidth: "380px", margin: "0 auto" }}
/>`;

  const curlSnippet = `curl -X POST https://yourdomain.com/api/review \\
  -H "x-api-key: ${apiKey}" \\
  -F "audio=@/path/to/audio.mp3" \\
  -F "customerRef=order_123"`;

  return (
    <div className="space-y-5">
      {/* Step 1 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">Step 1</Badge>
            <CardTitle className="text-sm font-medium">Install the SDK</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-[#19232F] text-slate-100 ring-1 ring-white/10 rounded-lg p-4 text-sm font-mono">
              {installSnippet}
            </pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={installSnippet} dark />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">Step 2</Badge>
            <CardTitle className="text-sm font-medium">
              Add the button after order delivery
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Drop this into your order confirmation page, delivery screen, or
            post-service modal.
          </p>
          <div className="relative">
            <pre className="bg-[#19232F] text-slate-100 ring-1 ring-white/10 rounded-lg p-4 text-sm font-mono overflow-x-auto leading-relaxed">
              {basicSnippet}
            </pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={basicSnippet} dark />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">Step 3</Badge>
            <CardTitle className="text-sm font-medium">
              Customize (optional)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Adjust colors, labels, max duration, and handle results in your own UI.
          </p>
          <div className="relative">
            <pre className="bg-[#19232F] text-slate-100 ring-1 ring-white/10 rounded-lg p-4 text-sm font-mono overflow-x-auto leading-relaxed">
              {advancedSnippet}
            </pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={advancedSnippet} dark />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REST fallback */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">REST</Badge>
            <CardTitle className="text-sm font-medium">
              Not using React? Use the API directly
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Send audio as multipart/form-data to the endpoint with your API key header.
          </p>
          <div className="relative">
            <pre className="bg-[#19232F] text-slate-100 ring-1 ring-white/10 rounded-lg p-4 text-sm font-mono overflow-x-auto">
              {curlSnippet}
            </pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={curlSnippet} dark />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}