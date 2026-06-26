import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  feature: string;
  description: string;
  requiredPlan?: "pro" | "business";
  className?: string;
  compact?: boolean;
}

export function UpgradePrompt({
  feature,
  description,
  requiredPlan = "pro",
  className,
  compact = false,
}: UpgradePromptProps) {
  const planLabel = requiredPlan === "pro" ? "Pro" : "Business";

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Lock size={13} />
        <span>{feature} is available on the</span>
        <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
          <Link href="/dashboard/billing">{planLabel} plan</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("border-dashed bg-accent/40", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <Lock size={20} />
        </div>
        <div>
          <p className="font-semibold">{feature}</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/billing">Upgrade to {planLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
