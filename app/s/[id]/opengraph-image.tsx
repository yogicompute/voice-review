import { ImageResponse } from "next/og";
import { db, reviews } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const alt = "Customer review";
export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

const EMOJI: Record<string, string> = {
  superhappy: "🤩",
  happy: "😊",
  neutral: "😐",
  sad: "😔",
  angry: "😠",
};

// A gold (or faded) star drawn as SVG so it always renders.
function Star({ filled, size: s = 60 }: { filled: boolean; size?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "rgba(255,255,255,0.28)"}>
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.401 8.168L12 18.896l-7.335 3.866 1.401-8.168L.132 9.21l8.2-1.192z" />
    </svg>
  );
}

function Mic({ size: s = 34, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" fill={color} stroke="none" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

// Scattered confetti pieces (behind the content).
const CONFETTI = [
  { left: 60, top: 70, s: 26, c: "#fde047", r: 20, round: true },
  { left: 300, top: 40, s: 18, c: "#22d3ee", r: 0, round: false },
  { left: 720, top: 60, s: 30, c: "#f472b6", r: 35, round: false },
  { left: 930, top: 110, s: 22, c: "#a3e635", r: 0, round: true },
  { left: 990, top: 320, s: 16, c: "#fff", r: 15, round: false },
  { left: 40, top: 300, s: 20, c: "#60a5fa", r: 25, round: false },
  { left: 120, top: 520, s: 14, c: "#fb7185", r: 0, round: true },
  { left: 1000, top: 560, s: 28, c: "#fde047", r: 40, round: false },
  { left: 70, top: 760, s: 24, c: "#34d399", r: 10, round: true },
  { left: 260, top: 900, s: 18, c: "#c084fc", r: 30, round: false },
  { left: 560, top: 960, s: 22, c: "#22d3ee", r: 0, round: true },
  { left: 860, top: 900, s: 16, c: "#fff", r: 20, round: false },
  { left: 980, top: 820, s: 26, c: "#fb923c", r: 45, round: false },
  { left: 470, top: 90, s: 14, c: "#a3e635", r: 0, round: true },
];

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, id),
    with: { business: true },
  });

  const businessName = review?.business?.name ?? "Our business";
  const logoUrl = review?.business?.logoUrl ?? null;
  const rating = Math.max(0, Math.min(5, review?.rating ?? 5));
  const quote =
    review?.summary?.trim() ||
    review?.transcript?.trim() ||
    "A wonderful experience — highly recommended!";
  const emoji = EMOJI[review?.sentiment ?? "happy"] ?? "😊";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 60,
          background: "linear-gradient(135deg, #6d28d9 0%, #db2777 48%, #f59e0b 100%)",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: -150,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.35), rgba(255,255,255,0))",
            display: "flex",
          }}
        />
        {/* Confetti */}
        {CONFETTI.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              width: p.round ? p.s : p.s * 0.5,
              height: p.s,
              background: p.c,
              borderRadius: p.round ? p.s : 3,
              transform: `rotate(${p.r}deg)`,
              opacity: 0.9,
              display: "flex",
            }}
          />
        ))}

        {/* White testimonial card */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            background: "#ffffff",
            borderRadius: 48,
            padding: 64,
            boxShadow: "0 40px 90px rgba(0,0,0,0.25)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} width={92} height={92} style={{ borderRadius: 22, objectFit: "cover" }} alt="" />
              ) : (
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 22,
                    background: "linear-gradient(135deg,#6d28d9,#db2777)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Mic size={44} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 46, fontWeight: 800, color: "#0f172a" }}>{businessName}</div>
                <div style={{ fontSize: 26, color: "#64748b" }}>Verified voice review</div>
              </div>
            </div>
            {/* Rating badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#fef3c7",
                borderRadius: 999,
                padding: "14px 26px",
              }}
            >
              <Star filled size={34} />
              <span style={{ fontSize: 40, fontWeight: 800, color: "#b45309" }}>{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Quote */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 160, lineHeight: 0.7, fontWeight: 800, color: "#db2777", display: "flex" }}>
              &ldquo;
            </div>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.22, color: "#0f172a" }}>{quote}</div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} filled={i < rating} size={62} />
              ))}
              <span style={{ fontSize: 66, marginLeft: 14 }}>{emoji}</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                paddingTop: 30,
                borderTop: "2px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#6d28d9,#db2777)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mic size={26} />
              </div>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>VoiceReview</span>
              <span style={{ fontSize: 28, color: "#94a3b8" }}>· real voices, verified feedback</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
