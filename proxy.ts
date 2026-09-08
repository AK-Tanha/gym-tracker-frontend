import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isSuperadmin = role === "superadmin";

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/signup");

  // Authenticated users hitting auth pages go to the appropriate home.
  if (isAuthPage && isLoggedIn) {
    const home = isSuperadmin ? "/admin" : "/dashboard";
    return Response.redirect(new URL(home, nextUrl));
  }

  // Unauthenticated users are sent to the login page for everything else.
  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Superadmin-only pages: non-superadmins get bounced to dashboard.
  const isAdminPage =
    nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/superadmin");
  if (isAdminPage && !isSuperadmin) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  return undefined;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - NextAuth auth API, registration, and public assets
     */
    "/((?!api/auth|api/register|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|webmanifest)$).*)",
  ],
};
