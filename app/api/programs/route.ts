import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";
import { programs, myWorkouts } from "@/lib/mockData";

const SETTINGS_ID = "programs";

export async function GET() {
  try {
    const programsCol = await getCollection("programs");
    const doc = await programsCol.findOne(stringIdFilter(SETTINGS_ID));
    if (doc) {
      return NextResponse.json(stripMongoId(doc));
    }
    return NextResponse.json({ programs, myWorkouts });
  } catch {
    return NextResponse.json({ programs, myWorkouts });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const programsCol = await getCollection("programs");
    await programsCol.updateOne(
      stringIdFilter(SETTINGS_ID),
      { $set: body },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save programs" }, { status: 500 });
  }
}