import { NextRequest, NextResponse } from "next/server";
import { getCollection, stripMongoId } from "@/lib/mongodb";

export async function GET() {
  try {
    const workouts = await getCollection("workouts");
    const workout = await workouts.findOne({ dayOfWeek: 0 });
    if (workout) {
      return NextResponse.json(stripMongoId(workout));
    }
    return NextResponse.json(null);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workouts = await getCollection("workouts");
    const { dayOfWeek } = body;
    const result = await workouts.updateOne(
      { dayOfWeek },
      { $set: body },
      { upsert: true }
    );
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch {
    return NextResponse.json({ error: "Failed to save workout" }, { status: 500 });
  }
}