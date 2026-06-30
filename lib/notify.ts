import { Resend } from "resend";
import type { Digest } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://voicereview.app";

function deltaLabel(delta: number) {
  if (delta > 0) return `up ${Math.abs(Math.round(delta))} pts`;
  if (delta < 0) return `down ${Math.abs(Math.round(delta))} pts`;
  return "flat";
}

/** Builds a responsive HTML email body for the digest. */
export function buildDigestEmail(digest: Digest, businessName: string): { subject: string; html: string } {
  const subject = `📊 ${businessName}: ${digest.totalReviews} reviews this week`;
  const delta = deltaLabel(digest.sentimentDelta);
  const deltaColor = digest.sentimentDelta >= 0 ? "#059669" : "#dc2626";

  const complaintRow =
    digest.topComplaint && digest.topComplaint !== "None"
      ? `<tr><td style="padding:6px 0;color:#475569">⚠️ Top complaint</td><td style="padding:6px 0;text-align:right;font-weight:600">${digest.topComplaint} (${digest.topComplaintMentions})</td></tr>`
      : `<tr><td style="padding:6px 0;color:#475569">⚠️ Top complaint</td><td style="padding:6px 0;text-align:right;font-weight:600">None 🎉</td></tr>`;
  const praiseRow =
    digest.topPraise && digest.topPraise !== "None"
      ? `<tr><td style="padding:6px 0;color:#475569">💚 Top praise</td><td style="padding:6px 0;text-align:right;font-weight:600">${digest.topPraise} (${digest.topPraiseMentions})</td></tr>`
      : "";

  const html = `<!DOCTYPE html>
<html><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
      <span style="font-size:18px;font-weight:700">VoiceReview</span>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <div style="background:#059669;color:#fff;padding:24px">
        <p style="margin:0;opacity:.85;font-size:13px">Weekly digest · ${businessName}</p>
        <h1 style="margin:6px 0 0;font-size:22px">${digest.headline ?? "Your week in reviews"}</h1>
      </div>
      <div style="padding:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:6px 0;color:#475569">Reviews this week</td>
            <td style="padding:6px 0;text-align:right;font-weight:600">${digest.totalReviews} <span style="color:#94a3b8;font-weight:400">(prev ${digest.prevTotalReviews})</span></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569">Sentiment</td>
            <td style="padding:6px 0;text-align:right;font-weight:600;color:${deltaColor}">${Math.round(digest.sentimentScore)}/100 · ${delta}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569">Avg rating</td>
            <td style="padding:6px 0;text-align:right;font-weight:600">${digest.avgRating.toFixed(1)} ★</td>
          </tr>
          ${complaintRow}
          ${praiseRow}
        </table>
        ${
          digest.recommendation
            ? `<div style="margin-top:20px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px">
                 <p style="margin:0;font-size:13px;color:#047857;font-weight:600">🎯 Do this</p>
                 <p style="margin:6px 0 0;font-size:15px">${digest.recommendation}${digest.retentionLift ? ` <b>→ +${digest.retentionLift}% retention</b>` : ""}</p>
               </div>`
            : ""
        }
        <a href="${APP_URL}/dashboard/digests" style="display:inline-block;margin-top:20px;background:#059669;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-size:14px;font-weight:600">View full digest →</a>
      </div>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">Powered by VoiceReview</p>
  </div>
</body></html>`;

  return { subject, html };
}

/** Sends an email via the Resend SDK. Throws if not configured or the API errors. */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email is not configured (RESEND_API_KEY missing)");

  console.log("API KEY RESEND WAALI : ", apiKey)

  const resend = new Resend(apiKey);
  const from = process.env.DIGEST_FROM_EMAIL ?? "VoiceReview <onboarding@resend.dev>";

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Email send failed: ${error.message ?? JSON.stringify(error)}`);
  }
}

/** Generates and sends the digest email. Returns whether it was sent. */
export async function deliverDigest(params: {
  digest: Digest;
  businessName: string;
  email?: string | null;
}): Promise<{ email: boolean; error?: string }> {
  if (!params.email) return { email: false, error: "No recipient email" };

  try {
    const { subject, html } = buildDigestEmail(params.digest, params.businessName);
    await sendEmail(params.email, subject, html);
    return { email: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Email delivery failed";
    console.error("Digest email delivery failed:", error);
    return { email: false, error };
  }
}
