import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Building2, LayoutDashboard, CreditCard } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r flex flex-col py-6 px-4 gap-1 fixed h-full">
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold tracking-tight">VoiceReview</h1>
          <p className="text-xs text-gray-400 mt-0.5">Business dashboard</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LayoutDashboard size={16} />
            Overview
          </Link>
          <Link
            href="/dashboard/businesses"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Building2 size={16} />
            Businesses
          </Link>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <CreditCard size={16} />
            Billing
          </Link>
        </nav>

        <div className="border-t pt-4 px-2 flex items-center gap-3">
          <UserButton />
          <span className="text-sm text-gray-500">Account</span>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}