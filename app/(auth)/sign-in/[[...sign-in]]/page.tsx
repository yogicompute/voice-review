import { SignIn } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/AuthShell";

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your VoiceReview dashboard">
      <SignIn
        appearance={clerkAppearance}
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
