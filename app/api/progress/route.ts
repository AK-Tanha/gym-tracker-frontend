import { NextResponse } from "next/server";
import { getCollection, stringIdFilter } from "@/lib/mongodb";

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

const DAY_INDEX = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EMPTY_RESPONSE = {
  workoutsDone: 0,
  streakDays: 0,
  weekStreak: [false, false, false, false, false, false, false],
  chartExercise: "",
  chartBars: [],
  recentPRs: [],
};

function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const loggedCol = await getCollection("logged-sets");
    const logged = await loggedCol.findOne(stringIdFilter("logged-sets"));
    const entries = (logged?.entries ?? []) as LoggedSetEntry[];

    const byDay = new Map<string, { maxByExercise: Map<string, number> }>();
    for (const e of entries) {
      if (!e.date) continue;
      const day = byDay.get(e.date) ?? {
        maxByExercise: new Map<string, number>(),
      };
      const key = e.exerciseName || "Unknown";
      day.maxByExercise.set(key, Math.max(day.maxByExercise.get(key) ?? 0, e.weight || 0));
      byDay.set(e.date, day);
    }

    const workoutDates = [...byDay.keys()].sort();
    const workoutsDone = workoutDates.length;

    let streakDays = 0;
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    for (let i = 0; i < 366; i++) {
      if (byDay.has(dateKey(now))) {
        streakDays++;
        now.setUTCDate(now.getUTCDate() - 1);
      } else {
        break;
      }
    }

    const today = new Date();
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    const weekStreak = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (mondayOffset - i));
      return byDay.has(dateKey(d));
    });

    const exerciseCounts = new Map<string, number>();
    for (const e of entries) {
      const name = e.exerciseName || "Unknown";
      exerciseCounts.set(name, (exerciseCounts.get(name) ?? 0) + 1);
    }
    const topExercise = [...exerciseCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    let chartMax = 0;
    const chartBars: { weight: number; height: number }[] = [];
    for (let i = 0; i < workoutDates.length; i += 7) {
      const weekBest = workoutDates
        .slice(i, i + 7)
        .reduce((m, date) => Math.max(m, byDay.get(date)?.maxByExercise.get(topExercise) ?? 0), 0);
      chartBars.push({ weight: weekBest, height: 0 });
      chartMax = Math.max(chartMax, weekBest);
    }
    for (const bar of chartBars) {
      bar.height = chartMax > 0 ? Math.round((bar.weight / chartMax) * 100) : 0;
    }

    const recentPRs: { name: string; when: string; value: string; previous: string; improvement: string }[] =
    [];
    if (workoutDates.length > 0) {
      const sorted = workoutDates;
      const priorMax = new Map<string, number>();
      for (const date of sorted.slice(0, -1)) {
        for (const [name, w] of byDay.get(date)?.maxByExercise ?? []) {
          priorMax.set(name, Math.max(priorMax.get(name) ?? 0, w));
        }
      }
      const lastDate = sorted[sorted.length - 1];
      const d = new Date(lastDate);
      const when = `${DAY_INDEX[d.getUTCDay()] ?? ""}, ${d.getUTCDate()} ${
        MONTH_SHORT[d.getUTCMonth()] ?? ""
      }`;
      const lastDay = byDay.get(lastDate)!;
      for (const [name, w] of lastDay.maxByExercise) {
        if (w <= 0) continue;
        const prev = priorMax.get(name) ?? 0;
        if (prev < w) {
          recentPRs.push({
            name,
            when,
            value: `${w}kg`,
            previous: `${prev}kg`,
            improvement: `+${w - prev}kg`,
          });
        }
      }
    }

    return NextResponse.json({
      workoutsDone,
      streakDays,
      weekStreak,
      chartExercise: topExercise,
      chartBars: chartBars.filter((b) => b.weight > 0),
      recentPRs,
    });
  } catch {
    return NextResponse.json(EMPTY_RESPONSE);
  }
}
