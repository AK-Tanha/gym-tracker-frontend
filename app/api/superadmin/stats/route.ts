import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";

export async function GET() {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await getCollection("users");
    const allUsers = await users.find({}).toArray();

    const totalUsers = allUsers.length;
    const superadmins = allUsers.filter((u) => u.role === "superadmin").length;
    const athletes = totalUsers - superadmins;

    // Aggregate activity across all per-user documents.
    let totalLoggedSets = 0;
    let totalPrograms = 0;
    const loggedCol = await getCollection("logged-sets");
    const loggedDocs = await loggedCol.find({}).toArray();
    for (const doc of loggedDocs) {
      totalLoggedSets += (doc?.entries ?? []).length;
    }

    const progCol = await getCollection("programs");
    const progDocs = await progCol.find({}).toArray();
    for (const doc of progDocs) {
      totalPrograms += (doc?.myWorkouts ?? []).length;
    }

    return NextResponse.json({
      totalUsers,
      superadmins,
      athletes,
      totalLoggedSets,
      totalPrograms,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
