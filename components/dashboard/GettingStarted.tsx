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
  apiKey,
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
        "Copy the code snippet and drop it into your app where customers can leave feedback.",
      icon: <Code2 size={18} />,
      done: hasBusiness, // unlocked once business exists
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
  const allDone = completedCount === steps.length;

  if (allDone) return null; // hide once complete

  return (
    <Card className="border-violet-100 bg-linear-to-br from-violet-50/60 to-white">
      <CardContent className="py-6 px-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Getting started</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {completedCount} of {steps.length} steps complete
            </p>
          </div>
          {/* Progress pills */}
          <div className="flex gap-1.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  s.done ? "bg-violet-500" : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isLocked = idx > 0 && !steps[idx - 1].done;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all",
                  step.done
                    ? "bg-white border-green-100"
                    : isLocked
                    ? "bg-gray-50 border-gray-100 opacity-50"
                    : "bg-white border-violet-100 shadow-sm"
                )}
              >
                {/* Icon / check */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    step.done
                      ? "bg-green-100 text-green-600"
                      : isLocked
                      ? "bg-gray-100 text-gray-400"
                      : "bg-violet-100 text-violet-600"
                  )}
                >
                  {step.done ? <Check size={16} /> : step.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.done ? "text-gray-400 line-through" : "text-gray-800"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Action */}
                {step.action && !isLocked && (
                  <Button
                    size="sm"
                    variant={step.done ? "ghost" : "default"}
                    className={cn(
                      "shrink-0 text-xs h-8 gap-1",
                      !step.done && "bg-violet-600 hover:bg-violet-700"
                    )}
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