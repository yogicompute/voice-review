import Link from "next/link";
import { Mic, Sparkles, BarChart3, ShieldCheck } from "lucide-react";

const POINTS = [
  { icon: Sparkles, text: "AI-analyzed voice reviews in seconds" },
  { icon: BarChart3, text: "Ratings, sentiment & return-rate insights" },
  { icon: ShieldCheck, text: "Secure, scoped API keys per business" },
];

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Mic size={18} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">VoiceReview</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-balance text-3xl font-semibold leading-tight">
            Hear what your customers really think.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <p.icon size={17} />
                </span>
                <span className="text-sm">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} VoiceReview
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Mic size={18} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">VoiceReview</span>
          </Link>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Shared Clerk appearance tuned to the emerald theme.
export const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "bg-transparent shadow-none p-0 gap-5",
    header: "hidden",
    footer: "bg-transparent",
    socialButtonsBlockButton:
      "border border-border bg-card hover:bg-secondary text-foreground rounded-lg",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    formFieldLabel: "text-foreground",
    formFieldInput:
      "rounded-lg border border-input bg-card focus:border-primary focus:ring-2 focus:ring-primary/30",
    formButtonPrimary:
      "bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm normal-case shadow-sm",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    identityPreviewEditButton: "text-primary",
    formResendCodeLink: "text-primary",
  },
  variables: {
    colorPrimary: "#059669",
    borderRadius: "0.6rem",
  },
} as const;
