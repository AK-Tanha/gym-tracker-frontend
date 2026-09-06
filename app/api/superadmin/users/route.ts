import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";

export async function GET() {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await getCollection("users");
    const docs = await users.find({}).sort({ _id: -1 }).toArray();

    const safe = docs.map(({ passwordHash: _ph, ...rest }) => {
      void _ph;
      return rest;
    });
    return NextResponse.json({ users: safe });
  } catch (err) {
    console.error("Admin users list error:", err);
    return NextResponse.json({ error: "Failed to list users." }, { status: 500 });
  }
}

const createUserSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8),
  units: z.enum(["kg", "lbs"]).optional().default("kg"),
  role: z.enum(["user", "superadmin"]).optional().default("user"),
});

export async function POST(request: NextRequest) {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid name, email, and password (8+ chars)." },
        { status: 400 }
      );
    }

    const { name, email, password, units, role } = parsed.data;
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
      units,
      role,
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
    console.error("Admin create user error:", err);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
