import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { nextUrl } = request;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;
  const isSuperadmin = role === "superadmin";

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/signup");

  if (isAuthPage && isLoggedIn) {
    const home = isSuperadmin ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const isAdminPage =
    nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/superadmin");
  if (isAdminPage && !isSuperadmin) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/register|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|webmanifest)$).*)",
  ],
};
