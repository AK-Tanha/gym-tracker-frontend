import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCollection } from "@/lib/mongodb";

export type UserRole = "user" | "superadmin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      units: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    units?: string;
    role?: UserRole;
  }
}

type UserDoc = {
  _id?: unknown;
  id: string;
  email: string;
  name: string;
  initials: string;
  passwordHash: string;
  units: string;
  role?: UserRole;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function findUserByEmail(email: string): Promise<UserDoc | null> {
  try {
    const users = await getCollection("users");
    const doc = await users.findOne({ email: email.toLowerCase() });
    if (!doc) return null;
    const { _id, ...rest } = doc as unknown as UserDoc & { _id: unknown };
    void _id;
    return rest;
  } catch {
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await findUserByEmail(email);
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          units: user.units,
          role: user.role ?? "user",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.units = user.units;
        token.name = user.name;
        token.role = user.role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.units = (token.units as string) ?? "kg";
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.role = (token.role as UserRole) ?? "user";
      }
      return session;
    },
  },
});

export async function requireSuperadmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "superadmin") {
    return null;
  }
  return session;
}

// Returns the current authenticated user's id, or null if not logged in.
// All user-scoped API routes should call this and 401 when it returns null.
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Returns the current authenticated user's id, or null if not logged in.
// Superadmins keep their own athlete data, so their id is returned too.
export async function currentAthleteId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Builds a per-user Mongo document key, e.g. "programs:u-xxxx".
// Keeps the existing single-document-per-collection format but scopes it
// to one document per user.
export function userScopedId(prefix: string, userId: string): string {
  return `${prefix}:${userId}`;
}
