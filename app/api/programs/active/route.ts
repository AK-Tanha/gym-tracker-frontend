import { NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";

const SETTINGS_ID = "programs";

export async function GET() {
  try {
    const programsCol = await getCollection("programs");
    const doc = await programsCol.findOne(stringIdFilter(SETTINGS_ID));
    const myWorkouts = doc?.myWorkouts ?? [];
    const active = myWorkouts.find((p: { isActive?: boolean }) => p.isActive);
    if (active) {
      return NextResponse.json(stripMongoId(active));
    }
    return NextResponse.json(null);
  } catch {
    return NextResponse.json(null);
  }
}
