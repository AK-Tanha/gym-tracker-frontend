"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

function getErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    switch (error.type) {
      case "CredentialsSignin":
        return "Invalid email or password.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}

export async function loginAction(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: getErrorMessage(error) };
    }
    // Auth.js throws a redirect error on success — rethrow it so Next.js handles redirect.
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
