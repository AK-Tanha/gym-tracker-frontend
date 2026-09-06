import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";
import { auth, currentAthleteId, userScopedId } from "@/lib/auth";

const defaultProfile = {
  name: "Athlete",
  memberSince: "",
  initials: "AT",
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
    const userId = await currentAthleteId();
    const session = await auth();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const profileCol = await getCollection("profile");
    const docId = userScopedId("profile", userId);
    const profile = await profileCol.findOne(stringIdFilter(docId));
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
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const profileCol = await getCollection("profile");
    const docId = userScopedId("profile", userId);
    await profileCol.updateOne(stringIdFilter(docId), { $set: body }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
