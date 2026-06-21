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
  default: "text-violet-600 bg-violet-50",
  green:   "text-green-600 bg-green-50",
  amber:   "text-amber-600 bg-amber-50",
  red:     "text-red-600 bg-red-50",
};

export function StatCard({ label, value, icon: Icon, sub, accent = "default" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={cn("p-2.5 rounded-lg", ACCENT[accent])}>
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}