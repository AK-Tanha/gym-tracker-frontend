import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";

type UserRecord = {
  id: string;
  email: string;
  name: string;
  initials: string;
  passwordHash: string;
  units: string;
  role?: string;
  memberSince: string;
  [key: string]: unknown;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const users = await getCollection("users");
    const doc = await users.findOne({ id });
    if (!doc) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { passwordHash, ...safe } = doc as unknown as UserRecord;
    void passwordHash;
    return NextResponse.json({ user: safe });
  } catch (err) {
    console.error("Admin get user error:", err);
    return NextResponse.json({ error: "Failed to get user." }, { status: 500 });
  }
}

const updateUserSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  email: z.string().email().optional(),
  units: z.enum(["kg", "lbs"]).optional(),
  role: z.enum(["user", "superadmin"]).optional(),
  password: z.string().min(8).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update data." },
        { status: 400 }
      );
    }

    const users = await getCollection("users");
    const existing = await users.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const { password, ...rest } = parsed.data;

    if (rest.name !== undefined) {
      updateData.name = rest.name.trim();
      const initials = rest.name
        .trim()
        .split(/\s+/)
        .map((w: string) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
      updateData.initials = initials;
    }
    if (rest.email !== undefined) {
      const normalizedEmail = rest.email.toLowerCase();
      const duplicate = await users.findOne({
        email: normalizedEmail,
        id: { $ne: id },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      updateData.email = normalizedEmail;
    }
    if (rest.units !== undefined) updateData.units = rest.units;
    if (rest.role !== undefined) updateData.role = rest.role;

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      const { passwordHash: _ph, ...safe } = existing as unknown as UserRecord;
      void _ph;
      return NextResponse.json({ user: safe }, { status: 200 });
    }

    await users.updateOne({ id }, { $set: updateData });

    const updated = await users.findOne({ id });
    const { passwordHash: _p, ...safe } = (updated ?? {}) as unknown as UserRecord;
    void _p;
    return NextResponse.json({ user: safe });
  } catch (err) {
    console.error("Admin update user error:", err);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const users = await getCollection("users");
    const existing = await users.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Prevent superadmin from deleting themselves
    if ((existing as unknown as UserRecord).id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    await users.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin delete user error:", err);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}