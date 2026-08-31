import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";
import { AuthShell, AuthHeader } from "@/components/auth/SignupForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <AuthHeader title="Welcome back" subtitle="Sign in to continue your training" />
      <LoginForm />
    </AuthShell>
  );
}
