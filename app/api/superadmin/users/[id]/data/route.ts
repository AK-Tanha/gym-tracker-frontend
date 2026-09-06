import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin, userScopedId } from "@/lib/auth";
import { getCollection, stringIdFilter } from "@/lib/mongodb";

// Returns a single athlete's full data for superadmin oversight.
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
    const user = await users.findOne({ id });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const { passwordHash, ...userSafe } = user as Record<string, unknown>;
    void passwordHash;

    const profileCol = await getCollection("profile");
    const profileDoc = await profileCol.findOne(stringIdFilter(userScopedId("profile", id)));

    const progCol = await getCollection("programs");
    const progDoc = await progCol.findOne(stringIdFilter(userScopedId("programs", id)));

    const loggedCol = await getCollection("logged-sets");
    const loggedDoc = await loggedCol.findOne(stringIdFilter(userScopedId("logged-sets", id)));

    const weightCol = await getCollection("bodyweight");
    const weightDoc = await weightCol.findOne(stringIdFilter(userScopedId("bodyweight", id)));

    return NextResponse.json({
      user: userSafe,
      profile: profileDoc ?? null,
      programs: progDoc?.myWorkouts ?? [],
      loggedSets: loggedDoc?.entries ?? [],
      bodyweight: weightDoc?.entries ?? [],
    });
  } catch (err) {
    console.error("Admin user data error:", err);
    return NextResponse.json({ error: "Failed to load user data." }, { status: 500 });
  }
}
