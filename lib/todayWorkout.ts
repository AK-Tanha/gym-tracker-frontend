import { Program, WorkoutDay } from "./types";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getTodaysWorkout(program?: Program): WorkoutDay | undefined {
  if (!program?.workoutDays?.length) return undefined;
  const todayDow = new Date().getDay();
  return program.workoutDays.find((d) => d.dayOfWeek === todayDow);
}

export function todayName(dow?: number): string {
  return DAY_NAMES[dow ?? new Date().getDay()] ?? "Today";
}
