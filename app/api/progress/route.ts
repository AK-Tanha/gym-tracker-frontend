import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";

const STATS_ID = "stats";

export async function GET() {
  try {
    const progress = await getCollection("progress");
    const stats = await progress.findOne(stringIdFilter(STATS_ID));
    if (stats) {
      return NextResponse.json(stripMongoId(stats));
    }
    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const progress = await getCollection("progress");
    await progress.updateOne(
      stringIdFilter(STATS_ID),
      { $set: body },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}