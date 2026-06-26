import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />
      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
