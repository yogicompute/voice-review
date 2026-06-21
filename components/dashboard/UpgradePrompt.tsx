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
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-gray-400", className)}>
        <Lock size={13} />
        <span>{feature} is available on the</span>
        <Button variant="link" size="sm" className="h-auto p-0 text-violet-600" asChild>
          <Link href="/dashboard/billing">
            {requiredPlan === "pro" ? "Pro" : "Business"} plan
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("border-dashed border-violet-200 bg-violet-50/40", className)}>
      <CardContent className="flex flex-col items-center justify-center py-10 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
          <Lock size={20} className="text-violet-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">{feature}</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>
        </div>
        <Button asChild className="bg-violet-600 hover:bg-violet-700">
          <Link href="/dashboard/billing">
            Upgrade to {requiredPlan === "pro" ? "Pro" : "Business"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}