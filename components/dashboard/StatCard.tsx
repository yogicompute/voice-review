import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  accent?: "default" | "green" | "amber" | "red";
}

const ACCENT = {
  default: "text-primary bg-accent",
  green: "text-emerald-600 bg-emerald-50",
  amber: "text-amber-600 bg-amber-50",
  red: "text-red-600 bg-red-50",
};

export function StatCard({ label, value, icon: Icon, sub, accent = "default" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground/70">{sub}</p>}
          </div>
          <div className={cn("rounded-lg p-2.5", ACCENT[accent])}>
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
