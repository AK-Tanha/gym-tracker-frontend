import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";
import { currentAthleteId, userScopedId } from "@/lib/auth";

type BodyWeightEntry = { date: string; weight: number };

export async function GET() {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const col = await getCollection("bodyweight");
    const doc = await col.findOne(stringIdFilter(userScopedId("bodyweight", userId)));
    if (doc) return NextResponse.json(stripMongoId(doc));
    return NextResponse.json({ entries: [] });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as BodyWeightEntry;
    const col = await getCollection("bodyweight");
    const docId = stringIdFilter(userScopedId("bodyweight", userId));
    const doc = await col.findOne(docId);
    const entries: BodyWeightEntry[] = doc?.entries ?? [];
    const existing = entries.findIndex((e) => e.date === body.date);
    if (existing >= 0) {
      entries[existing] = body;
    } else {
      entries.push(body);
    }
    entries.sort((a, b) => a.date.localeCompare(b.date));
    await col.updateOne(docId, { $set: { entries } }, { upsert: true });
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Failed to save weight" }, { status: 500 });
  }
}
