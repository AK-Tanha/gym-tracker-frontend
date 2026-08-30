import { NextResponse } from "next/server";
import { getCollection, stringIdFilter } from "@/lib/mongodb";
import { todaysWorkout, weekStrip, programs, myWorkouts, progressStats } from "@/lib/mockData";
import { WorkoutDay } from "@/lib/types";

const profileSeed = {
  name: "AK Tanha",
  memberSince: "Jan 2026",
  initials: "AK",
  reminders: true,
  units: "kg",
  schedule: "Weekday",
};

function placeholderWorkout(dayOfWeek: number, dayLabel: string, category: string): WorkoutDay {
  return {
    dayLabel,
    category,
    dayOfWeek,
    isRestDay: false,
    exercises: [
      {
        id: `ph-a-${dayOfWeek}`,
        name: `${category} barbell press`,
        muscleGroup: category,
        type: "single",
        groupId: null,
        sets: 3,
        reps: 8,
        weight: 50,
        restBetweenSets: 90,
        restBetweenReps: 0,
      },
      {
        id: `ph-b-${dayOfWeek}`,
        name: `${category} accessory`,
        muscleGroup: category,
        type: "single",
        groupId: null,
        sets: 3,
        reps: 12,
        weight: 20,
        restBetweenSets: 60,
        restBetweenReps: 0,
      },
    ],
  };
}

export async function GET() {
  try {
    const workouts = await getCollection("workouts");

    await workouts.updateOne(
      { dayOfWeek: todaysWorkout.dayOfWeek },
      { $set: todaysWorkout },
      { upsert: true }
    );

    const labels: Record<number, string> = {
      0: "Chest + Triceps",
      1: "Back + Biceps",
      2: "Legs + Core",
      3: "Shoulders",
      4: "Arms",
      5: "Glutes + Hamstrings",
      6: "Full body",
    };
    for (const day of weekStrip) {
      if (day.isWorkout && day.dayOfWeek !== todaysWorkout.dayOfWeek) {
        await workouts.updateOne(
          { dayOfWeek: day.dayOfWeek },
          { $set: placeholderWorkout(day.dayOfWeek, labels[day.dayOfWeek] ?? "Workout", labels[day.dayOfWeek] ?? "Workout") },
          { upsert: true }
        );
      }
    }

    const programsCol = await getCollection("programs");
    await programsCol.updateOne(
      stringIdFilter("programs"),
      { $set: { programs, myWorkouts } },
      { upsert: true }
    );

    const progress = await getCollection("progress");
    await progress.updateOne(
      stringIdFilter("stats"),
      { $set: progressStats },
      { upsert: true }
    );

    const profileCol = await getCollection("profile");
    await profileCol.updateOne(
      stringIdFilter("profile"),
      { $set: profileSeed },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      collections: ["workouts", "programs", "progress", "profile"],
    });
  } catch (error) {
    console.error("Seed failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Seed failed. Check that MONGODB_URI is set in .env.local and the cluster is reachable.",
      },
      { status: 500 }
    );
  }
}