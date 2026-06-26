import { SignUp } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/AuthShell";

export default function SignUpPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start collecting voice reviews for free">
      <SignUp
        appearance={clerkAppearance}
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
