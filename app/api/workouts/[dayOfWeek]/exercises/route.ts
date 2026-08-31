import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { WorkoutDay } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dayOfWeek: string }> }
) {
  try {
    const body = await request.json();
    const dayOfWeek = parseInt((await params).dayOfWeek, 10);
    const workouts = await getCollection("workouts");
    const doc = await workouts.findOne({ dayOfWeek });
    const day = (doc ?? {}) as Partial<WorkoutDay>;
    const exercises = day.exercises ?? [];
    const next: WorkoutDay = {
      dayLabel: day.dayLabel ?? `Day ${dayOfWeek + 1}`,
      category: day.category,
      dayOfWeek,
      isRestDay: false,
      exercises: [...exercises, body],
    };
    await workouts.updateOne({ dayOfWeek }, { $set: next }, { upsert: true });
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ error: "Failed to add exercise" }, { status: 500 });
  }
}
