import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignupForm from "@/components/auth/SignupForm";
import { AuthShell, AuthHeader } from "@/components/auth/SignupForm";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <AuthHeader title="Create your account" subtitle="Start tracking your lifts today" />
      <SignupForm />
    </AuthShell>
  );
}
