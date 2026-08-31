import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCollection } from "@/lib/mongodb";

const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid name, email, and password (8+ chars)." },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const users = await getCollection("users");
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const cleanedName = name.trim();
    const initials = cleanedName
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: `u-${Math.random().toString(36).slice(2, 10)}`,
      email: normalizedEmail,
      name: cleanedName,
      initials,
      passwordHash,
      units: "kg",
      memberSince: new Date().toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),
    };

    await users.insertOne(user as unknown as Document);

    const { passwordHash: _ph, ...safe } = user;
    void _ph;
    return NextResponse.json({ user: safe }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Failed to register." }, { status: 500 });
  }
}
