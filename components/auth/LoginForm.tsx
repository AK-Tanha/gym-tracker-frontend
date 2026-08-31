"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { TextInput, FormButton } from "@/components/forms/primitives";
import Link from "next/link";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        placeholder="Enter your password"
        autoComplete="current-password"
        required
      />
      {state?.error && (
        <p className="rounded-[10px] bg-plate-red/10 px-4 py-2.5 text-sm text-plate-red">
          {state.error}
        </p>
      )}
      <FormButton type="submit" loading={pending} className="mt-1">
        Sign in
      </FormButton>
      <p className="text-center text-sm text-chalk-faint">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-[#7FB2E8] hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
