import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";
import { currentAthleteId, userScopedId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const programsCol = await getCollection("programs");
    const doc = await programsCol.findOne(stringIdFilter(userScopedId("programs", userId)));
    if (doc) {
      return NextResponse.json(stripMongoId(doc));
    }
    return NextResponse.json({ myWorkouts: [] });
  } catch {
    return NextResponse.json({ myWorkouts: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const programsCol = await getCollection("programs");
    await programsCol.updateOne(
      stringIdFilter(userScopedId("programs", userId)),
      { $set: body },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save programs" }, { status: 500 });
  }
}
