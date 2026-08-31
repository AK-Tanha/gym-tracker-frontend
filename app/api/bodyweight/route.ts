import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";

type BodyWeightEntry = { date: string; weight: number };

const DOC_ID = "weights";

export async function GET() {
  try {
    const col = await getCollection("bodyweight");
    const doc = await col.findOne(stringIdFilter(DOC_ID));
    if (doc) return NextResponse.json(stripMongoId(doc));
    return NextResponse.json({ entries: [] });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BodyWeightEntry;
    const col = await getCollection("bodyweight");
    const doc = await col.findOne(stringIdFilter(DOC_ID));
    const entries: BodyWeightEntry[] = doc?.entries ?? [];
    const existing = entries.findIndex((e) => e.date === body.date);
    if (existing >= 0) {
      entries[existing] = body;
    } else {
      entries.push(body);
    }
    entries.sort((a, b) => a.date.localeCompare(b.date));
    await col.updateOne(stringIdFilter(DOC_ID), { $set: { entries } }, { upsert: true });
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Failed to save weight" }, { status: 500 });
  }
}
