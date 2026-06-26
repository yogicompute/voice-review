"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      suppressHydrationWarning
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <Sun size={17} className="hidden dark:block" />
      <Moon size={17} className="block dark:hidden" />
    </button>
  );
}
