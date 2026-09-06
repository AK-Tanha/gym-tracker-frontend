import { NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";
import { currentAthleteId, userScopedId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json(null);

    const programsCol = await getCollection("programs");
    const doc = await programsCol.findOne(stringIdFilter(userScopedId("programs", userId)));
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
