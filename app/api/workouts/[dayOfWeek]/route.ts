import { NextRequest, NextResponse } from "next/server";
import { getCollection, stripMongoId } from "@/lib/mongodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dayOfWeek: string }> }
) {
  try {
    const { dayOfWeek } = await params;
    const workouts = await getCollection("workouts");
    const workout = await workouts.findOne({ dayOfWeek: parseInt(dayOfWeek, 10) });
    if (workout) {
      return NextResponse.json(stripMongoId(workout));
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ dayOfWeek: string }> }
) {
  try {
    const body = await request.json();
    const { dayOfWeek } = await params;
    const workouts = await getCollection("workouts");
    await workouts.updateOne(
      { dayOfWeek: parseInt(dayOfWeek, 10) },
      { $set: { ...body, dayOfWeek: parseInt(dayOfWeek, 10) } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update workout" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ dayOfWeek: string }> }
) {
  try {
    const { dayOfWeek } = await params;
    const workouts = await getCollection("workouts");
    await workouts.deleteOne({ dayOfWeek: parseInt(dayOfWeek, 10) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete workout" }, { status: 500 });
  }
}