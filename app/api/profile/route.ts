import { NextRequest, NextResponse } from "next/server";
import { getCollection, stringIdFilter, stripMongoId } from "@/lib/mongodb";

const defaultProfile = {
  name: "AK Tanha",
  memberSince: "Jan 2026",
  initials: "AK",
  reminders: true,
  units: "kg",
  schedule: "Weekday",
};

export async function GET() {
  try {
    const profileCol = await getCollection("profile");
    const profile = await profileCol.findOne(stringIdFilter("profile"));
    if (profile) {
      return NextResponse.json(stripMongoId(profile));
    }
    return NextResponse.json(defaultProfile);
  } catch {
    return NextResponse.json(defaultProfile);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const profileCol = await getCollection("profile");
    await profileCol.updateOne(
      stringIdFilter("profile"),
      { $set: body },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}