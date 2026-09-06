import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";
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

export async function GET() {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const col = await getCollection("logged-sets");
    const doc = await col.findOne(stringIdFilter(userScopedId("logged-sets", userId)));
    if (doc) return NextResponse.json(stripMongoId(doc));
    return NextResponse.json({ entries: [] });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function DELETE() {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const today = new Date().toISOString().slice(0, 10);
    const col = await getCollection("logged-sets");
    const docId = stringIdFilter(userScopedId("logged-sets", userId));
    const doc = await col.findOne(docId);
    const entries = (doc?.entries ?? []) as LoggedSetEntry[];
    await col.updateOne(
      docId,
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
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as { entries: LoggedSetEntry[] };
    const col = await getCollection("logged-sets");
    await col.updateOne(
      stringIdFilter(userScopedId("logged-sets", userId)),
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
