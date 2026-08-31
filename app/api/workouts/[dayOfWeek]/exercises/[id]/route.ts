import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { WorkoutDay, PlannedExercise } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ dayOfWeek: string; id: string }> }
) {
  try {
    const body = await request.json();
    const { dayOfWeek: dow, id } = await params;
    const dayOfWeek = parseInt(dow, 10);
    const workouts = await getCollection("workouts");
    const doc = await workouts.findOne({ dayOfWeek });
    const day = (doc ?? {}) as Partial<WorkoutDay>;
    const exercises = (day.exercises ?? []).map((ex: PlannedExercise) =>
      ex.id === id ? { ...ex, ...body } : ex
    );
    await workouts.updateOne(
      { dayOfWeek },
      { $set: { ...day, dayOfWeek, exercises } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ dayOfWeek: string; id: string }> }
) {
  try {
    const { dayOfWeek: dow, id } = await params;
    const dayOfWeek = parseInt(dow, 10);
    const workouts = await getCollection("workouts");
    const doc = await workouts.findOne({ dayOfWeek });
    const day = (doc ?? {}) as Partial<WorkoutDay>;
    const exercises = (day.exercises ?? []).filter(
      (ex: PlannedExercise) => ex.id !== id
    );
    await workouts.updateOne(
      { dayOfWeek },
      { $set: { ...day, dayOfWeek, exercises } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
  }
}
