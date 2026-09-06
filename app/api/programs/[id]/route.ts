import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter } from "@/lib/mongodb";
import { currentAthleteId, userScopedId } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const programsCol = await getCollection("programs");
    const doc = await programsCol.findOne(stringIdFilter(userScopedId("programs", userId)));
    const myWorkouts = doc?.myWorkouts ?? [];
    const program = myWorkouts.find((p: { id: string }) => p.id === id);
    if (program) {
      return NextResponse.json(program);
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await currentAthleteId();
    if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id } = await params;
    const programsCol = await getCollection("programs");
    const docId = stringIdFilter(userScopedId("programs", userId));
    const doc = await programsCol.findOne(docId);
    const myWorkouts = (doc?.myWorkouts ?? []).map((p: { id: string }) =>
      p.id === id ? { ...p, ...body, isOwn: true } : p
    );
    await programsCol.updateOne(docId, { $set: { myWorkouts } }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
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
    const programsCol = await getCollection("programs");
    const docId = stringIdFilter(userScopedId("programs", userId));
    const doc = await programsCol.findOne(docId);
    const myWorkouts = (doc?.myWorkouts ?? []).filter(
      (p: { id: string }) => p.id !== id
    );
    await programsCol.updateOne(docId, { $set: { myWorkouts } }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
