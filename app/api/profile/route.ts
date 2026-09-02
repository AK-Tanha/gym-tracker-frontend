import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";
import { auth } from "@/lib/auth";

const defaultProfile = {
  name: "AK Tanha",
  memberSince: "Jan 2026",
  initials: "AK",
  reminders: true,
  units: "kg",
  schedule: "Weekday",
};

function monthYear(date: Date | string | undefined) {
  if (!date) return undefined;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export async function GET() {
  try {
    const session = await auth();
    const profileCol = await getCollection("profile");
    const profile = await profileCol.findOne(stringIdFilter("profile"));
    const base = profile ? stripMongoId(profile) : { ...defaultProfile };

    let memberSince: string | undefined = base.memberSince;
    if (!memberSince && session?.user?.email) {
      const users = await getCollection("users");
      const user = await users.findOne({ email: session.user.email.toLowerCase() });
      memberSince = monthYear(user?.memberSince);
    }
    if (!memberSince) memberSince = defaultProfile.memberSince;

    return NextResponse.json({ ...base, memberSince });
  } catch {
    return NextResponse.json(defaultProfile);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const profileCol = await getCollection("profile");
    await profileCol.updateOne(
      stringIdFilter("profile"),
      { $set: body },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}