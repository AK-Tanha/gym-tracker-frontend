import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter } from "@/lib/mongodb";
import { currentAthleteId, userScopedId } from "@/lib/auth";

type LoggedSetEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  unit: "reps" | "time";
  weight: number;
  reps: number;
  duration: number;
  rpe: number | null;
  notes: string;
  date: string;
};

const EDITABLE_FIELDS = [
  "exerciseName",
  "muscleGroup",
  "setNumber",
  "unit",
  "weight",
  "reps",
  "duration",
  "rpe",
  "notes",
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const col = await getCollection("logged-sets");
    const docId = stringIdFilter(userScopedId("logged-sets", userId));
    const doc = await col.findOne(docId);
    const entries = (doc?.entries ?? []) as LoggedSetEntry[];
    const idx = entries.findIndex((e) => e.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const patch: Partial<LoggedSetEntry> = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) patch[field] = body[field] as never;
    }

    entries[idx] = { ...entries[idx], ...patch };
    await col.updateOne(docId, { $set: { entries } }, { upsert: true });
    return NextResponse.json({ success: true, entry: entries[idx] });
  } catch {
    return NextResponse.json({ error: "Failed to update set" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const col = await getCollection("logged-sets");
    const docId = stringIdFilter(userScopedId("logged-sets", userId));
    const doc = await col.findOne(docId);
    const entries = (doc?.entries ?? []) as LoggedSetEntry[];
    const next = entries.filter((e) => e.id !== id);
    if (next.length === entries.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await col.updateOne(docId, { $set: { entries: next } }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete set" }, { status: 500 });
  }
}