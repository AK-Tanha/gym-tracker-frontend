"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IconBarbell } from "@tabler/icons-react";
import { TextInput, FormButton } from "@/components/forms/primitives";
import Link from "next/link";

export default function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to create account.");
        setSubmitting(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created — please sign in.");
        setSubmitting(false);
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Failed to create account.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <TextInput
        name="name"
        label="Full name"
        placeholder="e.g. AK Tanha"
        autoComplete="name"
        required
      />
      <TextInput
        type="email"
        name="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <TextInput
        type="password"
        name="password"
        label="Password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {error && (
        <p className="rounded-[10px] bg-plate-red/10 px-4 py-2.5 text-sm text-plate-red">
          {error}
        </p>
      )}
      <FormButton type="submit" loading={submitting} className="mt-1">
        Create account
      </FormButton>
      <p className="text-center text-sm text-chalk-faint">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#7FB2E8] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function AuthHeader({
  title,
  subtitle,
  icon: Icon = IconBarbell,
}: {
  title: string;
  subtitle: string;
  icon?: typeof IconBarbell;
}) {
  return (
    <div className="mb-7 flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-plate-red">
        <Icon size={28} className="text-white" />
      </div>
      <h1 className="font-display text-[26px] font-bold text-chalk">{title}</h1>
      <p className="mt-1 text-sm text-chalk-faint">{subtitle}</p>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center px-6 py-10">
      {children}
    </div>
  );
}
