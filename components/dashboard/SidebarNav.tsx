"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Building2,
  Sparkles,
  CreditCard,
  BookOpen,
  Menu,
  X,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/businesses", label: "Businesses", icon: Building2 },
  { href: "/dashboard/digests", label: "Digests", icon: Sparkles },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/getting-started", label: "Setup guide", icon: BookOpen },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon size={17} className={active ? "text-primary" : ""} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-1">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Mic size={18} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">VoiceReview</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">Business dashboard</span>
      </span>
    </Link>
  );
}

function useDisplayName() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return "…";
  return (
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account"
  );
}

export function SidebarNav() {
  const [open, setOpen] = useState(false);
  const displayName = useDisplayName();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
        <div className="mb-7">
          <Brand />
        </div>
        <div className="flex-1">
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Menu
          </p>
          <NavLinks />
        </div>
        <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
          <UserButton />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">Manage account</p>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar px-4 py-6 shadow-xl">
            <div className="mb-7 flex items-center justify-between">
              <Brand />
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
