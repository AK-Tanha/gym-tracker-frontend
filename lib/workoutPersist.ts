import { ExecutionStep, PlannedExercise } from "./types";
import { LoggedSet } from "@/components/forms/LogSetForm";

const STORAGE_KEY = "statfit_active_workout";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    typeof window.localStorage.getItem === "function" &&
    typeof window.localStorage.removeItem === "function"
  );
}

export type PersistedWorkout = {
  date: string;
  index: number;
  completedSets: string[];
  pendingSets: ExecutionStep[];
  exerciseOrder: PlannedExercise[];
  queue: ExecutionStep[];
  loggedSets: LoggedSet[];
  syncedIds: string[];
};

export function saveWorkoutState(state: Omit<PersistedWorkout, "date">) {
  if (!canUseStorage()) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const payload: PersistedWorkout = { ...state, date: today };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadWorkoutState(): PersistedWorkout | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedWorkout = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.date !== today) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearWorkoutState() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
