import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutGrid, MessageSquareText, BarChart2, Paintbrush } from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid, path: "" },
  { key: "reviews", label: "Reviews", icon: MessageSquareText, path: "/reviews" },
  { key: "performance", label: "Performance", icon: BarChart2, path: "/performance" },
  { key: "customize", label: "Customize page", icon: Paintbrush, path: "/customize" },
] as const;

export type BusinessTabKey = (typeof TABS)[number]["key"];

export function BusinessTabs({
  businessId,
  active,
}: {
  businessId: string;
  active: BusinessTabKey;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={`/dashboard/businesses/${businessId}${tab.path}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={14} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
