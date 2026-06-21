import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { headers } from "next/headers";
import { Building2, LayoutDashboard, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? "";

  const navItems = [
    { href: "/dashboard",             label: "Overview",    icon: LayoutDashboard },
    { href: "/dashboard/businesses",  label: "Businesses",  icon: Building2       },
    { href: "/dashboard/billing",     label: "Billing",     icon: CreditCard      },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-white border-r flex flex-col py-6 px-4 gap-1 fixed h-full">
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold tracking-tight">VoiceReview</h1>
          <p className="text-xs text-gray-400 mt-0.5">Business dashboard</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname.startsWith(href) && href !== "/dashboard"
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : pathname === href
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t pt-4 px-2 flex items-center gap-3">
          <UserButton />
          <span className="text-sm text-gray-500">Account</span>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}