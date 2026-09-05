import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";

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

const DOC_ID = "logged-sets";

export async function GET() {
  try {
    const col = await getCollection("logged-sets");
    const doc = await col.findOne(stringIdFilter(DOC_ID));
    if (doc) return NextResponse.json(stripMongoId(doc));
    return NextResponse.json({ entries: [] });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function DELETE() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const col = await getCollection("logged-sets");
    const doc = await col.findOne(stringIdFilter(DOC_ID));
    const entries = (doc?.entries ?? []) as LoggedSetEntry[];
    await col.updateOne(
      stringIdFilter(DOC_ID),
      { $set: { entries: entries.filter((e) => e.date !== today) } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reset today's log" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { entries: LoggedSetEntry[] };
    const col = await getCollection("logged-sets");
    await col.updateOne(
      stringIdFilter(DOC_ID),
      {
        $push: { entries: { $each: body.entries } },
      } as unknown as Parameters<typeof col.updateOne>[1],
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save logged sets" }, { status: 500 });
  }
}
