import { NextResponse } from "next/server";
import { getCollection, stripMongoId } from "@/lib/mongodb";

export async function GET() {
  try {
    const workouts = await getCollection("workouts");
    const cursor = workouts.find({});
    const days = await cursor.toArray();
    return NextResponse.json(
      days
        .map((d) => stripMongoId(d as Record<string, unknown>))
        .sort((a, b) => (a.dayOfWeek as number) - (b.dayOfWeek as number))
    );
  } catch {
    return NextResponse.json([]);
  }
}
