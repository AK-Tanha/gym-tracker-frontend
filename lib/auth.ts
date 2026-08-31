import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCollection } from "@/lib/mongodb";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      units: string;
    } & DefaultSession["user"];
  }

  interface User {
    units?: string;
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
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.units = (token.units as string) ?? "kg";
        session.user.name = (token.name as string) ?? session.user.name;
      }
      return session;
    },
  },
});
