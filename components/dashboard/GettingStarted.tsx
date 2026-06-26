import { Check, Building2, Code2, Mic, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  done: boolean;
  action?: { label: string; href: string };
}

interface GettingStartedProps {
  hasBusiness: boolean;
  hasReview: boolean;
  businessId?: string;
  apiKey?: string;
}

export function GettingStarted({
  hasBusiness,
  hasReview,
  businessId,
}: GettingStartedProps) {
  const steps: Step[] = [
    {
      id: 1,
      title: "Register your business",
      description:
        "Add your business to get a unique API key and business ID for the SDK.",
      icon: <Building2 size={18} />,
      done: hasBusiness,
      action: hasBusiness
        ? undefined
        : { label: "Register business", href: "/dashboard/businesses/new" },
    },
    {
      id: 2,
      title: "Install the SDK button",
      description:
        "Copy the snippet and drop it into your app where customers leave feedback.",
      icon: <Code2 size={18} />,
      done: hasBusiness,
      action:
        hasBusiness && businessId
          ? { label: "View credentials", href: `/dashboard/businesses/${businessId}` }
          : undefined,
    },
    {
      id: 3,
      title: "Receive your first review",
      description:
        "Once the button is live, customers can record voice feedback in seconds.",
      icon: <Mic size={18} />,
      done: hasReview,
      action:
        hasBusiness && !hasReview
          ? { label: "Test the button", href: "/test-button" }
          : hasReview && businessId
            ? { label: "View reviews", href: `/dashboard/businesses/${businessId}/reviews` }
            : undefined,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  if (completedCount === steps.length) return null;

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-accent/60 to-card">
      <CardContent className="space-y-5 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Getting started</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {completedCount} of {steps.length} steps complete
            </p>
          </div>
          <div className="flex gap-1.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  s.done ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isLocked = idx > 0 && !steps[idx - 1].done;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-4 rounded-xl border p-4 transition-all",
                  step.done
                    ? "border-emerald-200/70 bg-card"
                    : isLocked
                      ? "border-border bg-secondary/50 opacity-60"
                      : "border-primary/20 bg-card shadow-sm",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                    step.done
                      ? "bg-emerald-100 text-emerald-600"
                      : isLocked
                        ? "bg-secondary text-muted-foreground"
                        : "bg-accent text-primary",
                  )}
                >
                  {step.done ? <Check size={16} /> : step.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {step.action && !isLocked && (
                  <Button
                    size="sm"
                    variant={step.done ? "ghost" : "default"}
                    className="h-8 shrink-0 gap-1 text-xs"
                    asChild
                  >
                    <Link href={step.action.href}>
                      {step.action.label}
                      <ChevronRight size={12} />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
