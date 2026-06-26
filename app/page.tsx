import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { PLANS, PlanKey } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Mic,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Code2,
  Gauge,
  Star,
  Check,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

const FEATURES: Record<PlanKey, string[]> = {
  free: ["1 business", "50 reviews / month", "Sentiment + ratings", "Return-rate prediction", "AI summaries"],
  pro: ["5 businesses", "500 reviews / month", "Audio replay", "Advanced metrics", "Performance charts"],
  business: ["20 businesses", "5,000 reviews / month", "Priority support", "Custom branding", "CSV export"],
};

const STEPS = [
  {
    icon: Code2,
    title: "Drop in the button",
    body: "Add the VoiceReview SDK button to your checkout, delivery screen, or post-service page with two lines of code.",
  },
  {
    icon: Mic,
    title: "Customers speak",
    body: "Instead of typing, customers tap once and leave honest voice feedback in seconds — far higher response rates.",
  },
  {
    icon: Sparkles,
    title: "AI does the rest",
    body: "We transcribe with Whisper and analyze with Gemini: rating, sentiment, return likelihood, and flagged issues.",
  },
];

const HIGHLIGHTS = [
  { icon: BarChart3, title: "Performance analytics", body: "Track ratings, sentiment mix, and return rate over time with clean, readable charts." },
  { icon: AlertTriangle, title: "Issue flagging", body: "Unhappy customers are surfaced instantly so you can act before they churn." },
  { icon: RotateCcw, title: "Return-rate prediction", body: "Every review is scored for how likely that customer is to come back." },
  { icon: ShieldCheck, title: "Secure by default", body: "Scoped API keys per business and signed webhooks keep your data locked down." },
  { icon: Gauge, title: "Fast & lightweight", body: "Results land in your dashboard within seconds of a recording finishing." },
  { icon: Sparkles, title: "AI summaries", body: "A one-line summary of every review so you grasp the gist at a glance." },
];

export default async function LandingPage() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);

  const primaryHref = signedIn ? "/dashboard" : "/sign-up";
  const primaryLabel = signedIn ? "Go to dashboard" : "Start free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Mic size={18} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">VoiceReview</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!signedIn && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute inset-0 bg-emerald-radial" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 text-center sm:px-8 lg:pt-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles size={13} className="text-primary" />
            Voice feedback, analyzed by AI
          </div>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Turn customer voices into{" "}
            <span className="text-primary">decisions you can act on</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            VoiceReview lets your customers leave feedback by speaking, not typing. We transcribe and
            analyze every review for rating, sentiment, and return likelihood — all in one clean dashboard.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free plan forever</p>

          {/* Hero preview card */}
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-card p-2 shadow-xl shadow-foreground/5">
            <div className="rounded-xl border border-border bg-background p-5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-accent text-primary">
                    <Mic size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Order #1042</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  😊 Happy
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < 5 ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"} />
                  ))}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  <RotateCcw size={11} /> 92% likely to return
                </span>
              </div>
              <p className="mt-3 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                &ldquo;Loved the service, the staff were friendly and the food came out fast.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Live in minutes, insight in seconds</h2>
            <p className="mt-3 text-muted-foreground">Three steps from install to actionable feedback.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                <span className="absolute right-5 top-5 text-5xl font-bold text-secondary">{i + 1}</span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                  <s.icon size={20} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Everything you need to understand customers</h2>
            <p className="mt-3 text-muted-foreground">Built for local businesses that care about retention.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <f.icon size={18} />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Pricing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Simple plans that scale with you</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you grow.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(([key, plan]) => {
              const popular = key === "pro";
              return (
                <div
                  key={key}
                  className={
                    "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm " +
                    (popular ? "border-primary ring-1 ring-primary" : "border-border")
                  }
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-base font-semibold">{plan.label}</h3>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{plan.price}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {FEATURES[key].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" variant={popular ? "default" : "outline"} asChild>
                    <Link href={primaryHref}>{key === "free" ? "Start free" : `Choose ${plan.label}`}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground shadow-lg sm:px-14">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Start hearing what your customers really think
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                Set up your first business and collect a voice review in under five minutes.
              </p>
              <Button size="lg" variant="secondary" className="mt-8" asChild>
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Mic size={15} />
            </span>
            <span className="text-sm font-semibold">VoiceReview</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} VoiceReview. Audio feedback for local businesses.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
